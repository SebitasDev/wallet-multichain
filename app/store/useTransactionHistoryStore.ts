import { create } from 'zustand';
import { Transaction, TransactionStatus } from '@/app/types/Transaction';
import { transactionsApi, CreateTransactionRequest } from '@/app/services/api';

interface TransactionHistoryState {
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchTransactions: (address: string) => Promise<void>;
    addTransaction: (tx: Transaction) => Promise<void>;
    updateTransactionStatus: (id: string, status: TransactionStatus) => Promise<void>;
    updateRouteStatus: (
        txId: string,
        chainName: string,
        status: TransactionStatus,
        txHash?: string
    ) => Promise<void>;
    clearHistory: () => void;
}

export const useTransactionHistoryStore = create<TransactionHistoryState>((set, get) => ({
    transactions: [],
    isLoading: false,
    error: null,

    fetchTransactions: async (address: string) => {
        set({ isLoading: true, error: null });
        try {
            const data = await transactionsApi.getAll({ address });
            set({ transactions: data.transactions || [], isLoading: false });
        } catch (error: any) {
            console.error(error);
            set({ error: error.message, isLoading: false });
        }
    },

    addTransaction: async (tx: Transaction) => {
        // Optimistic update
        set((state) => ({ transactions: [tx, ...state.transactions] }));
        try {
            // Adapt tx to CreateTransactionRequest if needed, assuming direct compatibility for now
            // But tx has types that might mismatch strict 'string' fields of request if they are optional
            // We cast or carefully map. Transaction type usually matches schema.
            await transactionsApi.create(tx as unknown as CreateTransactionRequest);
        } catch (error: any) {
            console.error(error);
            // Rollback on error could be implemented here
            set({ error: error.message });
        }
    },

    updateTransactionStatus: async (id, status) => {
        // Optimistic update
        set((state) => ({
            transactions: state.transactions.map((tx) =>
                tx.id === id ? { ...tx, status } : tx
            )
        }));

        try {
            await transactionsApi.update({ id, status });
        } catch (error: any) {
            console.error(error);
        }
    },

    updateRouteStatus: async (txId, chainName, status, txHash) => {
        const { transactions } = get();
        const tx = transactions.find(t => t.id === txId);
        if (!tx) return;

        // Optimistic update locally
        const updatedRoutes = tx.route.map((r) => {
            if (r.chainName === chainName) {
                return { ...r, status, txHash: txHash || r.txHash };
            }
            return r;
        });

        set((state) => ({
            transactions: state.transactions.map((t) =>
                t.id === txId ? { ...t, route: updatedRoutes } : t
            )
        }));

        // Send to API
        try {
            await transactionsApi.update({ id: txId, route: updatedRoutes });
        } catch (error: any) {
            console.error(error);
        }
    },

    clearHistory: () => set({ transactions: [] }),
}));
