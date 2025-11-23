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
                const pk = get().privateKey;

                // Si ya existe → no generar de nuevo
                if (pk) {
                    const acc = privateKeyToAccount("0x62462357d3d659dd6693ab2c2dd2dd55511fe9f67efef07599dcb7f10c32107d");
                    console.log("Wallet cargada:", acc.address);
                    return;
                }

                // Crear nueva wallet
                const newPk = generatePrivateKey();
                const account = privateKeyToAccount(newPk);

                console.log("Nueva wallet generada:", account.address);

                set({
                    privateKey: newPk,
                    address: account.address,
                    account
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
            name: "user_wallet_store", // localStorage key
            partialize: (state) => ({
                privateKey: state.privateKey
            })
        }
    )
);
