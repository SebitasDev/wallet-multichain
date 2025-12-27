import { Address } from "abitype";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { useWalletStore } from "@/app/store/useWalletsStore";

export const useFindBestRoute = () => {
    const { wallets } = useWalletStore();

    const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

    async function allocateAcrossNetworks(desiredAmount: number, toAddress: Address, sendChain: string, optimize: boolean, sourceToken: string) {
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

        const getOriginFee = (id: string) => {
            const key = CHAIN_ID_TO_KEY[id] as keyof typeof NETWORKS;
            if (!key) return 0.003;
            // Access nested fee, default to 0.003 if missing
            // We must align this with the Facilitator Fee (0.01 - 0.02)
            // To be safe and prevent "Exceeds Balance", we assume 0.02 for everyone.
            return 0.02;
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

        const balances: Array<{ from: string; networkId: string; available: number }> = [];

        for (const wallet of filteredWallets) {
            for (const chain of wallet.chains) {
                const chainAmount = Number(chain.amount);

                // Compatibility Check
                const sourceKey = CHAIN_ID_TO_KEY[chain.chainId] as ChainKey;
                const sourceConfig = NETWORKS[sourceKey];
                const destConfig = sendNetwork;

                if (!sourceConfig || !destConfig) continue;

                const hasCctp = sourceConfig.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                    destConfig.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;

                const hasNear = sourceConfig.crossChainInformation?.nearIntentInformation?.support &&
                    destConfig.crossChainInformation?.nearIntentInformation?.support;

                // If no bridge connection exists, skip
                if (!hasCctp && !hasNear) continue;

                // Token Compatibility Check
                // If sourceToken is defined, ensure it's valid for the available bridges
                if (sourceToken) {
                    const isUsdc = sourceToken.toUpperCase() === "USDC";

                    // If CCTP is the only option, token MUST be USDC
                    if (hasCctp && !hasNear && !isUsdc) continue;

                    // If Near is the only option, token MUST be supported by Near (simplified check, assume check exists or generic)
                    // (For now, we trust the generic compatibility or assume Near supports more)

                    // Specific check for CCTP exclusivity:
                    // If we are relying on CCTP, we can't send non-USDC.
                }


                if (chainAmount - 0.01 - getOriginFee(chain.chainId) <= 0) continue;

                balances.push({
                    from: wallet.address,
                    networkId: chain.chainId,
                    available: chainAmount - 0.01 - getOriginFee(chain.chainId)
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

        let allocations: Array<{ from: string; networkId: string; amount: number }> = [];
        let remainingToCover = desiredAmount;
        let totalFees = 0;

        optimize ? balances.sort((a, b) => b.available - a.available) :
            balances.sort((a, b) => a.available - b.available);

        for (const b of balances) {
            if (remainingToCover <= 0) break;

            const originFee = getOriginFee(b.networkId);

            let take = Math.min(b.available, remainingToCover);
            take = round6(take);

            if (take > remainingToCover) {
                take = remainingToCover;
            }

            totalFees = round6(totalFees + originFee);

            allocations.push({
                from: b.from,
                networkId: b.networkId,
                amount: take
            });

            remainingToCover = round6(remainingToCover - take);
        }

        const uniqueParticipants = Array.from(new Set(allocations.map(a => a.from)));
        const commission = round6(0.01 * uniqueParticipants.length);

        const totalTaken = round6(
            allocations.reduce((sum, a) => sum + a.amount, 0)
        );

        const grouped: Record<string, { from: string; chains: any[] }> = {};

        for (const item of allocations) {
            if (item.amount <= 0) continue;

            if (!grouped[item.from]) {
                grouped[item.from] = {
                    from: item.from,
                    chains: []
                };
            }
            grouped[item.from].chains.push({
                chainId: item.networkId,
                amount: round6(item.amount),
                token: sourceToken
            });
        }

        const final = {
            desiredAmount,
            targetAmount: desiredAmount,
            commission,
            totalFees,
            totalAmountTaken: totalTaken,
            remainingToCover: Math.max(0, remainingToCover),
            allocations: Object.values(grouped)
        };

        console.log("📦 Final Allocations:", final);

        return final;
    }

    return { allocateAcrossNetworks };
};
