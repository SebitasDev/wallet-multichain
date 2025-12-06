import { Address } from "abitype";
import { CHAIN_ID_TO_KEY, ChainKey, NETWORKS } from "@/app/constants/chainsInformation";
import { useWalletStore } from "@/app/store/useWalletsStore";

export const useFindBestRoute = () => {
    const { wallets } = useWalletStore();

    const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

    async function allocateAcrossNetworks(desiredAmount: number, toAddress: Address, sendChain: string) {
        const chainId = NETWORKS[sendChain as ChainKey].chain.id;

        const MIN_USDC = 0.000001;

        const getOriginFee = (id: string) => {
            const key = CHAIN_ID_TO_KEY[id] as keyof typeof NETWORKS;
            if (!key) return 0.003;
            return NETWORKS[key].aproxFromFee;
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
                if (chainAmount <= 0) continue;

                balances.push({
                    from: wallet.address,
                    networkId: chain.chainId,
                    available: chainAmount
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

        // Ordenar por quien tiene más
        balances.sort((a, b) => b.available - a.available);

        // Ordenar por menor a mayor !
        //balances.sort((a, b) => a.available - b.available);

        for (const b of balances) {
            if (remainingToCover <= 0) break;

            const originFee = getOriginFee(b.networkId);

            let take = Math.min(b.available, remainingToCover + originFee + 0.01);
            take = round6(take);

            if (take <= 0) continue;

            let netAmount = take - (originFee + 0.01);
            netAmount = round6(netAmount);

            if (netAmount < MIN_USDC) continue;

            totalFees = round6(totalFees + originFee);

            allocations.push({
                from: b.from,
                networkId: b.networkId,
                amount: netAmount
            });

            remainingToCover = round6(remainingToCover - netAmount);
        }

        // 5️⃣ Comisión
        const uniqueParticipants = Array.from(new Set(allocations.map(a => a.from)));
        const commission = round6(0.01 * uniqueParticipants.length);

        // 6️⃣ Total tomado
        const totalTaken = round6(
            allocations.reduce((sum, a) => sum + a.amount, 0)
        );

        // 7️⃣ Agrupar por wallet
        const grouped: Record<string, { from: string; chains: any[] }> = {};

        for (const item of allocations) {
            if (item.amount < MIN_USDC) continue;

            if (!grouped[item.from]) {
                grouped[item.from] = {
                    from: item.from,
                    chains: []
                };
            }
            grouped[item.from].chains.push({
                chainId: item.networkId,
                amount: round6(item.amount)
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
