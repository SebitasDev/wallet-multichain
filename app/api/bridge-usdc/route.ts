import { NextRequest, NextResponse } from "next/server";
import { bridgeUSDC } from "@/app/utils/bridgeARC";

export async function POST(req: NextRequest) {
    const { amount, fromChain, toChain, privateKey, recipient } = await req.json();

    try {
        const result = await bridgeUSDC(
            privateKey,
            fromChain,
            toChain,
            recipient,
            amount,
        );
        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
    }
}