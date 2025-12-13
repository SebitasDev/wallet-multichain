import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    SavingsPosition,
    DepositHistoryEntry,
    PositionData,
    SavingsSummary,
} from "@/app/savings/types";
import {
    SavingsChainKey,
    formatUsdcAmount,
    USDC_DECIMALS,
} from "@/app/savings/config";

interface SavingsState {
    // Positions from blockchain
    positions: PositionData[];

    // Deposit history (persisted to localStorage)
    depositHistory: DepositHistoryEntry[];

    // UI state
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;

    // Actions
    setPositions: (positions: PositionData[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Deposit history management
    addDepositEntry: (entry: Omit<DepositHistoryEntry, "timestamp">) => void;
    addWithdrawEntry: (entry: Omit<DepositHistoryEntry, "timestamp" | "type">) => void;
    clearHistory: () => void;

    // Computed values
    getDepositedAmount: (chain: SavingsChainKey) => bigint;
    getTotalDeposited: () => bigint;
    getPositionWithEarnings: (position: PositionData) => SavingsPosition;
    getAllPositionsWithEarnings: () => SavingsPosition[];
    getSummary: () => SavingsSummary;
}

export const useSavingsStore = create<SavingsState>()(
    persist(
        (set, get) => ({
            positions: [],
            depositHistory: [],
            loading: false,
            error: null,
            lastUpdated: null,

            setPositions: (positions) =>
                set({
                    positions,
                    lastUpdated: Date.now(),
                    error: null,
                }),

            setLoading: (loading) => set({ loading }),

            setError: (error) => set({ error, loading: false }),

            addDepositEntry: (entry) =>
                set((state) => ({
                    depositHistory: [
                        ...state.depositHistory,
                        {
                            ...entry,
                            type: "deposit",
                            timestamp: Date.now(),
                        },
                    ],
                })),

            addWithdrawEntry: (entry) =>
                set((state) => ({
                    depositHistory: [
                        ...state.depositHistory,
                        {
                            ...entry,
                            type: "withdraw",
                            timestamp: Date.now(),
                        },
                    ],
                })),

            clearHistory: () => set({ depositHistory: [] }),

            getDepositedAmount: (chain) => {
                const { depositHistory } = get();
                let total = BigInt(0);

                for (const entry of depositHistory) {
                    if (entry.chain === chain) {
                        const amount = BigInt(entry.amount);
                        if (entry.type === "deposit") {
                            total += amount;
                        } else {
                            total -= amount;
                        }
                    }
                }

                // Ensure non-negative
                return total < BigInt(0) ? BigInt(0) : total;
            },

            getTotalDeposited: () => {
                const { depositHistory } = get();
                let total = BigInt(0);

                for (const entry of depositHistory) {
                    const amount = BigInt(entry.amount);
                    if (entry.type === "deposit") {
                        total += amount;
                    } else {
                        total -= amount;
                    }
                }

                return total < BigInt(0) ? BigInt(0) : total;
            },

            getPositionWithEarnings: (position) => {
                const deposited = get().getDepositedAmount(position.chain);
                const currentValue = BigInt(position.currentValue);
                const earned = currentValue - deposited;

                // Calculate APY (simplified - would need more data for accurate calculation)
                // For now, estimate based on Spark's ~4.5% SSR
                const apy = "4.50";

                return {
                    chain: position.chain,
                    shares: position.shares,
                    currentValue: formatUsdcAmount(currentValue),
                    deposited: formatUsdcAmount(deposited),
                    earned: formatUsdcAmount(earned < BigInt(0) ? BigInt(0) : earned),
                    apy,
                };
            },

            getAllPositionsWithEarnings: () => {
                const { positions, getPositionWithEarnings } = get();
                return positions.map((p) => getPositionWithEarnings(p));
            },

            getSummary: () => {
                const { positions, getTotalDeposited } = get();

                let totalValue = BigInt(0);
                let positionCount = 0;

                for (const position of positions) {
                    totalValue += BigInt(position.currentValue);
                    positionCount++;
                }

                const totalDeposited = getTotalDeposited();
                const totalEarned = totalValue - totalDeposited;

                // Weighted average APY (simplified)
                const averageApy = positionCount > 0 ? "4.50" : "0.00";

                return {
                    totalDeposited: formatUsdcAmount(totalDeposited),
                    totalValue: formatUsdcAmount(totalValue),
                    totalEarned: formatUsdcAmount(totalEarned < BigInt(0) ? BigInt(0) : totalEarned),
                    averageApy,
                    positionCount,
                };
            },
        }),
        {
            name: "savings-storage",
            // Only persist depositHistory to localStorage
            partialize: (state) => ({
                depositHistory: state.depositHistory,
            }),
        }
    )
);

/**
 * Helper to fetch positions from API and update store
 */
export async function fetchSavingsPositions(walletAddress: string) {
    const store = useSavingsStore.getState();

    store.setLoading(true);

    try {
        const response = await fetch(`/api/savings/positions/${walletAddress}`);
        const data = await response.json();

        if (data.errorReason) {
            store.setError(data.errorReason);
            return;
        }

        store.setPositions(data.positions);
    } catch (error) {
        store.setError(error instanceof Error ? error.message : "Failed to fetch positions");
    }
}
