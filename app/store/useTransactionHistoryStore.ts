import { create } from 'zustand';
import { Transaction, TransactionStatus } from '@/app/types/Transaction';

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
            const res = await fetch(`/api/transactions?address=${address}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');
            const data = await res.json();
            set({ transactions: data, isLoading: false });
        } catch (error: any) {
            console.error(error);
            set({ error: error.message, isLoading: false });
        }
    },

    addTransaction: async (tx: Transaction) => {
        // Optimistic update
        set((state) => ({ transactions: [tx, ...state.transactions] }));
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tx),
            });
            if (!res.ok) throw new Error('Failed to save transaction');
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
            await fetch('/api/transactions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
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

        // Check if we need to update parent status? (Optional logic)

        set((state) => ({
            transactions: state.transactions.map((t) =>
                t.id === txId ? { ...t, route: updatedRoutes } : t
            )
        }));

        // Send to API
        try {
            await fetch('/api/transactions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: txId, route: updatedRoutes }),
            });
        } catch (error: any) {
            console.error(error);
        }
    },

    clearHistory: () => set({ transactions: [] }),
}));
