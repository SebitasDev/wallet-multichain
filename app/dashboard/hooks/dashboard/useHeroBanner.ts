import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useXOContracts } from "@/app/dashboard/hooks/wallet/useXOConnect";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { getStellarUSDCBalance } from "@/app/lib/stellar/getStellarUSDCBalance";
import { getBalanceFromChain } from "@/app/hook/useGetBalanceFromChain";
import { createUSDCTrustline } from "@/app/lib/stellar/createUSDCTrustline";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { Address } from "viem";

export type ActiveWallet = "EVM" | "STELLAR";

export const useHeroBanner = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeWallet, setActiveWallet] = useState<ActiveWallet>("EVM");
    const [stellarUSDCBalance, setStellarUSDCBalance] = useState<number>(0);
    const [evmUSDCBalance, setEvmUSDCBalance] = useState<number>(0);

    // XO (embedded) -> Current Network Provider info
    const { address: xoAddress, currentNetwork } = useXOContracts();

    // Local fallback main wallet
    const { mainWallet, xoClient } = useXOWalletStore();

    const {
        wallets,
        getAllWalletsTotalBalance,
        updateWalletBalances,
        getTotalFees,
    } = useWalletStore();

    const mainAddressEVM = xoAddress ?? mainWallet.address ?? null;
    const mainAddressStellar = mainWallet.addressStellar ?? null;

    const fetchMainWalletBalances = async () => {
        // 1. Stellar
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

                            // Retry fetch
                            const newBalance = await getStellarUSDCBalance(mainAddressStellar);
                            setStellarUSDCBalance(newBalance || 0);
                        } catch (err) {
                            console.error("Failed to auto-create trustline", err);
                            setStellarUSDCBalance(0);
                        }
                    } else {
                        setStellarUSDCBalance(0);
                    }
                } else {
                    setStellarUSDCBalance(balance);
                }
            } catch (error: any) {
                if (error?.response?.status === 404 || error?.message?.includes("404")) {
                    setStellarUSDCBalance(0);
                } else {
                    console.error("Error cargando balance Stellar USDC", error);
                }
            }
        }

        // 2. EVM
        if (mainAddressEVM && currentNetwork) {
            try {
                const { balance } = await getBalanceFromChain(
                    currentNetwork.chain,
                    mainAddressEVM as Address,
                    currentNetwork.usdc as Address
                );
                setEvmUSDCBalance(Number(balance));
            } catch (error) {
                console.error("Error fetching EVM Main Balance", error);
            }
        }
    };

    useEffect(() => {
        fetchMainWalletBalances();
    }, [mainAddressStellar, mainAddressEVM, currentNetwork]);

    const handleRefreshMainWallet = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        toast.info("Actualizando Main Wallet...");
        try {
            await fetchMainWalletBalances();
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
