import { useState, useEffect } from "react";
import { Box, Button, CircularProgress, Alert } from "@mui/material";
import Link from "next/link";
import { useBlend } from "../hooks/useBlend";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { PasswordModal } from "./PasswordModal";
import { BlendHeader } from "./blend/BlendHeader";
import { BlendStats } from "./blend/BlendStats";
import { BlendActionForm } from "./blend/BlendActionForm";

export const BlendLending = () => {
    const { mainWallet } = useXOWalletStore();
    const { currentPassword } = useWalletPasswordStore();
    const { balance, invested, apy, loading, loadingTx, deposit, withdraw, timestamp } = useBlend();

    // UI State for password handling
    const [askPassword, setAskPassword] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ amount: number, type: "deposit" | "withdraw" } | null>(null);

    // Auto-retry after password unlock
    useEffect(() => {
        if (pendingAction && currentPassword) {
            handleAction(pendingAction.amount, pendingAction.type)
                .then(() => setPendingAction(null));
        }
    }, [currentPassword, pendingAction]);

    const handleAction = async (amount: number, type: "deposit" | "withdraw") => {
        if (!currentPassword) {
            setPendingAction({ amount, type });
            setAskPassword(true);
            return;
        }

        if (type === "deposit") {
            await deposit(amount);
        } else {
            await withdraw(amount);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress sx={{ color: "#00DC8C" }} />
            </Box>
        );
    }

    if (!mainWallet.addressStellar) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} p={4}>
                <Alert severity="warning">Wallet de Stellar no detectada o no configurada.</Alert>
                <Link href="/dashboard">
                    <Button variant="outlined">Volver al Dashboard</Button>
                </Link>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, mx: "auto", p: { xs: 2, md: 4 } }}>
            <BlendHeader address={mainWallet.addressStellar} />

            <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1.5fr" }} gap={3}>
                <BlendStats
                    apy={apy}
                    invested={invested}
                    balance={balance}
                    timestamp={timestamp}
                />
                <BlendActionForm
                    balance={balance}
                    invested={invested}
                    loadingTx={loadingTx}
                    onAction={handleAction}
                />
            </Box>

            <PasswordModal
                open={askPassword}
                mode="unlock"
                onSuccess={() => setAskPassword(false)}
            />
        </Box>
    );
};
