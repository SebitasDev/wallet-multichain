import { NETWORKS, CHAIN_ID_TO_KEY } from "@/app/constants/chainsInformation";
import { WalletInfo } from "@/app/store/useWalletsStore";

/**
 * Calculates the total fees across all chains where the user has wallets with balance.
 * 
 * @param wallets - Array of wallet information
 * @returns Total fee amount in USDC
 */
export function calculateTotalFees(wallets: WalletInfo[]): number {
    if (!wallets || wallets.length === 0) {
        return 0;
    }

    // Get aggregated balance per chain
    const balancePerChain = new Map<string, number>();

    wallets.forEach((wallet) => {
        wallet.chains.forEach((chain) => {
            if (chain.amount > 0) {
                const currentBalance = balancePerChain.get(chain.chainId) || 0;
                balancePerChain.set(chain.chainId, currentBalance + chain.amount);
            }
        });
    });

    // Sum fees for each unique chain if balance covers (fee + commission)
    let totalFee = 0;
    const COMMISSION_PER_CHAIN = 0.01;

    balancePerChain.forEach((balance, chainId) => {
        const chainKey = CHAIN_ID_TO_KEY[chainId];

        if (chainKey && NETWORKS[chainKey as keyof typeof NETWORKS]) {
            const network = NETWORKS[chainKey as keyof typeof NETWORKS];
            const chainFee = network.crossChainInformation.circleInformation?.aproxFromFee || 0;
            const costForChain = chainFee + COMMISSION_PER_CHAIN;

            // Only charge if the user has enough balance to cover the cost
            if (balance > costForChain) {
                totalFee += costForChain;
            }
        }
    });

    return totalFee;
}

/**
 * Formats the fee amount for display with proper precision
 * 
 * @param fee - Fee amount
 * @returns Formatted fee string
 */
export function formatFeeAmount(fee: number): string {
    if (fee === 0) return "0.00";

    // Handle very small fees
    if (fee < 0.01) {
        return fee.toFixed(4);
    }

    return fee.toFixed(2);
}
