import { Address } from "abitype";
import { CHAIN_ID_TO_KEY, ChainKey, NETWORKS } from "@/app/constants/chainsInformation";
import { useWalletStore } from "@/app/store/useWalletsStore";

export const useFindBestRoute = () => {
    const { wallets } = useWalletStore();

    async function allocateAcrossNetworks(desiredAmount: number, toAddress: Address, sendChain: string) {
        const chainId = NETWORKS[sendChain as ChainKey].chain.id;

        const getFee = (id: string) => {
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
                const originFee = getFee(chain.chainId.toString());
                const available = chainAmount - originFee;

                if (available <= 0) continue;

                balances.push({ from: wallet.address, networkId: chain.chainId, available });
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
        let commission = 0;

        // Ordenar wallets por available descending para usar más de los grandes primero
        balances.sort((a, b) => b.available - a.available);

        for (const b of balances) {
            if (remainingToCover <= 0) break;

            const isSameChainAsSend = b.networkId === chainId.toString();
            const fee = isSameChainAsSend ? getFee(chainId.toString()) : getFee(b.networkId) + getFee(chainId.toString());
            totalFees += fee;

            const take = Math.min(b.available, remainingToCover + fee + 0.01);
            if (take <= 0) continue;

            allocations.push({ from: b.from, networkId: b.networkId, amount: take - (fee + 0.01) });
            remainingToCover -= (take - fee);
        }

        // Calcular comisión: 0.01 por cada wallet/chain usado fuera de la misma chain
        const uniqueParticipants = Array.from(new Set(allocations.map(a => a.from)));
        commission = 0.01 * uniqueParticipants.length;

        const totalTaken = allocations.reduce((sum, a) => sum + a.amount, 0);

        // Agrupar por wallet
        const grouped: Record<string, { from: string; chains: any[] }> = {};
        for (const item of allocations) {
            if (!grouped[item.from]) grouped[item.from] = { from: item.from, chains: [] };
            grouped[item.from].chains.push({ chainId: item.networkId, amount: item.amount });
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
