import { NextRequest, NextResponse } from "next/server";
import { crossChainTransfer } from "@/app/cross-chain-core/crossChainTransfer";

export async function POST(req: NextRequest) {
    const body = await req.json();

    console.log("🔵 /api/bridge-usdc CALLED");
    console.log("Body:", body);

    const { amount, fromChain, toChain, privateKey, recipient } = body;

    try {
        console.log("➡️ Starting crossChainTransfer...");
        const result = await crossChainTransfer(
            privateKey as `0x${string}`,
            fromChain,
            toChain,
            recipient,
            amount
        );

        const safe = sanitizeTransferResult(result);

        console.log("✅ crossChainTransfer SUCCESS:", result);
        return NextResponse.json(safe);
    } catch (err: any) {
        console.error("❌ ERROR in /api/bridge-usdc");
        console.error("RAW ERROR:", err);
        console.error("ERROR KEYS:", Object.keys(err || {}));
        console.error("STRINGIFIED:", JSON.stringify(err, null, 2));

        return NextResponse.json(
            {
                error: err?.message ?? "Unknown error",
                raw: JSON.stringify(err)
            },
            { status: 500 }
        );
    }
}

function sanitizeTransferResult(result: any) {
    return JSON.parse(JSON.stringify(result, (_key, value) => {
        // Convertir BigInt → string
        if (typeof value === "bigint") return value.toString();

        // Eliminar providers u objetos circulares
        if (typeof value === "object" && value !== null) {
            if ("account" in value || "transport" in value) {
                return undefined; // viem client / provider
            }
        }

        return value;
    }));
}