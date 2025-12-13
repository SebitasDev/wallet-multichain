"use client";

import { useEffect, useCallback } from "react";
import { useSavingsStore, fetchSavingsPositions } from "@/app/store/useSavingsStore";
import { SavingsPosition, SavingsSummary } from "@/app/savings/types";

interface UseSavingsPositionsReturn {
    positions: SavingsPosition[];
    summary: SavingsSummary;
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage savings positions
 * Polls every 10 seconds for real-time updates
 */
export function useSavingsPositions(
    walletAddress: string | undefined,
    pollInterval: number = 10000
): UseSavingsPositionsReturn {
    const {
        loading,
        error,
        lastUpdated,
        getAllPositionsWithEarnings,
        getSummary,
    } = useSavingsStore();

    const positions = getAllPositionsWithEarnings();
    const summary = getSummary();

    const refresh = useCallback(async () => {
        if (walletAddress) {
            await fetchSavingsPositions(walletAddress);
        }
    }, [walletAddress]);

    // Initial fetch
    useEffect(() => {
        if (walletAddress) {
            fetchSavingsPositions(walletAddress);
        }
    }, [walletAddress]);

    // Polling
    useEffect(() => {
        if (!walletAddress || pollInterval <= 0) return;

        const interval = setInterval(() => {
            fetchSavingsPositions(walletAddress);
        }, pollInterval);

        return () => clearInterval(interval);
    }, [walletAddress, pollInterval]);

    return {
        positions,
        summary,
        loading,
        error,
        lastUpdated,
        refresh,
    };
}
