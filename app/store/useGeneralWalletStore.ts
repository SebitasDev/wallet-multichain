import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

interface WalletState {
    privateKey: `0x${string}` | null;
    address: `0x${string}` | null;
    account: any | null;

    initializeWallet: () => void;
    resetWallet: () => void;
}

export const useGeneralWalletStore = create<WalletState>()(
    persist(
        (set, get) => ({
            privateKey: null,
            address: null,
            account: null,

            initializeWallet: () => {
                const storedPk = get().privateKey;

                if (storedPk) {
                    const acc = privateKeyToAccount(storedPk);
                    console.log("Wallet cargada desde storage:", acc.address);

                    set({
                        privateKey: storedPk,
                        address: acc.address,
                        account: acc
                    });
                    return;
                }

                const defaultPk = "0x62462357d3d659dd6693ab2c2dd2dd55511fe9f67efef07599dcb7f10c32107d";
                const acc = privateKeyToAccount(defaultPk);

                console.log("Wallet default generada:", acc.address);

                set({
                    privateKey: defaultPk,
                    address: acc.address,
                    account: acc
                });
            },

            resetWallet: () => {
                const newPk = generatePrivateKey();
                const account = privateKeyToAccount(newPk);

                set({
                    privateKey: newPk,
                    address: account.address,
                    account
                });
            }
        }),

        {
            name: "user_wallet_store",
            partialize: (state) => ({
                privateKey: state.privateKey
            })
        }
    )
);
