import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChainInfo } from "./useWalletsStore";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { getBalanceFromChain } from "@/app/hooks/useGetBalanceFromChain";
import { Address } from "viem";
import { getStellarUSDCBalance } from "@/app/lib/stellar/getStellarUSDCBalance";
import { pricesApi } from "@/app/services/api/prices";

interface WalletState {
    mainWallet: {
        address: string | null;
        addressStellar: string | null;
        encryptedPrivateKey: string | null;
        encryptedPrivateKeyStellar: string | null;
        encryptedMnemonic: string | null;
        salt: string | null;
        iv: string | null;
        chains: ChainInfo[]; // Added chains
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
    refreshMainWalletBalances: (overrideEVMAddress?: string) => Promise<void>;

    // New Getters
    getMainWalletTotalBalance: () => number;
    getMainWalletBalanceByChain: (chainId: string) => number;
}

export const useXOWalletStore = create<WalletState>()(
    persist(
        (set, get) => ({
            mainWallet: {
                address: null,
                addressStellar: null,
                encryptedPrivateKey: null,
                encryptedPrivateKeyStellar: null,
                encryptedMnemonic: null,
                salt: null,
                iv: null,
                chains: [] // Initial empty chains
            },
            xoWallet: { address: null },
            xoClient: null,

            hydrated: false,
            setHydrated: (hydrated: boolean) => set({ hydrated }),

            setMainWallet: (data) => set((prev) => ({
                mainWallet: { ...prev.mainWallet, ...data }
            })),
            setXOWallet: (data) => set({ xoWallet: data }),
            setXOClient: (client) => set({ xoClient: client }),

            refreshMainWalletBalances: async (overrideEVMAddress?: string) => {
                const { mainWallet } = get();
                const addressToUse = overrideEVMAddress || mainWallet.address;

                // We need at least one address to be valid to fetch something
                if (!addressToUse && !mainWallet.addressStellar) return;

                const networks = Object.values(NETWORKS);
                const existingChainsMap = new Map(
                    (mainWallet.chains || []).map((c) => [c.chainId, c])
                );

                // 1. Collect all Coingecko IDs
                const allAssetIds = new Set<string>();
                networks.forEach(network => {
                    if (network.evm) {
                        network.assets.forEach(asset => {
                            if (asset.coingeckoId) allAssetIds.add(asset.coingeckoId);
                        });
                    }
                });
                // Add Stellar
                allAssetIds.add("stellar"); // XLM
                allAssetIds.add("usd-coin"); // USDC

                // 2. Fetch Prices
                const prices = await pricesApi.getPrices(Array.from(allAssetIds));

                // 3. Fetch EVM Balances & Calculate USD
                const evmPromises = addressToUse ? networks.map(async (network) => {
                    if (!network.evm) return null;

                    const chainId = network.evm.chain.id.toString();
                    const existingChain = existingChainsMap.get(chainId);
                    const currentTokens = existingChain ? existingChain.tokens : {};

                    try {
                        const tokenBalances: Record<string, number> = { ...currentTokens };
                        let chainTotalUsd = 0;

                        // Iterate all assets
                        await Promise.all(network.assets.map(async (asset) => {
                            if (!asset.address) return;
                            try {
                                const { balance } = await getBalanceFromChain(
                                    network.evm!.chain,
                                    addressToUse as Address,
                                    asset.address as Address,
                                    asset.decimals
                                );
                                const numBalance = Number(balance || 0);
                                const safeBalance = isNaN(numBalance) ? 0 : numBalance;
                                tokenBalances[asset.name] = safeBalance;

                                // Calculate USD
                                let price = 0;
                                if (asset.coingeckoId && prices[asset.coingeckoId] && typeof prices[asset.coingeckoId].usd === 'number') {
                                    price = prices[asset.coingeckoId].usd;
                                } else if (asset.name.includes("USD")) {
                                    price = 1;
                                }

                                chainTotalUsd += safeBalance * price;

                            } catch (e) {
                                // Ignore error, keep old value or 0
                            }
                        }));

                        return {
                            chainId,
                            amount: isNaN(chainTotalUsd) ? 0 : chainTotalUsd, // Store Total USD Value (Safety check)
                            tokens: tokenBalances
                        };
                    } catch (err) {
                        console.error(`Error refreshing balance for chain ${chainId}`, err);
                        return existingChain || {
                            chainId,
                            amount: 0,
                            tokens: {}
                        };
                    }
                }) : [];

                // 4. Fetch Stellar Balance
                const stellarPromise = (async () => {
                    if (!mainWallet.addressStellar) return null;
                    const chainId = "stellar";
                    const existingChain = existingChainsMap.get(chainId);

                    try {
                        const balance = await getStellarUSDCBalance(mainWallet.addressStellar);
                        const safeBalance = balance || 0;
                        const usdcPrice = prices["usd-coin"]?.usd || 1;

                        return {
                            chainId,
                            amount: safeBalance * usdcPrice, // USD Value
                            tokens: { "USDC": safeBalance }
                        };
                    } catch (err) {
                        console.error("Error refreshing Stellar balance", err);
                        return existingChain || {
                            chainId,
                            amount: 0,
                            tokens: {}
                        };
                    }
                })();

                const results = await Promise.all([...evmPromises, stellarPromise]);
                const validChains = results.filter((c): c is ChainInfo => c !== null);

                set((state) => ({
                    mainWallet: {
                        ...state.mainWallet,
                        chains: validChains
                    }
                }));
            },

            getMainWalletTotalBalance: () => {
                const { mainWallet } = get();
                return (mainWallet.chains || []).reduce((acc, chain) => acc + chain.amount, 0);
            },

            getMainWalletBalanceByChain: (chainId: string) => {
                const { mainWallet } = get();
                const chain = (mainWallet.chains || []).find(c => c.chainId === chainId);
                return chain ? chain.amount : 0;
            }
        }),
        {
            name: "xo_wallet_storage",
            version: 1,
            onRehydrateStorage: () => (state) => {
                if (state) state.setHydrated(true);
            },
        }
    )
);
