import { create } from "zustand";
import { Address } from "abitype";

export interface ChainInfo {
    chainId: string;
    chainAmount: number;
}

export interface WalletInfo {
    address: Address;
    totalAmount: number;
    chains: ChainInfo[];
}

export interface WalletsState {
    wallets: WalletInfo[];
    setWalletsInfo: (wallets: WalletInfo[]) => void;
    addWalletInfo: (wallet: WalletInfo) => void;
}

export const useWalletsInfoStore = create<WalletsState>((set) => ({
    wallets: [],

    setWalletsInfo: (wallets) => set({ wallets }),

    addWalletInfo: (wallet) =>
        set((state) => {
            const exists = state.wallets.find(
                (w) => w.address.toLowerCase() === wallet.address.toLowerCase()
            );

            if (exists) {
                return {
                    wallets: state.wallets.map((w) =>
                        w.address.toLowerCase() === wallet.address.toLowerCase()
                            ? wallet
                            : w
                    ),
                };
            }

            return {
                wallets: [...state.wallets, wallet],
            };
        }),
}));
