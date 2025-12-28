import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChainInfo } from "./useWalletsStore";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { getBalanceFromChain } from "@/app/hooks/useGetBalanceFromChain";
import { Address } from "viem";

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
    refreshMainWalletBalances: () => Promise<void>; // Added refresh method
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

            refreshMainWalletBalances: async () => {
                const { mainWallet } = get();
                if (!mainWallet.address) return;

                const networks = Object.values(NETWORKS);
                const existingChainsMap = new Map(
                    (mainWallet.chains || []).map((c) => [c.chainId, c])
                );

                const updatedChains = await Promise.all(
                    networks.map(async (network) => {
                        if (!network.evm) return null;

                        const chainId = network.evm.chain.id.toString();
                        const existingChain = existingChainsMap.get(chainId);
                        const currentTokens = existingChain ? existingChain.tokens : {};

                        try {
                            const tokenBalances: Record<string, number> = { ...currentTokens };

                            // Iterate all assets
                            await Promise.all(network.assets.map(async (asset) => {
                                if (!asset.address) return;
                                try {
                                    const { balance } = await getBalanceFromChain(
                                        network.evm!.chain,
                                        mainWallet.address as Address,
                                        asset.address as Address,
                                        asset.decimals
                                    );
                                    tokenBalances[asset.name] = Number(balance || 0);
                                } catch (e) {
                                    // Ignore error, keep old value or 0
                                }
                            }));

                            return {
                                chainId,
                                amount: tokenBalances["USDC"] || 0,
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
                    })
                );

                set((state) => ({
                    mainWallet: {
                        ...state.mainWallet,
                        chains: updatedChains.filter((c): c is ChainInfo => c !== null)
                    }
                }));
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
