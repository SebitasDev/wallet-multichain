import { NextRequest, NextResponse } from "next/server";
import { getOneClickQuote } from "@/app/stellar-transfer-core/sdk-service";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sourceChain, targetChain, amount, token } = body;

        console.log(">>> [Bridge Quote] Request:", { sourceChain, targetChain, amount, token });

        if (!amount || isNaN(amount)) {
            return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
        }

        const amountNum = parseFloat(amount);
        const IS_DEV = process.env.NODE_ENV === 'development';
        const FEE = IS_DEV ? 0 : 0.05;

        let bridgeMin = 0.03;

        // Update Minimums Logic
        if (sourceChain === "Stellar") {
            // Stellar -> EVM: Higher minimum (0.25) + Fee
            bridgeMin = 0.25;
        }

        const MIN_AMOUNT = FEE + bridgeMin;

        if (amountNum < MIN_AMOUNT) {
            return NextResponse.json({
                success: false,
                error: `Amount too low. Minimum required: ${MIN_AMOUNT} USDC`,
                minAmount: MIN_AMOUNT,
                protocolFee: FEE
            }, { status: 400 });
        }

        const netAmountBridged = (amountNum - FEE).toFixed(6);

        // Call 1-Click with Dry Run
        // Use dummy addresses for quote estimation if not provided, 
        // assuming 1-Click validatlon allows standard formats.
        // EVM dummy: "0x0000000000000000000000000000000000000000"
        // Stellar dummy: "G..." (we'll see if it validates strictly or just format)

        const dummyEvm = "0x0000000000000000000000000000000000000000";
        // Stellar dummy (Random valid public key)
        const dummyStellar = "GB7BDSZU2Y27LYNLJLVEGW5TIVYQ6362DS5QZ5F6S27S227227227AAA";

        const sender = sourceChain === "Stellar" ? dummyStellar : dummyEvm;
        // If target is Stellar and we want XLM, we pass XLM token logic inside service

        const quoteResult = await getOneClickQuote({
            amount: netAmountBridged,
            sourceChain,
            destinationChain: targetChain || "Base",
            userSenderAddress: sender,
            recipientStellar: targetChain === "Stellar" ? dummyStellar : undefined,
            destinationToken: token,
            options: { dry: true }
        });

        return NextResponse.json({
            success: true,
            amountSent: amountNum,
            protocolFee: FEE,
            netAmountBridged: parseFloat(netAmountBridged),
            estimatedReceived: quoteResult.estimatedOutput,
            minAmount: MIN_AMOUNT
        });

    } catch (error) {
        console.error(">>> [Bridge Quote] Error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown quote error"
        }, { status: 500 });
    }
}
