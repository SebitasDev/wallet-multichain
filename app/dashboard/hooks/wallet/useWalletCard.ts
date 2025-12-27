import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Wallet } from "@/app/dashboard/types";

export const useWalletCard = (wallet: Wallet) => {
    const [expanded, setExpanded] = useState(wallet.defaultExpanded ?? false);
    const [showNameExpanded, setShowNameExpanded] = useState(false);

    const visibleChains = useMemo(
        () => (expanded ? wallet.chains : wallet.chains.slice(0, 2)),
        [expanded, wallet.chains],
    );

    const copyToClipboard = async (value: string, label: string) => {
        const text = value ? String(value) : "";
        if (!text) {
            toast.error("No hay nada para copiar");
            return;
        }

        const onSuccess = () => toast.success(`${label} copiado`);
        const onError = () => toast.error("No se pudo copiar");

        const promptFallback = () => {
            const manual = window.prompt("Copia y pega:", text);
            if (manual !== null) onSuccess();
        };

        const fallbackCopy = () => {
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
                promptFallback();
            } finally {
                document.body.removeChild(textarea);
            }
        };

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                onSuccess();
            } else {
                fallbackCopy();
            }
        } catch {
            fallbackCopy();
        }
    };

    const exceedsNameLimit = wallet.name.length > 12;
    const displayName =
        exceedsNameLimit && !showNameExpanded
            ? `${wallet.name.slice(0, 12)}...`
            : wallet.name;

    const toggleExpanded = () => setExpanded((prev) => !prev);
    const toggleNameExpanded = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowNameExpanded((prev) => !prev);
    };

    return {
        expanded,
        showNameExpanded,
        visibleChains,
        copyToClipboard,
        exceedsNameLimit,
        displayName,
        toggleExpanded,
        toggleNameExpanded
    };
};
