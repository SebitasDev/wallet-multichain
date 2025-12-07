import { NextRequest, NextResponse } from "next/server";
import {crossChainTransfer} from "@/app/cross-chain-core/crossChainTransfer";
import {crossChainTransferTestnet} from "@/app/cross-chain-core/crossChainTransferTestnet";

export async function POST(req: NextRequest) {
    const { amount, fromChain, toChain, privateKey, recipient } = await req.json();

    try {
        if(process.env.NEXT_PUBLIC_ENVIROMENT === "development") {
            const result = await crossChainTransferTestnet(
                privateKey as `0x${string}`,
                fromChain,
                toChain,
                recipient,
                amount
            );
            return NextResponse.json(result);
        } else {
            await crossChainTransfer(
                privateKey as `0x${string}`,
                fromChain,
                toChain,
                recipient,
                amount
            );

            return NextResponse.json("success");
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
    }
}