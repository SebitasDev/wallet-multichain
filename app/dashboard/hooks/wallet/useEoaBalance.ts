import { useState, useEffect } from "react";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { getBalanceFromChain } from "@/app/hooks/useGetBalanceFromChain";
import { ActiveWallet } from "@/app/dashboard/hooks/dashboard/useHeroBanner";
import { ChainKey } from "@/app/types/chain";

export const useEoaBalance = (
    activeWallet: ActiveWallet,
    ownerAddress: string | null,
    selectedChain: ChainKey, // Trigger update on chain change
    refreshTrigger: number // Manual trigger
) => {
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        const fetchEoaBalance = async () => {
            if (activeWallet === "EVM" && ownerAddress) {
                const evmChains = Object.values(NETWORKS).filter(net => net.evm);

                const balancePromises = evmChains.map(async (config) => {
                    // Start with 0
                    const usdcAsset = config.assets.find(a => a.name === "USDC");
                    if (usdcAsset && config.evm) {
                        try {
                            const result = await getBalanceFromChain(
                                config.evm.chain,
                                ownerAddress as `0x${string}`,
                                usdcAsset.address as `0x${string}`,
                                usdcAsset.decimals
                            );
                            if (!result.error) {
                                return parseFloat(result.balance);
                            }
                        } catch (e) {
                            console.error(`[useEoaBalance] Error fetching balance for ${config.label}:`, e);
                        }
                    }
                    return 0;
                });

                const balances = await Promise.all(balancePromises);
                const totalBalance = balances.reduce((acc, curr) => acc + curr, 0);

                setBalance(totalBalance);
            } else {
                setBalance(0);
            }
        };

        fetchEoaBalance();
    }, [activeWallet, ownerAddress, selectedChain, refreshTrigger]);

    return balance;
};
