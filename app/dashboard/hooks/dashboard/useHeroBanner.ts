import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useXOContracts } from "@/app/dashboard/hooks/wallet/useXOConnect";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { getStellarUSDCBalance } from "@/app/lib/stellar/getStellarUSDCBalance";
import { getBalanceFromChain } from "@/app/hooks/useGetBalanceFromChain";
import { createUSDCTrustline } from "@/app/lib/stellar/createUSDCTrustline";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { Address } from "viem";

export type ActiveWallet = "EVM" | "STELLAR";

export const useHeroBanner = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeWallet, setActiveWallet] = useState<ActiveWallet>("EVM");

    // XO (embedded) -> Current Network Provider info
    const { address: xoAddress, currentNetwork } = useXOContracts();

    // Local fallback main wallet
    const {
        mainWallet,
        xoClient,
        refreshMainWalletBalances,
        getMainWalletTotalBalance,
        getMainWalletBalanceByChain
    } = useXOWalletStore();

    const {
        wallets,
        getAllWalletsTotalBalance,
        updateWalletBalances,
        getTotalFees,
    } = useWalletStore();

    const mainAddressEVM = xoAddress ?? mainWallet.address ?? null;
    const mainAddressStellar = mainWallet.addressStellar ?? null;

    const verifyStellarTrustline = async () => {
        // 1. Stellar Check
        if (mainAddressStellar) {
            try {
                const balance = await getStellarUSDCBalance(mainAddressStellar);

                if (balance === null) {
                    // Trustline missing! Check if we can fix it.
                    const { currentPassword } = useWalletPasswordStore.getState();
                    const { encryptedPrivateKeyStellar, salt, iv } = useXOWalletStore.getState().mainWallet;

                    if (currentPassword && encryptedPrivateKeyStellar && salt && iv) {
                        try {
                            console.log("Auto-creating missing USDC Trustline...");
                            const secret = await decryptPrivateKey(encryptedPrivateKeyStellar, currentPassword, salt, iv);
                            await createUSDCTrustline({ stellarAddress: mainAddressStellar, secret });
                            toast.success("Trustline USDC creada automáticamente");

                            // Refresh balances after fix
                            await refreshMainWalletBalances();
                        } catch (err) {
                            console.error("Failed to auto-create trustline", err);
                        }
                    }
                }
            } catch (error: any) {
                // Ignore 404s or other errors here, allow refresh to handle
            }
        }
    };

    useEffect(() => {
        verifyStellarTrustline();
        refreshMainWalletBalances(); // Initial deep fetch
    }, [mainAddressStellar, mainAddressEVM, currentNetwork]);

    const handleRefreshMainWallet = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        toast.info("Actualizando Main Wallet...");
        try {
            await Promise.all([
                verifyStellarTrustline(),
                refreshMainWalletBalances()
            ]);
            toast.success("Main Wallet actualizada");
        } catch (error) {
            console.error("Error updating main wallet:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRefreshBalances = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        toast.info("Actualizando balances...");

        try {
            await updateWalletBalances();
            toast.success("Balances de hijas actualizados");
        } catch (error) {
            console.error("Error al actualizar balances:", error);
            toast.error("Error al actualizar balances");
        } finally {
            setIsRefreshing(false);
        }
    };

    const stellarUSDCBalance = getMainWalletBalanceByChain("stellar");
    const totalMainBalance = getMainWalletTotalBalance();
    const evmUSDCBalance = Math.max(0, totalMainBalance - stellarUSDCBalance);

    const burnedBalances: Record<ActiveWallet, number> = {
        EVM: evmUSDCBalance,
        STELLAR: stellarUSDCBalance,
    };

    const burnedAddresses: Record<ActiveWallet, string> = {
        EVM: mainAddressEVM ?? "--",
        STELLAR: mainAddressStellar ?? "--",
    };

    const totalAvailableBalance = getAllWalletsTotalBalance !== null
        ? Math.max(0, getAllWalletsTotalBalance())
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
        handleRefreshMainWallet,
    };
};
