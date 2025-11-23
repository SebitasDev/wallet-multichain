import {Address} from "abitype";
import {useWalletsInfoStore} from "@/app/store/useWalletsInfoStore";

export const useFindBestRoute = () => {
    const { wallets } = useWalletsInfoStore();

    async function allocateAcrossNetworks(targetAmount: number, toAddress: Address) {
        const balances: Array<{ from: string; networkId: string; amount: number }> = [];

        console.log("wallets", wallets);

        const filteredWallets = wallets.filter(wallet => wallet.address.toLowerCase() !== toAddress.toLowerCase());

        for (const wallet of filteredWallets) {
            for (const chain of wallet.chains) {
                if (chain.chainAmount <= 0) continue;

                balances.push({
                    from: wallet.address,
                    networkId: chain.chainId,
                    amount: chain.chainAmount
                });
            }
        }

        balances.sort((a, b) => a.amount - b.amount);

        // 3️⃣ Selección de fondos
        const rawAllocations: Array<{
            from: string;
            networkId: string;
            amount: number;
        }> = [];

        let totalTaken = 0;

        for (const b of balances) {
            if (totalTaken >= targetAmount) break;

            const remaining = targetAmount - totalTaken;
            const take = Math.min(b.amount, remaining);

            rawAllocations.push({
                from: b.from,
                networkId: b.networkId,
                amount: take,
            });

            totalTaken += take;
        }

        const grouped: Record<string, { from: string; chains: Array<{ chainId: string; amount: number }> }> = {};

        for (const item of rawAllocations) {
            if (!grouped[item.from]) {
                grouped[item.from] = { from: item.from, chains: [] };
            }

            grouped[item.from].chains.push({
                chainId: item.networkId,
                amount: item.amount,
            });
        }

        const allocations = Object.values(grouped);

        const summary = {
            targetAmount,
            totalAmountTaken: totalTaken,
            remainingToCover: Math.max(0, targetAmount - totalTaken),
            allocations,
        };

        console.log("🔹 Distribución final por wallet y chain:");
        console.table(
            allocations.flatMap(a =>
                a.chains.map(c => ({
                    Wallet: a.from,
                    Chain: c.chainId,
                    Monto: c.amount
                }))
            )
        );

        console.log("📊 Resumen general:", summary);

        return summary;
    }

    return { allocateAcrossNetworks };
};
