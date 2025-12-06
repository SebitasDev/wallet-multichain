import { Address } from "abitype";
import { CHAIN_ID_TO_KEY, ChainKey, NETWORKS } from "@/app/constants/chainsInformation";
import { useWalletStore } from "@/app/store/useWalletsStore";

export const useFindBestRoute = () => {
    const { wallets } = useWalletStore();

    async function allocateAcrossNetworks(desiredAmount: number, toAddress: Address, sendChain: string) {
        const chainId = NETWORKS[sendChain as ChainKey].chain.id;

        // 🔵 SOLO FEE DE ORIGEN
        const getOriginFee = (id: string) => {
            const key = CHAIN_ID_TO_KEY[id] as keyof typeof NETWORKS;
            if (!key) return 0.003;
            return NETWORKS[key].aproxFromFee;
        };

        // 1️⃣ Filtrar wallet destino → no usar su misma chain
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

        balances.sort((a, b) => b.available - a.available);

        for (const b of balances) {
            if (remainingToCover <= 0) break;

            const originFee = getOriginFee(b.networkId);

            // Tomamos como máximo lo que tiene + fee + comisión
            const take = Math.min(b.available, remainingToCover + originFee + 0.01);
            if (take <= 0) continue;

            // Aplicamos fee y comisión SOLO AHORA
            const netAmount = take - (originFee + 0.01);

            // Si después de restar fee+comisión no queda nada → no sirve esta chain
            if (netAmount <= 0) continue;

            totalFees += originFee;

            allocations.push({
                from: b.from,
                networkId: b.networkId,
                amount: netAmount
            });

            remainingToCover -= netAmount;
        }

        // 5️⃣ Comisión total: 0.01 por wallet participante
        const uniqueParticipants = Array.from(new Set(allocations.map(a => a.from)));
        const commission = 0.01 * uniqueParticipants.length;

        const totalTaken = allocations.reduce((sum, a) => sum + a.amount, 0);

        // 6️⃣ Agrupar por wallet
        const grouped: Record<string, { from: string; chains: any[] }> = {};

        for (const item of allocations) {
            if (!grouped[item.from]) {
                grouped[item.from] = {
                    from: item.from,
                    chains: []
                };
            }
            grouped[item.from].chains.push({
                chainId: item.networkId,
                amount: item.amount
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
