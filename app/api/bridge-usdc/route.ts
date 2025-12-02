import { NextRequest, NextResponse } from "next/server";
import {crossChainTransfer} from "@/app/circle-test/crossChainTransfer";

export async function POST(req: NextRequest) {
    const { amount, fromChain, toChain, privateKey, recipient } = await req.json();

    try {
        const result = await crossChainTransfer(
            privateKey as `0x${string}`,
            fromChain,
            toChain,
            recipient,
            amount
        );
        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
    }
}