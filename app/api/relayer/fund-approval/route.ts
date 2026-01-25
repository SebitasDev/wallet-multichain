import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseEther, formatEther, Address } from "viem";

import { privateKeyToAccount } from "viem/accounts";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";

// Relayer Private Key (Env Var)
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY as `0x${string}`;

/**
 * POST /api/relayer/fund-approval
 * 
 * Funds an EOA with a small amount of native gas to cover an Approve transaction
 * ONLY IF the EOA has insufficient gas but holds tokens to bridge.
 * 
 * Body: { chain: ChainKey, walletAddress: string, tokenAddress: string }
 */
export async function POST(request: NextRequest) {
    try {
        if (!RELAYER_PRIVATE_KEY) {
            console.error("Missing RELAYER_PRIVATE_KEY");
            return NextResponse.json({ success: false, errorReason: "Relayer not configured" }, { status: 500 });
        }

        const body = await request.json();
        const { chain, walletAddress, tokenAddress } = body;

        if (!chain || !walletAddress || !tokenAddress) {
            return NextResponse.json({ success: false, errorReason: "Missing fields" }, { status: 400 });
        }

        const network = NETWORKS[chain as ChainKey];
        if (!network || !network.evm) {
            return NextResponse.json({ success: false, errorReason: "Unsupported chain" }, { status: 400 });
        }

        // Setup Clients
        const client = createPublicClient({
            chain: network.evm.chain,
            transport: http()
        });

        // 1. Estimate Gas for Approve
        // We need the spender address (Smart Account) from body
        const { spender } = body;
        if (!spender) {
            return NextResponse.json({ success: false, errorReason: "Missing spender (Smart Account)" }, { status: 400 });
        }

        // Import ABI (assuming standard ERC20)
        const erc20ApproveAbi = [{
            constant: false,
            inputs: [
                { name: "_spender", type: "address" },
                { name: "_value", type: "uint256" }
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            type: "function"
        }] as const;

        const maxUint256 = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");


        let gasEstimate = BigInt(50000); // Fallback
        try {
            gasEstimate = await client.estimateContractGas({
                address: tokenAddress as Address,
                abi: erc20ApproveAbi,
                functionName: "approve",
                account: walletAddress as Address,
                args: [spender as Address, maxUint256]
            });
            console.log(`[Relayer] Estimated gas for approve: ${gasEstimate}`);
        } catch (e) {
            console.warn("[Relayer] Failed to estimate gas, using default 50k", e);
        }

        const gasPrice = await client.getGasPrice();
        const estimatedCost = gasEstimate * gasPrice;

        // Safety Margin (1.5x)
        const SAFE_THRESHOLD = (estimatedCost * BigInt("110")) / BigInt("100"); // 1.1x


        console.log(`[Relayer] Gas Check: Cost ${formatEther(estimatedCost)} ETH, Threshold ${formatEther(SAFE_THRESHOLD)} ETH`);

        const nativeBalance = await client.getBalance({ address: walletAddress });

        if (nativeBalance >= SAFE_THRESHOLD) {
            return NextResponse.json({
                success: false,
                errorReason: `Balance sufficient (${formatEther(nativeBalance)}). No Top-up needed.`
            }, { status: 400 });
        }

        // 3. Fund
        const relayerAccount = privateKeyToAccount(RELAYER_PRIVATE_KEY);
        const walletClient = createWalletClient({
            account: relayerAccount,
            chain: network.evm.chain,
            transport: http()
        });

        // Top up exactly what is needed + margin, or just the margin amount?
        // Let's send the SAFE_THRESHOLD amount to be safe for this op.
        // We could subtract current balance to be efficient: (SAFE_THRESHOLD - nativeBalance)
        // But let's act robustly: Ensure they have at least SAFE_THRESHOLD.
        const amountToSend = SAFE_THRESHOLD - nativeBalance;

        // Sanity Check: Don't send too much (e.g. max 0.01 ETH)
        const MAX_SEND = parseEther("0.01");
        const finalSendAmount = amountToSend > MAX_SEND ? MAX_SEND : amountToSend;

        if (finalSendAmount <= BigInt(0)) {
            return NextResponse.json({ success: true, message: "Balance sufficient" });
        }

        console.log(`[Relayer] Funding ${walletAddress} on ${chain} with ${formatEther(finalSendAmount)}`);

        const hash = await walletClient.sendTransaction({
            chain: null,
            to: walletAddress as Address,
            value: finalSendAmount
        });


        console.log(`[Relayer] Funding Tx: ${hash}`);

        return NextResponse.json({
            success: true,
            transactionHash: hash,
            message: "Gas funded"
        });

    } catch (e) {
        console.error("[Relayer] Error:", e);
        return NextResponse.json({
            success: false,
            errorReason: e instanceof Error ? e.message : "Start Relayer Error"
        }, { status: 500 });
    }
}
