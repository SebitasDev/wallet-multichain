"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { PasswordModal } from "@/app/dashboard/components/PasswordModal";
import { XOContractsProvider } from "@/app/dashboard/hooks/useXOConnect";
import { EmbeddedProvider } from "@/app/dashboard/hooks/embebed";
import { ToastContainerCustom } from "@/app/components/atoms/ToastContainerCustom";

export default function YieldLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);
    const [askPassword, setAskPassword] = useState(true);
    const [mode, setMode] = useState<"create" | "unlock">("unlock");

    const encrypted = useWalletPasswordStore(s => s.encryptedPassword);
    const hydrated = useWalletPasswordStore(s => s.hydrated);
    const currentPassword = useWalletPasswordStore(s => s.currentPassword);
    const clearAllWallets = useWalletStore(s => s.clearAll);

    useEffect(() => {
        setMounted(true);

        // Wait for store hydration before deciding to clear wallets
        if (!hydrated) return;

        if (!encrypted) {
            // Use store action instead of direct localStorage manipulation to keep state in sync
            clearAllWallets();
            setMode("create");
            setAskPassword(true);
        } else {
            // Only ask for password if we don't already have an active session
            if (!currentPassword) {
                setMode("unlock");
                setAskPassword(true);
            } else {
                setAskPassword(false);
            }
        }
    }, [encrypted, hydrated, currentPassword]);

    if (!mounted) return null;

    return (
        <Box sx={{ minHeight: "100vh" }}>
            {/* MODAL DE PASSWORD */}
            <PasswordModal
                open={askPassword}
                mode={mode}
                onSuccess={() => setAskPassword(false)}
            />

            {/* 🔒 Bloquea el dashboard si no validó contraseña */}
            {!askPassword && (
                <EmbeddedProvider>
                    <XOContractsProvider password={currentPassword!}>
                        <>
                            {children}
                            <ToastContainerCustom />
                        </>
                    </XOContractsProvider>
                </EmbeddedProvider>
            )}
        </Box>
    );
}
