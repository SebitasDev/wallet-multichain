"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/app/store/useWalletsStore"; // Keep for fallback check
import { Box, CircularProgress } from "@mui/material";

// Providers & Store
import { XOContractsProvider } from "@/app/dashboard/hooks/wallet/useXOConnect";
import { EmbeddedProvider } from "@/app/dashboard/hooks/dashboard/embedded";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { PasswordModal } from "@/app/dashboard/components/PasswordModal";
import { ToastContainerCustom } from "@/app/components/atoms/ToastContainerCustom";

export default function CommonPeopleLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    // Auth Logic (Reused from DashboardLayout)
    const [mounted, setMounted] = useState(false);
    const [askPassword, setAskPassword] = useState(true);
    const [mode, setMode] = useState<"create" | "unlock">("unlock");

    const encrypted = useWalletPasswordStore(s => s.encryptedPassword);
    const hydrated = useWalletPasswordStore(s => s.hydrated);
    const currentPassword = useWalletPasswordStore(s => s.currentPassword);
    const clearAllWallets = useWalletStore(s => s.clearAll);

    useEffect(() => {
        setMounted(true);

        if (!hydrated) return;

        if (!encrypted) {
            // No wallet/password? Clear and force create (or redirect to landing)
            clearAllWallets();
            // In Common People, maybe redirect home is better than "create"? 
            // For now, let's keep consistent with Dashboard logic to allow unlocking/session recovery.
            // But if completely empty, maybe routing to onboarding is safer.
            // Let's stick to Dashboard pattern:
            setMode("create");
            setAskPassword(true);
        } else {
            if (!currentPassword) {
                setMode("unlock");
                setAskPassword(true);
            } else {
                setAskPassword(false);
            }
        }
    }, [encrypted, hydrated, currentPassword, clearAllWallets]);

    // Original Redirect Logic (Secondary Safety)
    useEffect(() => {
        if (hydrated && !encrypted) {
            // If actively no wallet, maybe redirect?
            // router.replace("/");
        }
    }, [hydrated, encrypted, router]);


    if (!mounted || !hydrated) {
        return (
            <Box sx={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#fff"
            }}>
                <CircularProgress sx={{ color: "#000" }} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <PasswordModal
                open={askPassword}
                mode={mode}
                onSuccess={() => setAskPassword(false)}
            />

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
