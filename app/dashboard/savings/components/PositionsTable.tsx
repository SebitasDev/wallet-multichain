"use client";

import { useState } from "react";
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    IconButton,
    Tooltip,
} from "@mui/material";
import { toast } from "react-toastify";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useSavingsStore, fetchSavingsPositions } from "@/app/store/useSavingsStore";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import {
    SavingsChainKey,
    getSavingsChainConfig,
    parseUsdcAmount,
    formatUsdcDisplay,
} from "@/app/savings/config";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { SavingsPosition } from "@/app/savings/types";

interface PositionsTableProps {
    onOpenConfirmModal: (
        type: "deposit" | "withdraw",
        chain: SavingsChainKey,
        amount: string,
        callback: () => Promise<void>
    ) => void;
}

export function PositionsTable({ onOpenConfirmModal }: PositionsTableProps) {
    const [withdrawingChain, setWithdrawingChain] = useState<SavingsChainKey | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { loading, getAllPositionsWithEarnings, addWithdrawEntry } = useSavingsStore();
    const { wallets, unlockWallet } = useWalletStore();
    const { currentPassword } = useWalletPasswordStore();
    const mainWallet = wallets.length > 0 ? wallets[0] : null;

    const positions = getAllPositionsWithEarnings();

    const handleRefresh = async () => {
        if (!mainWallet) return;

        setIsRefreshing(true);
        await fetchSavingsPositions(mainWallet.address);
        setIsRefreshing(false);
    };

    const handleWithdraw = (position: SavingsPosition) => {
        if (!mainWallet) {
            toast.error("No wallet connected");
            return;
        }

        if (!currentPassword) {
            toast.error("Password required to sign transaction");
            return;
        }

        // For simplicity, withdraw full position
        const amountRaw = position.currentValue.replace(/[^0-9.]/g, "");

        onOpenConfirmModal("withdraw", position.chain, amountRaw, async () => {
            setWithdrawingChain(position.chain);

            try {
                const amountBigInt = parseUsdcAmount(amountRaw);

                // Unlock wallet to get private key
                const privateKey = await unlockWallet(mainWallet.address, currentPassword);

                const response = await fetch("/api/savings/withdraw", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chain: position.chain,
                        amount: amountBigInt.toString(),
                        walletAddress: mainWallet.address,
                        privateKey,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    toast.success(`Withdrew ${formatUsdcDisplay(amountBigInt)} from ${position.chain}`);

                    // Add withdraw entry to history
                    addWithdrawEntry({
                        chain: position.chain,
                        amount: amountBigInt.toString(),
                        txHash: data.transactionHash,
                    });

                    // Refresh positions
                    await fetchSavingsPositions(mainWallet.address);
                } else {
                    toast.error(data.errorReason || "Withdrawal failed");
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Withdrawal failed");
            } finally {
                setWithdrawingChain(null);
            }
        });
    };

    const getChainIcon = (chain: SavingsChainKey) => {
        return NETWORKS[chain].icon;
    };

    const getChainColor = (chain: SavingsChainKey) => {
        return getSavingsChainConfig(chain).chipColor;
    };

    return (
        <Box
            sx={{
                background: "#ffffff",
                border: "3px solid #000000",
                borderRadius: 4,
                boxShadow: "6px 6px 0px #000000",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    background: "#000000",
                    color: "#ffffff",
                    px: 3,
                    py: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Typography
                    sx={{
                        fontSize: 18,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                    }}
                >
                    Active Positions
                </Typography>
                <Tooltip title="Refresh positions">
                    <IconButton
                        onClick={handleRefresh}
                        disabled={isRefreshing || loading}
                        sx={{
                            color: "#ffffff",
                            "&:hover": {
                                background: "rgba(255,255,255,0.1)",
                            },
                        }}
                    >
                        {isRefreshing || loading ? (
                            <CircularProgress size={20} sx={{ color: "#ffffff" }} />
                        ) : (
                            <RefreshIcon />
                        )}
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Content */}
            <Box sx={{ p: 2 }}>
                {loading && positions.length === 0 ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            py: 6,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : positions.length === 0 ? (
                    <Box
                        sx={{
                            textAlign: "center",
                            py: 6,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: "#666666",
                                mb: 1,
                            }}
                        >
                            No USDC positions yet
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: 13,
                                color: "#999999",
                            }}
                        >
                            Deposit USDC to start earning yield
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {/* Table Header */}
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr 1fr 80px", md: "1fr 1fr 1fr 1fr 100px" },
                                gap: 2,
                                px: 2,
                                py: 1,
                                borderBottom: "2px solid #000000",
                            }}
                        >
                            <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#666666" }}>
                                CHAIN
                            </Typography>
                            <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#666666" }}>
                                VALUE
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: "#666666",
                                    display: { xs: "none", md: "block" },
                                }}
                            >
                                EARNED
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: "#666666",
                                    display: { xs: "none", md: "block" },
                                }}
                            >
                                APY
                            </Typography>
                            <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#666666" }}>
                                ACTION
                            </Typography>
                        </Box>

                        {/* Rows */}
                        {positions.map((position) => (
                            <Box
                                key={position.chain}
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr 1fr 80px", md: "1fr 1fr 1fr 1fr 100px" },
                                    gap: 2,
                                    background: "#ffffff",
                                    border: "2px solid #000000",
                                    borderRadius: 3,
                                    px: 2,
                                    py: 1.5,
                                    alignItems: "center",
                                    transition: "all 0.2s",
                                    "&:hover": {
                                        transform: "translateX(4px)",
                                        background: "#f5f5f5",
                                    },
                                }}
                            >
                                {/* Chain */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 1.5,
                                            background: getChainColor(position.chain),
                                            border: "2px solid #000000",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            "& svg": { width: 16, height: 16 },
                                        }}
                                    >
                                        {getChainIcon(position.chain)}
                                    </Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
                                        {position.chain}
                                    </Typography>
                                </Box>

                                {/* Value */}
                                <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                                    ${position.currentValue}
                                </Typography>

                                {/* Earned */}
                                <Typography
                                    sx={{
                                        fontWeight: 900,
                                        fontSize: 14,
                                        color:
                                            parseFloat(position.earned.replace(/[^0-9.-]/g, "")) > 0
                                                ? "#00DC8C"
                                                : "#000000",
                                        display: { xs: "none", md: "block" },
                                    }}
                                >
                                    {parseFloat(position.earned.replace(/[^0-9.-]/g, "")) > 0 ? "+" : ""}
                                    ${position.earned}
                                </Typography>

                                {/* APY */}
                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: 13,
                                        color: "#00DC8C",
                                        display: { xs: "none", md: "block" },
                                    }}
                                >
                                    {position.apy}%
                                </Typography>

                                {/* Action */}
                                <Button
                                    onClick={() => handleWithdraw(position)}
                                    disabled={withdrawingChain === position.chain}
                                    sx={{
                                        background: "#ff4444",
                                        color: "#ffffff",
                                        border: "2px solid #000000",
                                        borderRadius: 2,
                                        py: 0.5,
                                        px: 1.5,
                                        fontWeight: 800,
                                        fontSize: 11,
                                        textTransform: "uppercase",
                                        minWidth: "auto",
                                        "&:hover": {
                                            background: "#ff3333",
                                            transform: "scale(1.05)",
                                        },
                                        "&:disabled": {
                                            background: "#cccccc",
                                            color: "#666666",
                                        },
                                    }}
                                >
                                    {withdrawingChain === position.chain ? (
                                        <CircularProgress size={14} sx={{ color: "#ffffff" }} />
                                    ) : (
                                        "Withdraw"
                                    )}
                                </Button>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
