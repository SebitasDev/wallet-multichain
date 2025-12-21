import { NextRequest, NextResponse } from "next/server";
import { StellarBridgePayload, StellarBridgeResponse } from "@/app/stellar-transfer-core/config";
import { processStellarToEvm, processEvmToStellar } from "../bridge-service";

export async function POST(request: NextRequest) {
    try {
        const body: StellarBridgePayload = await request.json();
        const { sourceChain, amount, recipientStellar, recipientOther, paymentPayload, signedXDR } = body;

        console.log(">>> [Stellar Bridge USDC] Request received:", {
            sourceChain,
            amount,
            recipientStellar,
            recipientOther
        });

        const amountStr = amount.toString();
        const IS_DEV = process.env.NODE_ENV === 'development';
        const FEE = IS_DEV ? 0 : 0.05;

        // -- LOGIC: Stellar -> EVM --
        if (sourceChain === "Stellar") {
            const bridgeCost = 0.25;
            const minAmount = FEE + bridgeCost;
            const amountNum = parseFloat(amountStr);

            if (amountNum < minAmount) {
                return NextResponse.json<StellarBridgeResponse>({
                    success: false,
                    errorReason: `Amount too low. Minimum required: ${minAmount} USDC (${FEE} Fee + ${bridgeCost} Bridge)`
                }, { status: 400 });
            }

            const result = await processStellarToEvm({
                amountStr,
                sourceChain,
                targetChain: body.targetChain,
                recipientOther,
                signedXDR,
                fee: FEE
            });
            return NextResponse.json(result);
        }

        // -- LOGIC: EVM -> Stellar --
        // Min Amount Validation
        const BRIDGE_MIN = 0.03;
        const MIN_AMOUNT = FEE + BRIDGE_MIN;
        const amountNum = parseFloat(amountStr);
        if (amountNum < MIN_AMOUNT) {
            return NextResponse.json<StellarBridgeResponse>({
                success: false,
                errorReason: `Amount too low. Minimum required: ${MIN_AMOUNT} USDC. (${FEE} Fee + ${BRIDGE_MIN} Bridge)`
            }, { status: 400 });
        }

        const result = await processEvmToStellar({
            amountStr,
            sourceChain,
            recipientStellar,
            paymentPayload,
            fee: FEE
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error(">>> [Stellar Bridge USDC] Error:", error);
        return NextResponse.json<StellarBridgeResponse>({
            success: false,
            errorReason: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

