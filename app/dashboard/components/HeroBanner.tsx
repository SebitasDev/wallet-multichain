"use client";

import { useState } from "react";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";
import { useMainWalletStore } from "@/app/store/useMainWalletStore";
import { toast } from "react-toastify";

export function HeroBanner() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { wallets, getAllWalletsTotalBalance, updateWalletBalances } = useWalletStore();

    const handleRefreshBalances = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        toast.info("Actualizando balances...");

        try {
            await updateWalletBalances();
            toast.success("Balances actualizados");
        } catch (error) {
            console.error("Error al actualizar balances:", error);
            toast.error("Error al actualizar balances");
        } finally {
            setIsRefreshing(false);
        }
    };

    // XO (embedded)
    const { address: xoAddress } = useXOContracts();

    // Local fallback main wallet
    const { mainWallet, xoClient} = useMainWalletStore();

    // Main wallet (XO si existe → sino local)
    const mainAddress = xoAddress ?? mainWallet.address ?? null;

    // Balance quemado exclusivo para Main
    const burnedMainBalance = 0;

    return (
        <Box
            sx={{
                maxWidth: 600,
                width: "100%",
                mx: "auto",
                position: "relative",
                overflow: "hidden",
                background: "#ffffff",
                color: "#000000",
                textAlign: "center",
                py: { xs: 3, md: 3.5 },
                px: { xs: 2.5, md: 3 },
                borderRadius: 4,
                border: "3px solid #000000",
                boxShadow: "6px 6px 0px #000000",
            }}
        >
            {/* MAIN WALLET SECTION */}
            <Box
                sx={{
                    background: "#f5f5f5",
                    border: "2px solid #000000",
                    borderRadius: 3,
                    p: { xs: 2, md: 2.5 },
                    mb: 2,
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontSize: { xs: 10, md: 11 },
                        fontWeight: 700,
                        color: "#666666",
                        mb: 1,
                    }}
                >
                    Main Wallet {xoClient ? ` de ${xoClient.alias}` : ""}
                </Typography>

                <Typography
                    sx={{
                        fontSize: { xs: 32, sm: 38, md: 44 },
                        fontWeight: 900,
                        lineHeight: 1,
                        color: "#000000",
                        mb: 1.5,
                    }}
                >
                    {formatCurrency(burnedMainBalance)}
                </Typography>

                <Box
                    sx={{
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        py: 0.75,
                        px: 1.5,
                        display: "inline-block",
                        maxWidth: "100%",
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: { xs: 10, md: 11 },
                            fontWeight: 600,
                            color: "#000000",
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                        }}
                    >
                        {mainAddress ?? "--"}
                    </Typography>
                </Box>
            </Box>

            {/* BALANCE TOTAL SECTION */}
            <Box
                sx={{
                    background: "#f5f5f5",
                    border: "2px solid #000000",
                    borderRadius: 3,
                    p: { xs: 2, md: 2.5 },
                    position: "relative",
                }}
            >
                {/* Botón de refrescar */}
                <IconButton
                    onClick={handleRefreshBalances}
                    disabled={isRefreshing || wallets.length === 0}
                    sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 36,
                        height: 36,
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        transition: "all 0.2s",
                        "&:hover": {
                            background: "#3CD2FF",
                            transform: "scale(1.05)",
                        },
                        "&:disabled": {
                            background: "#e0e0e0",
                            border: "2px solid #999999",
                        },
                    }}
                >
                    {isRefreshing ? (
                        <CircularProgress size={18} sx={{ color: "#000000" }} />
                    ) : (
                        <RefreshIcon sx={{ fontSize: 20, color: "#000000" }} />
                    )}
                </IconButton>

                <Typography
                    variant="body2"
                    sx={{
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontSize: { xs: 10, md: 11 },
                        fontWeight: 700,
                        color: "#666666",
                        mb: 1,
                    }}
                >
                    Balance Total (Hijas)
                </Typography>

                <Typography
                    sx={{
                        fontSize: { xs: 26, sm: 32, md: 36 },
                        fontWeight: 900,
                        lineHeight: 1,
                        color: "#000000",
                        mb: 1.5,
                    }}
                >
                    {getAllWalletsTotalBalance !== null ? formatCurrency(getAllWalletsTotalBalance()) : "--"}
                </Typography>

                <Box
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        background: "#000000",
                        color: "#ffffff",
                        borderRadius: "999px",
                        py: 0.6,
                        px: 1.75,
                    }}
                >
                    <Box
                        sx={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: wallets.length > 0 ? "#00DC8C" : "#ff4444",
                            boxShadow: wallets.length > 0
                                ? "0 0 8px rgba(0, 220, 140, 0.6)"
                                : "0 0 8px rgba(255, 68, 68, 0.6)",
                            animation: "pulse 2.5s ease-in-out infinite",
                            "@keyframes pulse": {
                                "0%, 100%": {
                                    opacity: 1,
                                    boxShadow: wallets.length > 0
                                        ? "0 0 8px rgba(0, 220, 140, 0.6)"
                                        : "0 0 8px rgba(255, 68, 68, 0.6)",
                                },
                                "50%": {
                                    opacity: 0.85,
                                    boxShadow: wallets.length > 0
                                        ? "0 0 12px rgba(0, 220, 140, 0.8)"
                                        : "0 0 12px rgba(255, 68, 68, 0.8)",
                                },
                            },
                        }}
                    />
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: { xs: 11, md: 12 },
                            fontWeight: 700,
                        }}
                    >
                        {wallets.length} wallets conectadas
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}