import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { WalletInfo } from "@/app/store/useWalletManager";
import { BaseIcon } from "@/app/components/atoms/BaseIcon";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import PolygonIcon from "@/app/components/atoms/PolygonIcon";
import { UnichainIcon } from "@/app/components/atoms/UnichainIcon";

export const chains = [
    { id: "base", label: "Base", icon: BaseIcon },
    { id: "optimism", label: "Optimism", icon: OPIcon },
    { id: "arbitrum", label: "Arbitrum", icon: ArbIcon },
    { id: "polygon", label: "Polygon", icon: PolygonIcon },
    { id: "unichain", label: "Unichain", icon: UnichainIcon },
];

export interface UseReceiveModalProps {
    open: boolean;
    wallets: WalletInfo[];
}

export const useReceiveModal = ({ open, wallets }: UseReceiveModalProps) => {
    const [selectedWallet, setSelectedWallet] = useState<string>("");
    const [selectedChain, setSelectedChain] = useState<string>("base");

    useEffect(() => {
        if (open && wallets.length) {
            setSelectedWallet(wallets[0].address);
            setSelectedChain("base");
        }
    }, [open, wallets]);

    const currentAddress = useMemo(() => {
        const found = wallets.find((w) => w.address === selectedWallet) ?? wallets[0];
        return found?.address ?? "";
    }, [selectedWallet, wallets]);

    const currentChain = chains.find((c) => c.id === selectedChain) || chains[0];

    const qrValue = currentAddress
        ? `${currentAddress}`
        : "ethereum:0x0000000000000000000000000000000000000000";

    const copyToClipboard = async (value: string) => {
        if (!value) {
            toast.error("No hay address para copiar");
            return;
        }
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
                toast.success("Address copiado");
                return;
            }
        } catch {
            // fallback
        }
        const manual = window.prompt("Copia y pega:", value);
        if (manual !== null) toast.success("Address copiado");
    };

    return {
        selectedWallet,
        setSelectedWallet,
        selectedChain,
        setSelectedChain,
        currentAddress,
        currentChain,
        qrValue,
        copyToClipboard,
        chains
    };
};
