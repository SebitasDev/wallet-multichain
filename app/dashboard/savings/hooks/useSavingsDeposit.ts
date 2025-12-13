"use client";

import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Address } from "abitype";
import {
    SavingsChainKey,
    parseUsdcAmount,
    formatUsdcDisplay,
} from "@/app/savings/config";
import { getDepositTypedData, generateNonce } from "@/app/savings/signature";
import { useSavingsStore, fetchSavingsPositions } from "@/app/store/useSavingsStore";
import { DepositResponse } from "@/app/savings/types";

interface UseSavingsDepositReturn {
    deposit: (chain: SavingsChainKey, amount: string) => Promise<DepositResponse | null>;
    isDepositing: boolean;
    needsApproval: boolean;
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
 * Hook to handle USDC deposits into Spark.fi savings vaults
 */
export function useSavingsDeposit(
    walletAddress: Address | undefined,
    walletClient?: WalletClient
): UseSavingsDepositReturn {
    const [isDepositing, setIsDepositing] = useState(false);
    const [needsApproval, setNeedsApproval] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { addDepositEntry } = useSavingsStore();

    const deposit = useCallback(
        async (
            chain: SavingsChainKey,
            amount: string
        ): Promise<DepositResponse | null> => {
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

            setIsDepositing(true);
            setError(null);
            setNeedsApproval(false);

            try {
                const amountBigInt = parseUsdcAmount(amount);
                const nonce = generateNonce();

                // Get typed data for signing
                const typedData = getDepositTypedData(
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
                    // In production, this should always require wallet signing
                    console.warn("No wallet client provided, using empty signature");
                    signature = "0x";
                }

                // Call API
                const response = await fetch("/api/savings/deposit", {
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

                const data: DepositResponse = await response.json();

                if (data.success) {
                    toast.success(
                        `Deposited ${formatUsdcDisplay(amountBigInt)} to ${chain}`
                    );

                    // Add to deposit history
                    addDepositEntry({
                        chain,
                        amount: amountBigInt.toString(),
                        txHash: data.transactionHash || "",
                        type: "deposit",
                    });

                    // Refresh positions
                    await fetchSavingsPositions(walletAddress);

                    return data;
                } else {
                    if (data.errorReason === "USDC_APPROVAL_NEEDED") {
                        setNeedsApproval(true);
                        toast.warning("USDC approval needed. Please approve first.");
                    } else {
                        setError(data.errorReason || "Deposit failed");
                        toast.error(data.errorReason || "Deposit failed");
                    }
                    return data;
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Deposit failed";
                setError(message);
                toast.error(message);
                return null;
            } finally {
                setIsDepositing(false);
            }
        },
        [walletAddress, walletClient, addDepositEntry]
    );

    return {
        deposit,
        isDepositing,
        needsApproval,
        error,
    };
}
