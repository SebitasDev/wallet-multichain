import { NextRequest, NextResponse } from "next/server";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { SettleResponse, FacilitatorPaymentPayload } from "@/app/facilitator/types";
import { BridgeManager } from "../services/BridgeManager";
import { BridgeContext } from "../services/types";

// Instantiate Manager (Singleton-like)
const bridgeManager = new BridgeManager();

/**
 * POST /api/bridge/settle
 *
 * Unified Settlement Endpoint (Smart Router)
 * Routes the request to the appropriate service (CCTP, Gasless, etc.) based on chain capabilities using Strategy Pattern.
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

        if (!NETWORKS[sourceChain as ChainKey] || !NETWORKS[destChain as ChainKey]) {
            return NextResponse.json<SettleResponse>({
                success: false,
                errorReason: `Unsupported chain configuration`
            }, { status: 400 });
        }

        // Build Context
        const context: BridgeContext = {
            paymentPayload: paymentPayload as FacilitatorPaymentPayload,
            sourceChain: sourceChain as ChainKey,
            destChain: destChain as ChainKey,
            sourceToken,
            destToken,
            amount: typeof amount === 'number' ? amount.toString() : amount, // Ensure string
            recipient,
            senderAddress,
            privateKey: (body as any).overrideCredentials?.privateKey || (body as any).privateKey
        };


        // Execute Strategy
        const result = await bridgeManager.execute(context);

        // Return result with appropriate status code
        // If success is false but no errorReason (rare), default to 400? 
        // Or just return 200 with success: false? Usually 200 is better for app logic handling
        return NextResponse.json(result);

    } catch (error) {
        console.error("[SmartRouter] Error:", error);
        return NextResponse.json<SettleResponse>({
            success: false,
            errorReason: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
