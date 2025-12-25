import { NextRequest, NextResponse } from "next/server";
import { getOneClickQuote } from "@/app/stellar-transfer-core/sdk-service";
import { PlatformFess } from "@/app/constants/platformFess";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sourceChain, targetChain, amount, token, sourceToken } = body;

        console.log(">>> [Bridge Quote] Request:", { sourceChain, targetChain, amount, token, sourceToken });

        if (!amount || isNaN(amount)) {
            return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
        }

        const amountNum = parseFloat(amount);
        const IS_DEV = process.env.NODE_ENV === 'development';
        const FEE = IS_DEV ? PlatformFess.DEV : PlatformFess.EVM_TO_OTHER;

        // Validation removed as per user request (let provider handle it)
        const MIN_AMOUNT = FEE;

        const netAmountBridged = (amountNum - FEE).toFixed(6);

        const dummyEvm = "0x0000000000000000000000000000000000000000";
        // Stellar dummy (Random valid public key)
        const dummyStellar = "GB7BDSZU2Y27LYNLJLVEGW5TIVYQ6362DS5QZ5F6S27S227227227AAA";

        const sender = sourceChain === "Stellar" ? dummyStellar : dummyEvm;

        const quoteResult = await getOneClickQuote({
            amount: netAmountBridged,
            sourceChain,
            destinationChain: targetChain || "Base",
            userSenderAddress: sender,
            recipientStellar: targetChain === "Stellar" ? dummyStellar : dummyEvm,
            destinationToken: token,
            sourceToken: sourceToken,
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

