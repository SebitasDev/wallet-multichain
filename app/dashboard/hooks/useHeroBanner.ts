import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";
import { useMainWalletStore } from "@/app/store/useMainWalletStore";
import { getStellarUSDCBalance } from "@/app/lib/stellar/getStellarUSDCBalance";

export type ActiveWallet = "EVM" | "STELLAR";

export const useHeroBanner = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeWallet, setActiveWallet] = useState<ActiveWallet>("EVM");
    const [stellarUSDCBalance, setStellarUSDCBalance] = useState<number>(0);

    // XO (embedded)
    const { address: xoAddress } = useXOContracts();

    // Local fallback main wallet
    const { mainWallet, xoClient } = useMainWalletStore();

    const {
        wallets,
        getAllWalletsTotalBalance,
        updateWalletBalances,
        getTotalFees,
    } = useWalletStore();

    useEffect(() => {
        if (!mainWallet.addressStellar) return;

        const loadStellarBalance = async () => {
            try {
                const balance = await getStellarUSDCBalance(
                    mainWallet.addressStellar!
                );
                setStellarUSDCBalance(balance);
            } catch (error) {
                console.error("Error cargando balance Stellar USDC", error);
            }
        };

        loadStellarBalance();
    }, [mainWallet.addressStellar]);

    const handleRefreshBalances = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        toast.info("Actualizando balances...");

        try {
            await updateWalletBalances();
            toast.success("Balances actualizados");
        } catch (error) {
            console.error("Error al actualizar balances:", error);
            toast.error("Error al actualizar balances");
        } finally {
            setIsRefreshing(false);
        }
    };

    const mainAddress = xoAddress ?? mainWallet.address ?? null;

    const burnedBalances: Record<ActiveWallet, number> = {
        EVM: 0.00,
        STELLAR: stellarUSDCBalance,
    };

    const burnedAddresses: Record<ActiveWallet, string> = {
        EVM: mainAddress ?? "--",
        STELLAR: mainWallet.addressStellar ?? "--",
    };

    const totalAvailableBalance = getAllWalletsTotalBalance !== null
        ? Math.max(0, getAllWalletsTotalBalance() - getTotalFees())
        : 0;

    return {
        // State
        activeWallet,
        setActiveWallet,
        isRefreshing,

        // Data
        wallets,
        xoClient,
        burnedBalances,
        burnedAddresses,
        totalAvailableBalance,
        totalFees: getTotalFees(),
        hasCalculatedTotal: getAllWalletsTotalBalance !== null,

        // Actions
        handleRefreshBalances,
    };
};
