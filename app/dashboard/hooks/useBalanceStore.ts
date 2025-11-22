import { create } from "zustand";

export interface BalanceState {
    value: number;
    totalChains: number;
    setTotalChains: (n: number) => void;
    setValue: (n: number) => void;
    increment: (value: number) => void;
    decrement: (value: number) => void;
}

export const useBalanceStore = create<BalanceState>((set) => ({
    value: 0,

    totalChains: 0,

    setValue: (n) => set({ value: n }),

    setTotalChains: (n) => set({ totalChains: n }),

    increment: (value: number) =>
        set((state) => ({ value: state.value + value })),

    decrement: (vale: number) =>
        set((state) => ({ value: state.value - vale })),
}));
