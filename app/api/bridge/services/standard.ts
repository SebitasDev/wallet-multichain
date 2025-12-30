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
        let finalAmount = amount; // [FIX] Allow updating amount if gas is deducted
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

            // Wait for receipt (in case it's very fresh, though usually frontend waits)
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

            if (receipt.status !== "success") {
                throw new Error("Transaction failed or reverted on-chain");
            }

            // Verify it was a transfer to Facilitator
            // We can parse logs to be sure
            // In future import from config

            // Simple Log finding for ERC20 Transfer
            // Topic0: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef (Transfer)
            const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

            const log = receipt.logs.find((l: any) =>
                l.topics[0] === transferTopic &&
                // topic[2] is 'to' (padded)
                l.topics[2]?.toLowerCase().includes(FACILITATOR_ADDRESS.toLowerCase().slice(2))
            );

            if (!log) {
                // Check if it's a Native Transfer (AVAX, ETH)
                console.log("[StandardBridgeStrategy] No ERC20 Logs found. Checking for Native Transfer...");

                // Fetch full Transaction to check value
                const tx = await publicClient.getTransaction({ hash: txHash });

                if (!tx) {
                    throw new Error("Transaction not found");
                }

                // Verify To matches Facilitator
                if (tx.to?.toLowerCase() !== FACILITATOR_ADDRESS.toLowerCase()) {
                    throw new Error(`Invalid Native Transfer Recipient. Expected ${FACILITATOR_ADDRESS}, got ${tx.to}`);
                }

                // Determine expected amount
                // Native is always 18 decimals usually (AVAX, ETH, etc are 18)
                // Use tokenConfig if available, but native address 0x0 implies 18 usually.
                // We should check tokenConfig from sourceToken to be safe.
                const tokenConfig = networkConfig.assets.find(a => a.name === (sourceToken || "USDC"));
                const decimals = tokenConfig?.decimals || 18;
                const expectedAmountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));

                // [FIX] Native Gas Deduction Handling
                // The Frontend subtracts gas from the Amount to ensure success.
                // So tx.value WILL BE LESS than expectedAmountBigInt.
                // We should accept tx.value as the TRUE amount to bridge.

                if (tx.value < expectedAmountBigInt) {
                    console.warn(`[StandardBridgeStrategy] Native Value < Expected. Assuming Gas Deduction. Expected: ${expectedAmountBigInt}, Got: ${tx.value}`);
                    // We DO NOT throw. We proceed with the actual value.
                }

                // Update 'amount' for the next step (Near Bridge) to match what we actually received
                const actualAmountFloat = parseFloat(formatEther(tx.value));
                // Update context amount for next call
                finalAmount = actualAmountFloat.toString();

                console.log(`[StandardBridgeStrategy] Native Transaction Verified ✅. Bridging Actual: ${finalAmount}`);
                // If valid native transfer, we proceed.
            } else {
                // ERC20 Verification Logic (Wrapped in block to match structure)
                // Check Token Address
                const tokenConfig = networkConfig.assets.find(a => a.name === (sourceToken || "USDC"));
                if (tokenConfig && tokenConfig.address && log.address.toLowerCase() !== tokenConfig.address.toLowerCase()) {
                    throw new Error(`Token Mismatch. Expected ${tokenConfig.address}, got ${log.address}`);
                }

                // Check Amount (Data part of log)
                const decimals = tokenConfig?.decimals || 6;
                const expectedAmountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));

                const transferredAmount = BigInt(log.data);

                if (transferredAmount < expectedAmountBigInt) {
                    throw new Error(`Insufficient Amount Bridge. Expected ${expectedAmountBigInt}, got ${transferredAmount}`);
                }
                console.log("[StandardBridgeStrategy] ERC20 Transaction Verified ✅");
            }



            // 2. Execute Near Bridge (Step 2)
            // Get Quote to derive Deposit Address (needed for execution context mostly)
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

        } catch (e: any) {
            console.error("[StandardBridgeStrategy] Verification/Execution Failed:", e);
            return {
                success: false,
                errorReason: e.message || "Standard Bridge Execution Failed"
            };
        }
    }
}
