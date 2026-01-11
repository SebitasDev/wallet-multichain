import { useEffect, useState, MouseEvent, SetStateAction, Dispatch } from "react";
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
import { ChainKey } from "@/app/types/chain";

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
                            await refreshMainWalletBalances(mainAddressEVM || undefined);
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
        refreshMainWalletBalances(mainAddressEVM || undefined); // Initial deep fetch
    }, [mainAddressStellar, mainAddressEVM, currentNetwork]);

    const handleRefreshMainWallet = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        toast.info("Actualizando Main Wallet...");
        try {
            await Promise.all([
                verifyStellarTrustline(),
                refreshMainWalletBalances(mainAddressEVM || undefined)
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


/**
 * Extracted State Logic for HeroBannerMainWallet
 */
export const useMainWalletUI = (
    activeWallet: ActiveWallet,
    resetWallet: () => void
) => {
    // UI Local State
    const [loadWalletOpen, setLoadWalletOpen] = useState(false);
    const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedChain, setSelectedChain] = useState<ChainKey>("Base");
    const [chainMenuAnchorEl, setChainMenuAnchorEl] = useState<null | HTMLElement>(null);

    // Export/Auth State
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportData, setExportData] = useState("");
    const [exportType, setExportType] = useState<"mnemonic" | "privateKey">("mnemonic");
    const [authAction, setAuthAction] = useState<"export" | "reset" | null>(null);

    const handleAuthSuccess = async () => {
        const { currentPassword } = useWalletPasswordStore.getState();

        if (authAction === "reset") {
            setPasswordModalOpen(false);
            resetWallet();
            return;
        }

        const { mainWallet } = useXOWalletStore.getState();

        if (!currentPassword || !mainWallet) {
            toast.error("Error: Información de wallet no encontrada.");
            setPasswordModalOpen(false);
            return;
        }

        try {
            // Decrypt Mnemonic
            if (mainWallet.encryptedMnemonic && mainWallet.salt && mainWallet.iv) {
                try {
                    const mnemonic = await decryptPrivateKey(
                        mainWallet.encryptedMnemonic,
                        currentPassword,
                        mainWallet.salt,
                        mainWallet.iv
                    );
                    if (mnemonic) {
                        setExportData(mnemonic);
                        setExportType("mnemonic");
                        setPasswordModalOpen(false);
                        setExportModalOpen(true);
                        return;
                    }
                } catch (e) {
                    console.warn("Mnemonic decryption failed", e);
                }
            }

            // Fallback: Private Key
            let encryptedKey = activeWallet === "EVM"
                ? mainWallet.encryptedPrivateKey
                : mainWallet.encryptedPrivateKeyStellar;

            if (encryptedKey && mainWallet.salt && mainWallet.iv) {
                const pk = await decryptPrivateKey(
                    encryptedKey,
                    currentPassword,
                    mainWallet.salt,
                    mainWallet.iv
                );
                setExportData(pk);
                setExportType("privateKey");
                setPasswordModalOpen(false);
                setExportModalOpen(true);
            } else {
                toast.error("No se encontró clave privada.");
                setPasswordModalOpen(false);
            }

        } catch (error) {
            console.error("Export error:", error);
            toast.error("Error al desencriptar o contraseña incorrecta.");
            setPasswordModalOpen(false);
        }
    };

    return {
        // State
        loadWalletOpen, setLoadWalletOpen,
        walletAnchorEl, setWalletAnchorEl,
        selectedChain, setSelectedChain,
        chainMenuAnchorEl, setChainMenuAnchorEl,
        passwordModalOpen, setPasswordModalOpen,
        exportModalOpen, setExportModalOpen,
        exportData, setExportData,
        exportType, setExportType,
        authAction, setAuthAction,

        // Handlers
        handleAuthSuccess
    };
};
