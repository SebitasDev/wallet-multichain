import { NextRequest, NextResponse } from "next/server";
import { processEvmGaslessPay, processStellarGaslessPay } from "./service";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { chain, amount, recipient, payload } = body;

        console.log(`POST /api/pay/gasless - Chain: ${chain}, Amount: ${amount}`);

        if (!chain || !amount || !recipient || !payload) {
            return NextResponse.json(
                { error: "Missing required fields: chain, amount, recipient, payload" },
                { status: 400 }
            );
        }

        let result;
        if (chain === "stellar") {
            result = await processStellarGaslessPay({
                chain,
                amountStr: amount.toString(),
                recipient,
                payload
            });
        } else if (chain === "base" || chain === "optimism" || chain === "arbitrum" || chain === "polygon" || chain === "avalanche") {
            // Currently supporting Base as primary, but logic is generic if config exists
            result = await processEvmGaslessPay({
                chain,
                amountStr: amount.toString(),
                recipient,
                payload
            });
        } else {
            return NextResponse.json(
                { error: `Unsupported chain: ${chain}` },
                { status: 400 }
            );
        }

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error("Gasless Pay Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}


