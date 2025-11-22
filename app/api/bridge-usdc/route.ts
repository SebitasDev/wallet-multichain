import { NextRequest, NextResponse } from "next/server";
import { bridgeUSDC } from "@/app/utils/bridgeARC";

export async function POST(req: NextRequest) {
    const { amount, fromChain, toChain } = await req.json();

    try {
        const result = await bridgeUSDC(
            "0xea85b089b693c58e262d2a1fd35d8f8f4566db40968a80070a90786566c10c4c", // tu private key del servidor
            fromChain,
            toChain,
            "0x0b00a75637601e0F1B98d7B79b28A77c1f64E16D",
            amount,
        );
        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
    }
}
