import { create } from "zustand";
import { persist } from "zustand/middleware";
import { validateMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { HDKey } from "ethereum-cryptography/hdkey";
import { privateKeyToAccount } from "viem/accounts";
import { Buffer } from "buffer";
import { decryptSeed, encryptSeed } from "../utils/cripto";

export interface WalletInfo {
    name: string;
    address: `0x${string}`;
    encryptedSeed: string;
}

interface WalletStore {
    wallets: WalletInfo[];

    addWallet: (
        mnemonic: string,
        password: string,
        walletName: string
    ) => Promise<WalletInfo>;

    unlockWallet: (address: string, password: string) => Promise<`0x${string}`>;

    removeWallet: (address: string) => void;

    clearAll: () => void;
}

export const useWalletStore = create<WalletStore>()(
    persist(
        (set, get) => ({
            wallets: [],

            // ---------------------------------------------------------
            // ADD WALLET
            // ---------------------------------------------------------
            addWallet: async (mnemonic, password, walletName) => {
                const trimmed = mnemonic.trim();

                if (!validateMnemonic(trimmed, wordlist)) {
                    throw new Error("Frase semilla inválida");
                }

                const encryptedSeed = encryptSeed(trimmed, password);

                const seed = mnemonicToSeedSync(trimmed);
                const root = HDKey.fromMasterSeed(seed);
                const child = root.derive("m/44'/60'/0'/0/0");

                if (!child.privateKey) {
                    throw new Error("No se pudo derivar la private key");
                }

                const privateKey = `0x${Buffer.from(child.privateKey).toString("hex")}` as `0x${string}`;
                const account = privateKeyToAccount(privateKey);

                const exists = get().wallets.some(
                    (w) => w.address.toLowerCase() === account.address.toLowerCase()
                );
                if (exists) throw new Error("Esta wallet ya está agregada");

                const newWallet: WalletInfo = {
                    name: walletName,
                    address: account.address,
                    encryptedSeed,
                };

                set({ wallets: [...get().wallets, newWallet] });

                return newWallet;
            },

            // ---------------------------------------------------------
            // UNLOCK WALLET
            // ---------------------------------------------------------
            unlockWallet: async (address, password) => {
                const wallet = get().wallets.find(
                    (w) => w.address.toLowerCase() === address.toLowerCase()
                );
                if (!wallet) throw new Error("Wallet no encontrada");

                const mnemonic = decryptSeed(wallet.encryptedSeed, password);
                if (!mnemonic) throw new Error("Contraseña incorrecta");

                const trimmed = mnemonic.trim();
                if (!validateMnemonic(trimmed, wordlist)) {
                    throw new Error("Frase semilla inválida");
                }

                const seed = mnemonicToSeedSync(trimmed);
                const root = HDKey.fromMasterSeed(seed);
                const child = root.derive("m/44'/60'/0'/0/0");

                return `0x${Buffer.from(child.privateKey!).toString("hex")}`;
            },

            // ---------------------------------------------------------
            // REMOVE WALLET
            // ---------------------------------------------------------
            removeWallet: (address: string) => {
                set({
                    wallets: get().wallets.filter(
                        (w) => w.address.toLowerCase() !== address.toLowerCase()
                    ),
                });
            },

            // ---------------------------------------------------------
            // CLEAR ALL
            // ---------------------------------------------------------
            clearAll: () => {
                set({ wallets: [] });
            },
        }),
        {
            name: "wallets",
        }
    )
);
