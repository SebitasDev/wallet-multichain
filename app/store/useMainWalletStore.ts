import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
    mainWallet: {
        address: string | null;
        encryptedPrivateKey: string | null;
        salt: string | null;
        iv: string | null;
    };
    xoWallet: {
        address: string | null;
    };
    xoClient: any;

    // Hydration flag
    hydrated: boolean;
    setHydrated: (hydrated: boolean) => void;

    setMainWallet: (data: any) => void;
    setXOWallet: (data: any) => void;
    setXOClient: (client: any) => void;
}

export const useMainWalletStore = create<WalletState>()(
    persist(
        (set) => ({
            mainWallet: { address: null, encryptedPrivateKey: null, salt: null, iv: null },
            xoWallet: { address: null },
            xoClient: null,

            hydrated: false,
            setHydrated: (hydrated: boolean) => set({ hydrated }),

            setMainWallet: (data) => set({ mainWallet: data }),
            setXOWallet: (data) => set({ xoWallet: data }),
            setXOClient: (client) => set({ xoClient: client }),
        }),
        {
            name: "wallet-storage",
            version: 1,
            onRehydrateStorage: () => (state) => {
                if (state) state.setHydrated(true); // ⚡ cuando zustand termina de hidratar
            },
        }
    )
);
