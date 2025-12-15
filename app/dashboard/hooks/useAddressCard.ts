import { useState } from "react";
import { Address } from "abitype";
import { toast } from "react-toastify";
import { useWalletStore } from "@/app/store/useWalletsStore";

interface UseAddressCardProps {
    address: Address;
    walletName: string;
}

export const useAddressCard = ({ address, walletName }: UseAddressCardProps) => {
    const [showMore, setShowMore] = useState(false);
    const [showNameExpanded, setShowNameExpanded] = useState(false);

    const { getWalletTotalBalance, removeWallet } = useWalletStore();

    // Selectors / Computed
    const totalBalance = getWalletTotalBalance(address);
    const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const exceedsNameLimit = walletName.length > 12;
    const displayName = exceedsNameLimit && !showNameExpanded ? `${walletName.slice(0, 12)}...` : walletName;

    // Actions
    const toggleShowMore = () => setShowMore((prev) => !prev);
    const toggleNameExpanded = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setShowNameExpanded((prev) => !prev);
    };

    const handleRemoveWallet = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeWallet(address);
    };

    const copyToClipboard = async (value: string, label: string) => {
        const text = value ?? "";
        if (!text) {
            toast.error("No hay nada para copiar");
            return;
        }

        const onSuccess = () => toast.success(`${label} copiado`);
        const onError = () => toast.error("No se pudo copiar");

        // Modern Clipboard API
        if (navigator?.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                onSuccess();
                return;
            } catch (err) {
                // Fallback if permission denied or error
            }
        }

        // Fallback Strategy
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            const ok = document.execCommand("copy");
            ok ? onSuccess() : onError();
        } catch {
            onError();
        } finally {
            document.body.removeChild(textarea);
        }
    };

    return {
        // State
        showMore,
        showNameExpanded,

        // Data
        totalBalance,
        truncated,
        displayName,
        exceedsNameLimit,

        // Actions
        toggleShowMore,
        toggleNameExpanded,
        handleRemoveWallet,
        copyToClipboard
    };
};
