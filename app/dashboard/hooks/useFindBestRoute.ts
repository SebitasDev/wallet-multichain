import { Address } from "abitype";
import { useWalletsInfoStore } from "@/app/store/useWalletsInfoStore";
import {CHAIN_ID_TO_KEY, ChainKey, NETWORKS} from "@/app/constants/chainsInformation";

export const useFindBestRoute = () => {
    const { wallets } = useWalletsInfoStore();

    async function allocateAcrossNetworks(desiredAmount: number, toAddress: Address, sendChain: string) {
        const balances: Array<{ from: string; networkId: string; amount: number; rawChainAmount: number }> = [];

        const chainId = NETWORKS[sendChain as ChainKey].chain.id;

        const getFee = (id: string) => {
            const key = CHAIN_ID_TO_KEY[id];
            if (!key) return 0.003;
            return NETWORKS[key].aproxFromFee;
        };

        const destinationFee = getFee(chainId.toString());

        const filteredWallets = wallets
            .map(wallet => {
                console.log(wallet)
                if (wallet.address.toLowerCase() === toAddress.toLowerCase()) {
                    return {
                        ...wallet,
                        chains: wallet.chains.filter(chain => chain.chainId !== chainId.toString())
                    };
                }
                return wallet;
            })
            .filter(wallet => wallet.chains.length > 0);

        // 2. Recolectar balances restando FEE DE ORIGEN
        for (const wallet of filteredWallets) {
            for (const chain of wallet.chains) {

                const chainAmount = Number(chain.chainAmount);
                const originFee = Number(getFee(chain.chainId.toString()));

                const availableAmount = chainAmount - originFee - 0.01;

                // filtros a prueba de NaN, negativos y valores inservibles
                if (!Number.isFinite(availableAmount)) continue;
                if (availableAmount <= 0) continue;

                balances.push({
                    from: wallet.address,
                    networkId: chain.chainId,
                    amount: availableAmount,
                    rawChainAmount: chain.chainAmount
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

        let targetEstimate = desiredAmount;
        let lastSummary: any = null;

        for (let iter = 0; iter < 3; iter++) {

            balances.sort((a, b) => a.amount - b.amount);

            const rawAllocTemp: Array<{ from: string; networkId: string; amount: number }> = [];
            let takenTemp = 0;

            for (const b of balances) {
                if (takenTemp >= targetEstimate) break;

                const remaining = targetEstimate - takenTemp;
                if (remaining < 0.01) break;

                const take = Math.min(b.amount, remaining);
                rawAllocTemp.push({ from: b.from, networkId: b.networkId, amount: take });
                takenTemp += take;
            }

            const participants = rawAllocTemp.length;
            const uniqueOrigins = Array.from(new Set(rawAllocTemp.map(r => r.networkId)));

            if (participants === 0) {
                lastSummary = {
                    desiredAmount,
                    targetAmount: 0,
                    commission: 0,
                    totalFees: 0,
                    totalAmountTaken: 0,
                    remainingToCover: desiredAmount,
                    allocations: []
                };
                break;
            }

            const allSameChainAsSend =
                uniqueOrigins.length === 1 &&
                uniqueOrigins[0] === chainId.toString();

            const commission = allSameChainAsSend ? 0.01 : 0.01 * participants;

            let totalFees = 0;

            if (allSameChainAsSend) {
                totalFees = getFee(chainId.toString());
            } else {
                totalFees = destinationFee;

                for (const origin of uniqueOrigins) {
                    totalFees += getFee(origin.toString());
                }
            }

            const newTarget = desiredAmount - commission - totalFees;

            const eps = 1e-9;

            if (Math.abs(newTarget - targetEstimate) < eps) {
                const grouped: Record<string, { from: string; chains: any[] }> = {};
                for (const item of rawAllocTemp) {
                    if (!grouped[item.from]) grouped[item.from] = { from: item.from, chains: [] };
                    grouped[item.from].chains.push({ chainId: item.networkId, amount: item.amount });
                }

                const final = {
                    desiredAmount,
                    targetAmount: newTarget,
                    commission,
                    totalFees,
                    totalAmountTaken: takenTemp,
                    remainingToCover: Math.max(0, newTarget - takenTemp),
                    allocations: Object.values(grouped)
                };

                console.log("📦 Final Allocations:", final);
                return final;
            }

            targetEstimate = Math.max(0, newTarget);
            lastSummary = { newTarget, rawAllocTemp, takenTemp, commission, totalFees };
        }

        if (!lastSummary) return {
            desiredAmount,
            targetAmount: 0,
            commission: 0,
            totalFees: 0,
            totalAmountTaken: 0,
            remainingToCover: desiredAmount,
            allocations: []
        };

        // build final output when not converged
        const grouped: Record<string, { from: string; chains: any[] }> = {};
        for (const item of lastSummary.rawAllocTemp) {
            if (!grouped[item.from]) grouped[item.from] = { from: item.from, chains: [] };
            grouped[item.from].chains.push({ chainId: item.networkId, amount: item.amount });
        }

        const final = {
            desiredAmount,
            targetAmount: lastSummary.newTarget,
            commission: lastSummary.commission,
            totalFees: lastSummary.totalFees,
            totalAmountTaken: lastSummary.takenTemp,
            remainingToCover: Math.max(0, lastSummary.newTarget - lastSummary.takenTemp),
            allocations: Object.values(grouped)
        };

        console.log("📦 Final Allocations (fallback):", final);
        return final;
    }

    return { allocateAcrossNetworks };
};
