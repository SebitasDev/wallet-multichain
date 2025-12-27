import { NextRequest, NextResponse } from "next/server";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { processCCTPSettlement } from "../services/cctp";
import { processGaslessSettlement } from "../services/gasless";
import { processNearSettlement } from "../services/near";
import { SettleResponse, CrossChainConfig } from "@/app/facilitator/types";

/**
 * POST /api/bridge/settle
 *
 * Unified Settlement Endpoint (Smart Router)
 * Routes the request to the appropriate service (CCTP, Gasless, etc.) based on chain capabilities.
 */
export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error("[SmartRouter] Failed to parse JSON body:", e);
            return NextResponse.json({ success: false, errorReason: "Invalid JSON body" }, { status: 400 });
        }
        const { paymentPayload, sourceChain, destChain, recipient, amount, destToken, sourceToken, senderAddress } = body;


        console.log(`[SmartRouter] Request: ${sourceChain} -> ${destChain}`, { amount, senderAddress, sourceToken, destToken });

        const sourceConfig = NETWORKS[sourceChain as ChainKey];
        const destConfig = NETWORKS[destChain as ChainKey];

        if (!sourceConfig || !destConfig) {
            return NextResponse.json<SettleResponse>({
                success: false,
                errorReason: `Unsupported chain configuration`
            }, { status: 400 });
        }

        // --- ROUTING LOGIC ---

        // 1. Same Chain -> Gasless Transfer (Only if tokens match)
        if (sourceChain === destChain && (sourceToken === destToken || !destToken)) {
            console.log("[SmartRouter] Routing to: Gasless Service");
            const result = await processGaslessSettlement(
                paymentPayload,
                sourceChain,
                amount,
                recipient
            );
            return NextResponse.json(result);
        }

        // 2. Cross Chain: CCTP
        // Check if both chains support CCTP
        const sourceCCTP = sourceConfig.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;
        const destCCTP = destConfig.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;

        // Default to USDC if destToken is missing (backward compatibility) 
        // BUT strict verification: if sourceToken is explicitly NOT USDC, we shouldn't default target to USDC blindly unless it's a known swap?
        // Actually, if destToken is undefined, we assume it's a USDC transfer for legacy reasons.
        // However, if sourceToken is defined and is NOT named "USDC", we should be careful.

        let targetToken = destToken;
        if (!targetToken) {
            if (sourceToken && sourceToken !== "USDC") {
                // If source is NOT USDC, and dest is undefined, imply dest is SAME as source 
                targetToken = sourceToken;
            } else {
                targetToken = "USDC";
            }
        }

        if (sourceCCTP && destCCTP && targetToken === "USDC" && (sourceToken === "USDC" || !sourceToken)) {
            console.log("[SmartRouter] Routing to: CCTP Service");

            const destinationDomain = destConfig.crossChainInformation?.circleInformation?.cCTPInformation?.domain;

            if (destinationDomain === undefined) {
                return NextResponse.json<SettleResponse>({
                    success: false,
                    errorReason: "Destination chain does not have CCTP domain configured"
                }, { status: 400 });
            }

            // Construct crossChainConfig internally
            const crossChainConfig: CrossChainConfig = {
                destinationChain: destChain,
                destinationDomain: destinationDomain,
                mintRecipient: recipient // For CCTP, mintRecipient usually is final recipient
            };

            const result = await processCCTPSettlement(
                paymentPayload,
                sourceChain,
                amount,
                crossChainConfig,
                recipient
            );
            return NextResponse.json(result);
        }

        // 3. Near Intents (Fallback if CCTP not available or preferred for specific route)
        // Note: CCTP block above already handled the priority if both support CCTP.

        const sourceNear = sourceConfig.crossChainInformation.nearIntentInformation?.support;
        const destNear = destConfig.crossChainInformation.nearIntentInformation?.support;

        if (sourceNear && destNear) {
            console.log("[SmartRouter] Routing to: Near Intents Service");

            const result = await processNearSettlement(
                paymentPayload,
                sourceChain as ChainKey,
                destChain as ChainKey,
                amount,
                recipient,
                destToken,
                sourceToken,
                senderAddress // Pass optional sender
            );
            return NextResponse.json(result);
        }

        return NextResponse.json<SettleResponse>({
            success: false,
            errorReason: "No suitable routing path found for these chains"
        }, { status: 400 });

    } catch (error) {
        console.error("[SmartRouter] Error:", error);
        return NextResponse.json<SettleResponse>({
            success: false,
            errorReason: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
