import {create} from "zustand";
import {persist} from "zustand/middleware";
import {mnemonicToSeedSync, validateMnemonic} from "@scure/bip39";
import {wordlist} from "@scure/bip39/wordlists/english";
import {HDKey} from "ethereum-cryptography/hdkey";
import {privateKeyToAccount} from "viem/accounts";
import {Buffer} from "buffer";
import {decryptSeed, encryptSeed} from "../utils/cripto";
import {NETWORKS} from "@/app/constants/chainsInformation";
import {Address} from "abitype";
import {getBalanceFromChain} from "@/app/hook/useGetBalanceFromChain";

interface ChainInfo {
    chainId: string;
    amount: number;
}

export interface WalletInfo {
    name: string;
    address: `0x${string}`;
    encryptedSeed: string;
    chains: ChainInfo[];
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

    updateWalletBalances: () => void;

    getWalletBalanceByChain: (walletAddress: `0x${string}`, chainId: string) => Promise<Number>;

    getWalletTotalBalance: (walletAddress: `0x${string}`) => number;

    getAllWalletsTotalBalance: () => number;

    transferBalance: (originAddress: Address, destinationAddress: Address, originChainId: string, destinationChainId: string, amount: number) => void;

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

                const chains: ChainInfo[] = await Promise.all(
                    Object.values(NETWORKS).map(async (network) => {
                        try {
                            const getBalance = await getBalanceFromChain(
                                network.chain,
                                account.address as Address,
                                network.usdc as Address
                            );

                            return {
                                chainId: network.chain.id.toString(),
                                amount: Number(getBalance.balance || 0),
                            };
                        } catch (err) {
                            console.error("Error al obtener balance de", network.label, err);
                            return {
                                chainId: network.chain.id.toString(),
                                amount: 0,
                            };
                        }
                    })
                );

                const newWallet: WalletInfo = {
                    name: walletName,
                    address: account.address,
                    encryptedSeed,
                    chains,
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

            // -----------------------------
            // UPDATE BALANCES
            // -----------------------------
            updateWalletBalances: async () => {
                const wallets = get().wallets;

                const updatedWallets = await Promise.all(
                    wallets.map(async (wallet) => {
                        const updatedChains: ChainInfo[] = await Promise.all(
                            wallet.chains.map(async (chainInfo) => {
                                try {
                                    const networkKey = Object.values(NETWORKS).find(
                                        (net) => net.chain.id.toString() === chainInfo.chainId
                                    );
                                    if (!networkKey) return { ...chainInfo, amount: chainInfo.amount };

                                    const { balance } = await getBalanceFromChain(
                                        networkKey.chain,
                                        wallet.address as Address,
                                        networkKey.usdc as Address
                                    );

                                    return {
                                        ...chainInfo,
                                        amount: Number(balance || 0),
                                    };
                                } catch (err) {
                                    console.error(
                                        `Error al actualizar balance de ${wallet.name} en chain ${chainInfo.chainId}`,
                                        err
                                    );
                                    return { ...chainInfo, amount: chainInfo.amount };
                                }
                            })
                        );

                        return { ...wallet, chains: updatedChains };
                    })
                );

                set({ wallets: updatedWallets });
            },

            // -----------------------------
            // GET BALANCE DE UNA CADENA ESPECÍFICA
            // -----------------------------
            getWalletBalanceByChain: async (walletAddress: Address, chainId: string) => {
                const wallet = get().wallets.find(
                    (w) => w.address.toLowerCase() === walletAddress.toLowerCase()
                );
                if (!wallet) throw new Error("Wallet no encontrada");

                const chainInfo = wallet.chains.find((c) => c.chainId === chainId);
                if (!chainInfo) throw new Error("Chain no encontrada en esta wallet", chainInfo);

                try {
                    const network = Object.values(NETWORKS).find(
                        (net) => net.chain.id.toString() === chainId
                    );
                    if (!network) throw new Error("Network config no encontrada");

                    const { balance } = await getBalanceFromChain(
                        network.chain,
                        wallet.address as Address,
                        network.usdc as Address
                    );

                    // Actualizar el balance en el store
                    const updatedChains = wallet.chains.map((c) =>
                        c.chainId === chainId ? { ...c, amount: Number(balance || 0) } : c
                    );

                    set({
                        wallets: get().wallets.map((w) =>
                            w.address.toLowerCase() === walletAddress.toLowerCase()
                                ? { ...w, chains: updatedChains }
                                : w
                        ),
                    });

                    return Number(balance || 0);
                } catch (err) {
                    console.error(
                        `Error al obtener balance de wallet ${walletAddress} en chain ${chainId}`,
                        err
                    );
                    return 0;
                }
            },

            // -----------------------------
            // GET BALANCE TOTAL DE UNA WALLET
            // -----------------------------
            getWalletTotalBalance: (walletAddress: Address) => {
                const wallet = get().wallets.find(
                    (w) => w.address.toLowerCase() === walletAddress.toLowerCase()
                );
                if (!wallet) throw new Error("Wallet no encontrada");

                // Sumar todos los amounts
                const total = wallet.chains.reduce((acc, c) => acc + c.amount, 0);

                return total;
            },

            // -----------------------------
            // GET BALANCE TOTAL DE TODAS LAS WALLETS
            // -----------------------------
            getAllWalletsTotalBalance: () => {
                const wallets = get().wallets;

                // Sumar todos los amounts de todas las chains de todas las wallets
                return wallets.reduce((walletAcc, wallet) => {
                    const walletTotal = wallet.chains.reduce((chainAcc, c) => chainAcc + c.amount, 0);
                    return walletAcc + walletTotal;
                }, 0);
            },


            transferBalance: (
                originAddress: Address,
                destinationAddress: Address,
                originChainId: string,
                destinationChainId: string,
                amount: number
            ) => {
                set((state) => ({
                    wallets: state.wallets.map((wallet) => {
                        const lowerAddr = wallet.address.toLowerCase();

                        if (lowerAddr === originAddress.toLowerCase()) {
                            console.log("inicio",lowerAddr)
                            return {
                                ...wallet,
                                chains: wallet.chains.map((chain) =>
                                    chain.chainId === originChainId
                                        ? { ...chain, amount: chain.amount - amount }
                                        : chain
                                ),
                            };
                        }

                        if (lowerAddr === destinationAddress.toLowerCase()) {
                            console.log("destino",lowerAddr)
                            return {
                                ...wallet,
                                chains: wallet.chains.map((chain) =>
                                    chain.chainId === destinationChainId
                                        ? { ...chain, amount: chain.amount + amount }
                                        : chain
                                ),
                            };
                        }

                        return wallet;
                    }),
                }));
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
