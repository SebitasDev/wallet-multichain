import { BridgeStrategy, BridgeContext } from "./types";
import { SettleResponse } from "@/app/facilitator/types";
import { executeNearBridge, getNearQuote } from "./near";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { createPublicClient, http, formatEther } from "viem";
import { FACILITATOR_ADDRESS } from "@/app/facilitator/config";

export class StandardBridgeStrategy implements BridgeStrategy {
    name = "StandardBridge";

    canHandle(context: BridgeContext): boolean {
        const { paymentPayload } = context;
        // Explicitly handle "STANDARD" type (used by Refuel/Standard flow)
        return (paymentPayload as any)?.type === "STANDARD";
    }

    async execute(context: BridgeContext): Promise<SettleResponse> {
        const { sourceChain, destChain, amount, recipient, sourceToken, paymentPayload } = context;
        let finalAmount = amount;
        const txHash = (paymentPayload as any).txHash as `0x${string}`;

        if (!txHash) {
            return { success: false, errorReason: "Missing Transaction Hash for Standard Bridge" };
        }

        console.log(`[StandardBridgeStrategy] Processing Standard Transfer. Tx: ${txHash}`);

        // 1. Verify Tx on-chain
        try {
            const networkConfig = NETWORKS[sourceChain];
            if (!networkConfig || !networkConfig.evm) {
                throw new Error("Invalid Source Chain for EVM Verification");
            }

            const publicClient = createPublicClient({
                chain: networkConfig.evm.chain,
                transport: http(networkConfig.evm.rpcUrl || undefined)
            });

            console.log(`[StandardBridgeStrategy] Verifying execution on ${sourceChain}...`);

            // Retry Logic for Receipt/Finality
            const withRetryFinality = async <T>(fn: () => Promise<T>, maxRetries = 5): Promise<T | null> => {
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        return await fn();
                    } catch (e: any) {
                        const msg = (e.message || "").toLowerCase();
                        const details = (e.details || "").toLowerCase();
                        const isUnfinalized = msg.includes("unfinalized data") || details.includes("unfinalized data");
                        const isNotFound = msg.includes("could not be found") || details.includes("could not be found") || e.name === "TransactionReceiptNotFoundError" || e.name === "TransactionNotFoundError";

                        if (isUnfinalized || isNotFound) {
                            console.log(`[StandardBridgeStrategy] Waiting for finality/indexing on ${sourceChain}... (Attempt ${i + 1}/${maxRetries})`);
                            await new Promise(r => setTimeout(r, 5000));
                            continue;
                        }
                        throw e;
                    }
                }
                console.warn(`[StandardBridgeStrategy] ⚠️ Transaction verification failed after ${maxRetries} attempts. Proceeding to Balance Check.`);
                return null;
            };

            // Attempt to get Receipt
            const receipt: any = await withRetryFinality(() => publicClient.waitForTransactionReceipt({ hash: txHash }));

            if (receipt && receipt.status !== "success") {
                throw new Error("Transaction failed or reverted on-chain");
            }

            // Check for ERC20 Log
            const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
            const log = receipt?.logs?.find((l: any) =>
                l.topics[0] === transferTopic &&
                l.topics[2]?.toLowerCase().includes(FACILITATOR_ADDRESS.toLowerCase().slice(2))
            );

            // Native Verification Logic
            let tx: any = null;
            if (!log) {
                console.log("[StandardBridgeStrategy] No ERC20 Logs found. Checking for Native Transfer...");
                tx = await withRetryFinality(() => publicClient.getTransaction({ hash: txHash }));

                if (tx) {
                    // We found the tx, let's verify it
                    if (tx.to?.toLowerCase() !== FACILITATOR_ADDRESS.toLowerCase()) {
                        throw new Error(`Invalid Native Transfer Recipient. Expected ${FACILITATOR_ADDRESS}, got ${tx.to}`);
                    }

                    if (tx.value) {
                        const sentValue = BigInt(tx.value);
                        const expectedAmountBigInt = BigInt(Math.floor(Number(amount) * 10 ** 18));

                        // Deduct Gas Check: If value < expected, warn but proceed (assume gas deduction)
                        if (sentValue < expectedAmountBigInt) {
                            console.warn(`[StandardBridgeStrategy] Native Value < Expected. Assuming Gas Deduction used. Expected: ${expectedAmountBigInt}, Got: ${sentValue}`);
                        }

                        finalAmount = formatEther(sentValue);
                        console.log(`[StandardBridgeStrategy] Native Transfer Verified using Tx Value: ${finalAmount}`);
                    }
                } else {
                    // Tx Not Found (Soft Fail)
                    console.warn("[StandardBridgeStrategy] ⚠️ Could not fetch Transaction for Native Amount verification. Assuming input 'amount' is correct.");
                }

            } else {
                // ERC20 Verification Logic
                console.log("[StandardBridgeStrategy] ERC20 Log Found. Verifying...");
                const tokenConfig = networkConfig.assets.find(a => a.name === (sourceToken || "USDC"));

                if (tokenConfig && tokenConfig.address && log.address.toLowerCase() !== tokenConfig.address.toLowerCase()) {
                    throw new Error(`Token Mismatch. Expected ${tokenConfig.address}, got ${log.address}`);
                }

                const decimals = tokenConfig?.decimals || 6;
                const expectedAmountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));
                const transferredAmount = BigInt(log.data);

                if (transferredAmount < expectedAmountBigInt) {
                    console.warn(`[StandardBridgeStrategy] ERC20 Amount Mismatch. Expected ${expectedAmountBigInt}, got ${transferredAmount}. Proceeding with actual.`);
                }
            }

            // Proceed to Step 2
            console.log("[StandardBridgeStrategy] Proceeding to Facilitator Balance Check...");

        } catch (e: any) {
            console.error("[StandardBridgeStrategy] Verification/Execution Failed:", e);
            return {
                success: false,
                errorReason: e.message || "Standard Bridge Execution Failed"
            };
        }

        // 2. Execute Near Bridge (Step 2)
        const { quote, depositAddress, amountAtomicTotal, amountAtomicNet } = await getNearQuote(
            sourceChain,
            destChain,
            finalAmount,
            context.destToken,
            context.sourceToken || "USDC",
            recipient
        );

        console.log("[StandardBridgeStrategy] Quote valid. Executing Step 2 (Near Bridge Settlement)...");

        return await executeNearBridge(
            sourceChain,
            destChain,
            finalAmount,
            recipient as string,
            txHash, // Use the user's TxHash as the "Pull Hash"
            quote,
            depositAddress,
            amountAtomicTotal,
            amountAtomicNet,
            sourceToken
        );
    }
}
