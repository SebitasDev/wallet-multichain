
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CurrencyState {
    useLocal: boolean;
    toggleCurrency: () => void;
}

export const useCurrencyStore = create<CurrencyState>()(
    persist(
        (set) => ({
            useLocal: false, // Default to USD
            toggleCurrency: () => set((state) => ({ useLocal: !state.useLocal })),
        }),
        {
            name: "currency-storage",
        }
    )
);
