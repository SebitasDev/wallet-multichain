"use client";

import { formatCurrency } from "@/app/utils/formatCurrency";
import { Box, Typography, Stack, Chip, LinearProgress } from "@mui/material";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";
import { useMainWalletStore } from "@/app/store/useMainWalletStore";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useMemo } from "react";

type Props = {
    background?: string;
};

// Chain colors for the distribution bar
const chainColors: Record<string, string> = {
    base: "#0052ff",
    optimism: "#ff0420",
    arbitrum: "#28a0f0",
    polygon: "#8247e5",
    avalanche: "#e84142",
    unichain: "#ff007a",
};

export function HeroBanner({ background }: Props) {
    const { wallets, getAllWalletsTotalBalance } = useWalletStore();
    const { address: xoAddress } = useXOContracts();
    const { mainWallet, xoClient } = useMainWalletStore();

    const mainAddress = xoAddress ?? mainWallet.address ?? null;
    const totalBalance = getAllWalletsTotalBalance?.() ?? 0;
    const walletCount = wallets.length;

    // Calculate chain distribution (mock data - in real app, aggregate from wallet balances)
    const chainDistribution = useMemo(() => {
        // This would be calculated from actual wallet data
        // For now, showing equal distribution across chains
        const chains = ["base", "optimism", "arbitrum", "polygon", "avalanche", "unichain"];
        const total = chains.length;
        return chains.map((chain, idx) => ({
            name: chain,
            percentage: Math.round(100 / total),
            color: chainColors[chain] || "#64748b",
        }));
    }, []);

    const truncateAddress = (addr: string | null) => {
        if (!addr) return "No wallet connected";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <Box
            sx={{
                position: "relative",
                overflow: "hidden",
                background: "linear-gradient(135deg, #0f1729 0%, #151d2e 50%, #0f1729 100%)",
                borderRadius: { xs: "16px", md: "24px" },
                mx: { xs: 2, md: 4 },
                mt: { xs: 2, md: 3 },
                border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
        >
            {/* Decorative gradient orbs */}
            <Box
                sx={{
                    position: "absolute",
                    top: "-50%",
                    left: "-20%",
                    width: "60%",
                    height: "200%",
                    background: "radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 60%)",
                    pointerEvents: "none",
                }}
            />
            <Box
                sx={{
                    position: "absolute",
                    bottom: "-50%",
                    right: "-20%",
                    width: "60%",
                    height: "200%",
                    background: "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 60%)",
                    pointerEvents: "none",
                }}
            />

            <Box
                sx={{
                    position: "relative",
                    px: { xs: 2.5, md: 4 },
                    py: { xs: 3, md: 4 },
                }}
            >
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    spacing={{ xs: 3, md: 0 }}
                >
                    {/* Left: Portfolio Value */}
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Typography
                                sx={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                Portfolio Value
                            </Typography>
                            <Chip
                                size="small"
                                icon={<TrendingUpIcon sx={{ fontSize: 14, color: "#10b981 !important" }} />}
                                label="+2.4%"
                                sx={{
                                    height: "22px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    background: "rgba(16, 185, 129, 0.15)",
                                    color: "#10b981",
                                    border: "1px solid rgba(16, 185, 129, 0.2)",
                                    "& .MuiChip-icon": { ml: 0.5 },
                                }}
                            />
                        </Stack>

                        <Typography
                            sx={{
                                fontSize: { xs: "36px", sm: "44px", md: "52px" },
                                fontWeight: 800,
                                color: "#f1f5f9",
                                letterSpacing: "-0.02em",
                                lineHeight: 1,
                            }}
                        >
                            {formatCurrency(totalBalance)}
                        </Typography>

                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1.5 }}>
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                                <AccountBalanceWalletIcon sx={{ fontSize: 16, color: "#64748b" }} />
                                <Typography sx={{ fontSize: "14px", color: "#94a3b8" }}>
                                    {walletCount} {walletCount === 1 ? "wallet" : "wallets"} connected
                                </Typography>
                            </Stack>

                            {mainAddress && (
                                <>
                                    <Box sx={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)" }} />
                                    <Typography
                                        component="code"
                                        sx={{
                                            fontSize: "13px",
                                            color: "#64748b",
                                            fontFamily: "var(--font-mono), monospace",
                                        }}
                                    >
                                        {truncateAddress(mainAddress)}
                                    </Typography>
                                </>
                            )}
                        </Stack>
                    </Box>

                    {/* Right: Chain Distribution */}
                    <Box
                        sx={{
                            width: { xs: "100%", md: "320px" },
                            background: "rgba(0, 0, 0, 0.2)",
                            borderRadius: "16px",
                            p: 2.5,
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#64748b",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                mb: 1.5,
                            }}
                        >
                            Chain Distribution
                        </Typography>

                        {/* Distribution Bar */}
                        <Box
                            sx={{
                                display: "flex",
                                height: "8px",
                                borderRadius: "4px",
                                overflow: "hidden",
                                mb: 2,
                            }}
                        >
                            {chainDistribution.map((chain, idx) => (
                                <Box
                                    key={chain.name}
                                    sx={{
                                        width: `${chain.percentage}%`,
                                        background: chain.color,
                                        transition: "width 0.3s ease",
                                    }}
                                />
                            ))}
                        </Box>

                        {/* Chain Legend */}
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {chainDistribution.slice(0, 4).map((chain) => (
                                <Stack key={chain.name} direction="row" alignItems="center" spacing={0.75}>
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "2px",
                                            background: chain.color,
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: "12px",
                                            color: "#94a3b8",
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {chain.name}
                                    </Typography>
                                </Stack>
                            ))}
                            {chainDistribution.length > 4 && (
                                <Typography sx={{ fontSize: "12px", color: "#64748b" }}>
                                    +{chainDistribution.length - 4} more
                                </Typography>
                            )}
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
}
