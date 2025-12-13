"use client";

import { useState, useEffect, useCallback } from "react";
import { createPublicClient, http } from "viem";
import { Address } from "abitype";
import {
    SavingsChainKey,
    getSavingsChainConfig,
    formatUsdcAmount,
} from "@/app/savings/config";
import { erc20Abi } from "@/app/savings/vaultAbi";

interface UseUsdcBalanceReturn {
    balance: string;
    balanceRaw: bigint;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

// Cache to avoid redundant RPC calls
const balanceCache = new Map<string, { balance: bigint; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

/**
 * Hook to fetch USDC balance for a wallet on a specific chain
 */
export function useUsdcBalance(
    walletAddress: Address | undefined,
    chain: SavingsChainKey
): UseUsdcBalanceReturn {
    const [balance, setBalance] = useState<string>("0.00");
    const [balanceRaw, setBalanceRaw] = useState<bigint>(BigInt(0));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBalance = useCallback(async () => {
        if (!walletAddress) {
            setBalance("0.00");
            setBalanceRaw(BigInt(0));
            return;
        }

        const cacheKey = `${chain}-${walletAddress}`;
        const cached = balanceCache.get(cacheKey);

        // Return cached value if fresh
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            setBalanceRaw(cached.balance);
            setBalance(formatUsdcAmount(cached.balance));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const chainConfig = getSavingsChainConfig(chain);

            const publicClient = createPublicClient({
                chain: chainConfig.chain,
                transport: http(chainConfig.rpcUrl),
            });

            const balanceResult = (await publicClient.readContract({
                address: chainConfig.usdc,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [walletAddress],
            })) as bigint;

            // Update cache
            balanceCache.set(cacheKey, {
                balance: balanceResult,
                timestamp: Date.now(),
            });

            setBalanceRaw(balanceResult);
            setBalance(formatUsdcAmount(balanceResult));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch balance";
            setError(message);
            console.error(`Failed to fetch USDC balance on ${chain}:`, err);
        } finally {
            setLoading(false);
        }
    }, [walletAddress, chain]);

    // Fetch on mount and when dependencies change
    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    return {
        balance,
        balanceRaw,
        loading,
        error,
        refresh: fetchBalance,
    };
}

/**
 * Hook to fetch USDC allowance for a wallet to the vault
 */
export function useUsdcAllowance(
    walletAddress: Address | undefined,
    chain: SavingsChainKey
): {
    allowance: bigint;
    loading: boolean;
    refresh: () => Promise<void>;
} {
    const [allowance, setAllowance] = useState<bigint>(BigInt(0));
    const [loading, setLoading] = useState(false);

    const fetchAllowance = useCallback(async () => {
        if (!walletAddress) {
            setAllowance(BigInt(0));
            return;
        }

        setLoading(true);

        try {
            const chainConfig = getSavingsChainConfig(chain);

            const publicClient = createPublicClient({
                chain: chainConfig.chain,
                transport: http(chainConfig.rpcUrl),
            });

            const allowanceResult = (await publicClient.readContract({
                address: chainConfig.usdc,
                abi: erc20Abi,
                functionName: "allowance",
                args: [walletAddress, chainConfig.sUsdcVault],
            })) as bigint;

            setAllowance(allowanceResult);
        } catch (err) {
            console.error(`Failed to fetch allowance on ${chain}:`, err);
        } finally {
            setLoading(false);
        }
    }, [walletAddress, chain]);

    useEffect(() => {
        fetchAllowance();
    }, [fetchAllowance]);

    return {
        allowance,
        loading,
        refresh: fetchAllowance,
    };
}
