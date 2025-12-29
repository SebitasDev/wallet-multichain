import { Address } from "abitype";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { useWalletStore } from "@/app/store/useWalletsStore";

export const useFindBestRoute = () => {
    const { wallets } = useWalletStore();

    const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

    async function allocateAcrossNetworks(desiredAmount: number, toAddress: Address, sendChain: string, optimize: boolean, sourceToken: string, tokenPrice: number = 1) {
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
        const safePrice = tokenPrice && tokenPrice > 0 ? tokenPrice : 1; // Prevent div by zero

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

        const balances: Array<{ from: string; networkId: string; availableUSD: number; availableToken: number }> = [];

        for (const wallet of filteredWallets) {
            for (const chain of wallet.chains) {
                // [FIX] Use specific token balance, not total chain USD value
                // Default to USDC if sourceToken is missing (though it should be passed)
                const targetToken = sourceToken || "USDC";
                const chainAmountToken = chain.tokens?.[targetToken] || 0;

                // Compatibility Check
                const sourceKey = CHAIN_ID_TO_KEY[chain.chainId] as ChainKey;
                const sourceConfig = NETWORKS[sourceKey];
                const destConfig = sendNetwork;

                if (!sourceConfig || !destConfig) continue;

                const hasCctp = sourceConfig.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                    destConfig.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;

                const hasNear = sourceConfig.crossChainInformation?.nearIntentInformation?.support &&
                    destConfig.crossChainInformation?.nearIntentInformation?.support;

                if (!hasCctp && !hasNear) continue;

                // Token Compatibility Check
                if (sourceToken) {
                    const isUsdc = sourceToken.toUpperCase().includes("USDC");
                    if (hasCctp && !hasNear && !isUsdc) continue;
                }

                // Balance Calculation
                // 1. Convert Fee to Token to see if we have enough FOR FEE?
                // Or Convert Balance to USD and subtract Fee in USD?
                // Let's do USD calc.
                const balanceUSD = chainAmountToken * safePrice;
                const feeUSD = getOriginFeeUSD(chain.chainId);

                if (balanceUSD - feeUSD <= 0) continue;

                balances.push({
                    from: wallet.address,
                    networkId: chain.chainId,
                    availableUSD: balanceUSD - feeUSD,
                    availableToken: chainAmountToken
                });
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

        let allocations: Array<{ from: string; networkId: string; amountToken: number }> = [];
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
            const takeToken = takeUSD / safePrice;

            totalFeesUSD = round6(totalFeesUSD + originFeeUSD);

            allocations.push({
                from: b.from,
                networkId: b.networkId,
                amountToken: takeToken // Store Token Amount for execution
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
                token: sourceToken
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
