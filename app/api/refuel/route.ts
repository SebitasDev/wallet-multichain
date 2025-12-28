import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, parseEther, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { NETWORKS } from "@/app/constants/chainsInformation";

const RELAYER_PRIVATE_KEY = (process.env.RELAYER_PRIVATE_KEY || process.env.FACILITATOR_PRIVATE_KEY) as `0x${string}`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { chain, address, estimatedGasCost } = body;

        console.log(`[Refuel] Request: Chain=${chain}, User=${address}, EstGas=${estimatedGasCost}`);

        if (!chain || !address || !estimatedGasCost) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const networkConfig = NETWORKS[chain as keyof typeof NETWORKS];
        if (!networkConfig || !networkConfig.evm) {
            return NextResponse.json({ success: false, error: "Invalid chain or non-EVM" }, { status: 400 });
        }

        if (!RELAYER_PRIVATE_KEY) {
            return NextResponse.json({ success: false, error: "Relayer not configured" }, { status: 500 });
        }

        const account = privateKeyToAccount(RELAYER_PRIVATE_KEY);
        const walletClient = createWalletClient({
            account,
            chain: networkConfig.evm.chain,
            transport: http()
        });

        // Safe Buffer: Send 1.5x the estimated gas to cover fluctuations
        // If estimatedGasCost is string "0.001", we parse it.
        const gasCostNum = parseFloat(estimatedGasCost);
        if (isNaN(gasCostNum)) {
            return NextResponse.json({ success: false, error: "Invalid gas cost format" }, { status: 400 });
        }

        // Limit Safety Check (Prevent draining)
        // Max Refuel Limit e.g. 0.05 Native Token (approx $2-$10 depending on chain)
        // Ideally this should be dynamic based on token price, but hardcoded limit is safer than nothing.
        const MAX_REFUEL = 0.05;
        if (gasCostNum > MAX_REFUEL) {
            return NextResponse.json({ success: false, error: "Refuel request exceeds safety limit" }, { status: 400 });
        }

        const amountToSend = (gasCostNum * 1.1).toFixed(18); // 10% Buffer
        const value = parseEther(amountToSend);

        console.log(`[Refuel] Sending ${amountToSend} ${networkConfig.chipLabel} to ${address}...`);

        const hash = await walletClient.sendTransaction({
            to: address as `0x${string}`,
            value: value,
            chain: networkConfig.evm.chain
        });

        console.log(`[Refuel] Success: ${hash}`);

        return NextResponse.json({
            success: true,
            txHash: hash,
            amountSent: amountToSend
        });

    } catch (e: any) {
        console.error("[Refuel] Error:", e);
        return NextResponse.json({
            success: false,
            error: e.message || "Refuel failed"
        }, { status: 500 });
    }
}
