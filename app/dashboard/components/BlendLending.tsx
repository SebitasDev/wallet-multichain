import { useState, useEffect } from "react";
import { Box, Button, CircularProgress, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import Link from "next/link";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toast } from "react-toastify";
import { useBlend } from "../hooks/useBlend";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { PasswordModal } from "./PasswordModal";
import { BlendHeader } from "./blend/BlendHeader";
import { BlendStats } from "./blend/BlendStats";
import { BlendActionForm } from "./blend/BlendActionForm";
import { BlendYieldChart } from "./blend/BlendYieldChart";

export const BlendLending = () => {
    const { mainWallet } = useXOWalletStore();
    const { currentPassword } = useWalletPasswordStore();

    // Asset Selection State
    const [selectedAsset, setSelectedAsset] = useState<"USDC" | "USDGLO">("USDC");

    const { balance, invested, apy, loading, loadingTx, deposit, withdraw, timestamp, hasTrustline, enableAsset } = useBlend(selectedAsset);

    // UI State for password handling
    const [askPassword, setAskPassword] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ amount: number, type: "deposit" | "withdraw" | "enable" } | null>(null);

    // Auto-retry after password unlock
    useEffect(() => {
        if (pendingAction && currentPassword) {
            handleAction(pendingAction.amount, pendingAction.type)
                .then(() => setPendingAction(null));
        }
    }, [currentPassword, pendingAction]);

    const handleAction = async (amount: number, type: "deposit" | "withdraw" | "enable") => {
        if (!currentPassword) {
            setPendingAction({ amount, type });
            setAskPassword(true);
            return;
        }

        try {
            if (type === "enable") {
                await enableAsset();
                toast.success(`Trustline para ${selectedAsset} activada`);
            } else if (type === "deposit") {
                await deposit(amount);
                toast.success(`Depósito de ${amount} ${selectedAsset} exitoso`);
            } else {
                await withdraw(amount);
                toast.success(`Retiro de ${amount} ${selectedAsset} exitoso`);
            }
        } catch (error: any) {
            console.error("Action failed:", error);
            // Display friendly error message
            toast.error(error.message || "Ocurrió un error inesperado");
        }
    };

    const handleAssetChange = (
        event: React.MouseEvent<HTMLElement>,
        newAsset: "USDC" | "USDGLO" | null,
    ) => {
        if (newAsset !== null) {
            setSelectedAsset(newAsset);
        }
    };

    if (loading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="60vh"
                gap={3}
            >
                <Box
                    sx={{
                        p: 4,
                        border: "3px solid #000",
                        borderRadius: 4,
                        boxShadow: "6px 6px 0px #7B61FF",
                        bgcolor: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <CircularProgress
                        size={60}
                        thickness={5}
                        sx={{
                            color: "#7B61FF",
                        }}
                    />
                    <Typography
                        sx={{
                            fontWeight: 800,
                            fontSize: 18,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                        }}
                    >
                        Cargando Blend ({selectedAsset})...
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (!mainWallet.addressStellar) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="60vh"
                gap={3}
                p={3}
            >
                <Box
                    sx={{
                        p: 4,
                        border: "3px solid #000",
                        borderRadius: 4,
                        boxShadow: "6px 6px 0px #FFD93D",
                        bgcolor: "#FFD93D",
                        maxWidth: 500,
                        textAlign: "center",
                    }}
                >
                    <WarningAmberIcon sx={{ fontSize: 60, color: "#000", mb: 2 }} />
                    <Typography
                        sx={{
                            fontWeight: 900,
                            fontSize: { xs: 20, md: 24 },
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            color: "#000"
                        }}
                    >
                        Wallet no detectada
                    </Typography>
                    <Typography
                        sx={{
                            fontWeight: 600,
                            fontSize: 16,
                            color: "#333",
                            mb: 3,
                        }}
                    >
                        Necesitas configurar tu wallet de Stellar para usar Blend Lending.
                    </Typography>
                    <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            sx={{
                                px: 4,
                                py: 1.5,
                                border: "3px solid #000",
                                borderRadius: 3,
                                bgcolor: "#fff",
                                color: "#000",
                                fontWeight: 800,
                                fontSize: 16,
                                textTransform: "uppercase",
                                boxShadow: "4px 4px 0px #000",
                                "&:hover": {
                                    bgcolor: "#f5f5f5",
                                    boxShadow: "5px 5px 0px #000",
                                    transform: "translate(-1px, -1px)",
                                },
                            }}
                        >
                            Volver al Dashboard
                        </Button>
                    </Link>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 4 } }}>
            <Box display="flex" flexDirection={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" mb={4} gap={2}>
                <BlendHeader address={mainWallet.addressStellar} />

                {/* Asset Toggle */}
                <ToggleButtonGroup
                    value={selectedAsset}
                    exclusive
                    onChange={handleAssetChange}
                    aria-label="asset selection"
                    sx={{
                        bgcolor: "#fff",
                        border: "2px solid #000",
                        borderRadius: 2,
                        boxShadow: "4px 4px 0px #000",
                        "& .MuiToggleButton-root": {
                            border: 0,
                            borderRadius: 0,
                            px: 3,
                            py: 1,
                            fontWeight: 800,
                            color: "#666",
                            "&.Mui-selected": {
                                bgcolor: "#000",
                                color: "#fff",
                                "&:hover": {
                                    bgcolor: "#333",
                                }
                            },
                        }
                    }}
                >
                    <ToggleButton value="USDC" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img
                            src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
                            alt="USDC"
                            style={{ width: 20, height: 20, borderRadius: '50%' }}
                        />
                        USDC
                    </ToggleButton>
                    <ToggleButton value="USDGLO" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img
                            src="https://app.glodollar.org/glo-logo.png"
                            alt="USDGLO"
                            style={{ width: 20, height: 20, borderRadius: '50%' }}
                        />
                        USDGLO
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Main Grid - Stats + Action Form */}
            <Box
                display="grid"
                gridTemplateColumns={{ xs: "1fr", lg: "350px 1fr" }}
                gap={3}
            >
                {/* Stats Section - Sidebar on desktop */}
                <Box
                    sx={{
                        order: { xs: 2, lg: 1 },
                    }}
                >
                    <BlendStats
                        apy={apy}
                        invested={invested}
                        balance={balance}
                        timestamp={timestamp}
                    />
                </Box>

                {/* Action Form - Main area */}
                <Box
                    sx={{
                        order: { xs: 1, lg: 2 },
                    }}
                >
                    {!hasTrustline ? (
                        <Box
                            sx={{
                                p: 4,
                                border: "3px solid #000",
                                borderRadius: 4,
                                boxShadow: "6px 6px 0px #000",
                                bgcolor: "#fff",
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 2
                            }}
                        >
                            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                                Activar {selectedAsset}
                            </Typography>
                            <Typography sx={{ fontSize: 14, color: "#555", mb: 2 }}>
                                Para user {selectedAsset} en Stellar, primero necesitas habilitarlo (Trustline).
                            </Typography>
                            <Button
                                onClick={() => handleAction(0, "enable")}
                                disabled={loadingTx}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    border: "3px solid #000",
                                    borderRadius: 2,
                                    bgcolor: "#00DC8C",
                                    color: "#000",
                                    fontWeight: 800,
                                    boxShadow: "4px 4px 0px #000",
                                    "&:hover": {
                                        bgcolor: "#00c47d",
                                        boxShadow: "5px 5px 0px #000",
                                        transform: "translate(-1px, -1px)",
                                    },
                                    "&:disabled": {
                                        bgcolor: "#ccc",
                                        boxShadow: "none",
                                        border: "3px solid #666",
                                    }
                                }}
                            >
                                {loadingTx ? "Activando..." : `Activar ${selectedAsset}`}
                            </Button>
                        </Box>
                    ) : (
                        <BlendActionForm
                            balance={balance}
                            invested={invested}
                            loadingTx={loadingTx}
                            onAction={handleAction}
                        />
                    )}
                </Box>
            </Box>

            {/* Yield Projection Chart - Full Width */}
            <Box sx={{ mt: 3 }}>
                <BlendYieldChart invested={invested} apy={apy} />
            </Box>

            {/* Info Banner */}
            <Box
                sx={{
                    mt: 4,
                    p: 3,
                    border: "3px solid #000",
                    borderRadius: 4,
                    boxShadow: "4px 4px 0px #000",
                    bgcolor: "#f5f5f5",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        px: 2,
                        py: 1,
                        bgcolor: "#00DC8C",
                        border: "2px solid #000",
                        borderRadius: 2,
                        flexShrink: 0,
                    }}
                >
                    <Typography sx={{ fontWeight: 800, color: "#000", fontSize: 12, textTransform: "uppercase" }}>
                        Info
                    </Typography>
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#333" }}>
                    Blend Protocol te permite ganar rendimiento sobre tus {selectedAsset} en la red de Stellar. Los fondos están protegidos por smart contracts auditados.
                </Typography>
            </Box>

            <PasswordModal
                open={askPassword}
                mode="unlock"
                onSuccess={() => setAskPassword(false)}
            />
        </Box>
    );
};
