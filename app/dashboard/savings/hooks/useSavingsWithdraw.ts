"use client";

import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Address } from "abitype";
import {
    SavingsChainKey,
    parseUsdcAmount,
    formatUsdcDisplay,
} from "@/app/savings/config";
import { getWithdrawTypedData, generateNonce } from "@/app/savings/signature";
import { useSavingsStore, fetchSavingsPositions } from "@/app/store/useSavingsStore";
import { WithdrawResponse } from "@/app/savings/types";

interface UseSavingsWithdrawReturn {
    withdraw: (chain: SavingsChainKey, amount: string) => Promise<WithdrawResponse | null>;
    isWithdrawing: boolean;
    error: string | null;
}

interface WalletClient {
    signTypedData: (params: {
        domain: object;
        types: object;
        primaryType: string;
        message: object;
    }) => Promise<`0x${string}`>;
}

/**
 * Hook to handle USDC withdrawals from Spark.fi savings vaults
 */
export function useSavingsWithdraw(
    walletAddress: Address | undefined,
    walletClient?: WalletClient
): UseSavingsWithdrawReturn {
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { addWithdrawEntry } = useSavingsStore();

    const withdraw = useCallback(
        async (
            chain: SavingsChainKey,
            amount: string
        ): Promise<WithdrawResponse | null> => {
            if (!walletAddress) {
                setError("No wallet connected");
                toast.error("No wallet connected");
                return null;
            }

            if (!amount || parseFloat(amount) <= 0) {
                setError("Invalid amount");
                toast.error("Please enter a valid amount");
                return null;
            }

            setIsWithdrawing(true);
            setError(null);

            try {
                const amountBigInt = parseUsdcAmount(amount);
                const nonce = generateNonce();

                // Get typed data for signing
                const typedData = getWithdrawTypedData(
                    walletAddress,
                    chain,
                    amountBigInt.toString(),
                    nonce
                );

                // Sign with wallet
                let signature: `0x${string}`;
                if (walletClient) {
                    signature = await walletClient.signTypedData({
                        domain: typedData.domain,
                        types: typedData.types,
                        primaryType: typedData.primaryType,
                        message: typedData.message,
                    });
                } else {
                    // For demo/testing, use empty signature
                    console.warn("No wallet client provided, using empty signature");
                    signature = "0x";
                }

                // Call API
                const response = await fetch("/api/savings/withdraw", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        signature,
                        chain,
                        amount: amountBigInt.toString(),
                        walletAddress,
                        nonce,
                    }),
                });

                const data: WithdrawResponse = await response.json();

                if (data.success) {
                    toast.success(
                        `Withdrew ${formatUsdcDisplay(amountBigInt)} from ${chain}`
                    );

                    // Add to withdraw history
                    addWithdrawEntry({
                        chain,
                        amount: amountBigInt.toString(),
                        txHash: data.transactionHash || "",
                    });

                    // Refresh positions
                    await fetchSavingsPositions(walletAddress);

                    return data;
                } else {
                    setError(data.errorReason || "Withdrawal failed");
                    toast.error(data.errorReason || "Withdrawal failed");
                    return data;
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Withdrawal failed";
                setError(message);
                toast.error(message);
                return null;
            } finally {
                setIsWithdrawing(false);
            }
        },
        [walletAddress, walletClient, addWithdrawEntry]
    );

    return {
        withdraw,
        isWithdrawing,
        error,
    };
}
