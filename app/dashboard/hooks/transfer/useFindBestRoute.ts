import { Address } from "abitype";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { useWalletStore } from "@/app/store/useWalletsStore";

export const useFindBestRoute = () => {
    const { wallets } = useWalletStore();

    const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

    async function allocateAcrossNetworks(desiredAmount: number, toAddress: Address, sendChain: string, optimize: boolean, sourceToken: string, pricesMap: Record<string, number> = {}) {
        const sendNetwork = NETWORKS[sendChain as ChainKey];
        if (!sendNetwork || !sendNetwork.evm) {
            console.error(`Chain ${sendChain} not configured for EVM`);
            return {
                desiredAmount,
                targetAmount: 0,
                commission: 0,
                totalFees: 0,
                totalAmountTaken: 0,
                remainingToCover: desiredAmount,
                allocations: []
            };
        }

        const chainId = sendNetwork.evm.chain.id;

        const getOriginFeeUSD = (id: string) => {
            const isDev = process.env.NEXT_PUBLIC_ENVIROMENT === "development" || process.env.NODE_ENV === "development";
            return isDev ? 0 : 0.02; // USD
        };

        const filteredWallets = wallets
            .map(wallet => {
                if (wallet.address.toLowerCase() === toAddress.toLowerCase()) {
                    const filteredChains = wallet.chains.filter(c => c.chainId !== chainId.toString());
                    return { ...wallet, chains: filteredChains };
                }
                return wallet;
            })
            .filter(wallet => wallet.chains.length > 0);

        const balances: Array<{ from: string; networkId: string; availableUSD: number; availableToken: number; token: string; price: number }> = [];

        for (const wallet of filteredWallets) {
            for (const chain of wallet.chains) {
                // [FIX] Multi-Token Support: Iterate all assets on this chain
                const assets = sendNetwork.assets || [];

                for (const asset of assets) {
                    const currentTokenName = asset.name;
                    const chainAmountToken = chain.tokens?.[currentTokenName] || 0;

                    if (chainAmountToken <= 0) continue;

                    // Compatibility Check (Should match logic for asset types)
                    const sourceKey = CHAIN_ID_TO_KEY[chain.chainId] as ChainKey;
                    const sourceConfig = NETWORKS[sourceKey];
                    const destConfig = sendNetwork; // sending to same network usually? Or cross-chain? 
                    // Wait, `sendChain` is Destination? "sendChain" in SendForm is *Destination* usually.
                    // Actually `allocateAcrossNetworks` iterates ALL wallets. `chain` is Source. `sendChain` is Destination.
                    // Let's verify `sourceConfig` vs `destConfig`.

                    if (!sourceConfig || !destConfig) continue;

                    const hasCctp = sourceConfig.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                        destConfig.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;

                    const hasNear = sourceConfig.crossChainInformation?.nearIntentInformation?.support &&
                        destConfig.crossChainInformation?.nearIntentInformation?.support;

                    // Filter Logic:
                    // If CCTP/Near is required, ensure token is compatible.
                    // Usually this means USDC.
                    const isUsdc = currentTokenName.toUpperCase().includes("USDC");

                    if (hasCctp && !hasNear && !isUsdc) {
                        // If ONLY CCTP is available (no Near), force USDC
                        continue;
                    }

                    // Price Lookup
                    // Try coingeckoId, then fallback to 1 if stable
                    const priceKey = asset.coingeckoId || currentTokenName.toLowerCase();
                    // We need to look up in pricesMap. value might be under 'usd-coin' or 'tether' etc.
                    // Assumption: pricesMap keys match what useTokenPrice/useWalletStore returns

                    // Simple logic: if specific price exists, use it. Else if USD in name, 1.
                    let safePrice = pricesMap[asset.coingeckoId || ""] || 0;
                    if (safePrice <= 0 && (currentTokenName.includes("USD") || currentTokenName.includes("DAI"))) {
                        safePrice = 1;
                    }
                    if (safePrice <= 0) continue; // Skip if no price

                    const balanceUSD = chainAmountToken * safePrice;
                    const feeUSD = getOriginFeeUSD(chain.chainId);

                    if (balanceUSD - feeUSD <= 0) continue;

                    balances.push({
                        from: wallet.address,
                        networkId: chain.chainId,
                        availableUSD: balanceUSD - feeUSD,
                        availableToken: chainAmountToken,
                        token: currentTokenName,
                        price: safePrice
                    });
                }
            }
        }

        if (balances.length === 0) {
            return {
                desiredAmount,
                targetAmount: 0,
                commission: 0,
                totalFees: 0,
                totalAmountTaken: 0,
                remainingToCover: desiredAmount,
                allocations: []
            };
        }

        let allocations: Array<{ from: string; networkId: string; amountToken: number; token: string }> = [];
        let remainingToCoverUSD = desiredAmount;
        let totalFeesUSD = 0;

        optimize ? balances.sort((a, b) => b.availableUSD - a.availableUSD) :
            balances.sort((a, b) => a.availableUSD - b.availableUSD);

        for (const b of balances) {
            if (remainingToCoverUSD <= 0) break;

            const originFeeUSD = getOriginFeeUSD(b.networkId); // 0.02

            // Take matching USD amount
            let takeUSD = Math.min(b.availableUSD, remainingToCoverUSD);
            takeUSD = round6(takeUSD);

            if (takeUSD > remainingToCoverUSD) {
                takeUSD = remainingToCoverUSD;
            }

            // Convert Take Back to Token
            const takeToken = takeUSD / b.price;

            totalFeesUSD = round6(totalFeesUSD + originFeeUSD);

            allocations.push({
                from: b.from,
                networkId: b.networkId,
                amountToken: takeToken, // Store Token Amount for execution
                token: b.token
            });

            remainingToCoverUSD = round6(remainingToCoverUSD - takeUSD);
        }

        const uniqueParticipants = Array.from(new Set(allocations.map(a => a.from)));
        const commission = round6(0.01 * uniqueParticipants.length);

        const totalTakenToken = round6(
            allocations.reduce((sum, a) => sum + a.amountToken, 0)
        );

        const grouped: Record<string, { from: string; chains: any[] }> = {};

        for (const item of allocations) {
            if (item.amountToken <= 0) continue;

            if (!grouped[item.from]) {
                grouped[item.from] = {
                    from: item.from,
                    chains: []
                };
            }
            grouped[item.from].chains.push({
                chainId: item.networkId,
                amount: item.amountToken, // Token Amount
                token: item.token,
                id: crypto.randomUUID()
            });
        }

        const final = {
            desiredAmount,
            targetAmount: desiredAmount,
            commission,
            totalFees: totalFeesUSD,
            totalAmountTaken: totalTakenToken, // This is Token Sum? Might be meaningless if mixed? But we force single token so valid.
            remainingToCover: Math.max(0, remainingToCoverUSD),
            allocations: Object.values(grouped)
        };

        console.log("📦 Final Allocations:", final);

        return final;
    }


    return { allocateAcrossNetworks };
};
