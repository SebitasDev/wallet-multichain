"use client";

import { Box, Typography, Skeleton } from "@mui/material";
import { useSavingsStore } from "@/app/store/useSavingsStore";
import SavingsIcon from "@mui/icons-material/Savings";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PercentIcon from "@mui/icons-material/Percent";

export function SavingsSummaryCard() {
    const { loading, getSummary } = useSavingsStore();
    const summary = getSummary();

    const StatBox = ({
        label,
        value,
        icon,
        color = "#000000",
        isPositive = false,
    }: {
        label: string;
        value: string;
        icon: React.ReactNode;
        color?: string;
        isPositive?: boolean;
    }) => (
        <Box
            sx={{
                flex: 1,
                minWidth: { xs: "45%", sm: "auto" },
                background: "#f5f5f5",
                border: "2px solid #000000",
                borderRadius: 3,
                p: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
            }}
        >
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: color,
                    border: "2px solid #000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                }}
            >
                {icon}
            </Box>
            <Typography
                sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#666666",
                    letterSpacing: 0.5,
                }}
            >
                {label}
            </Typography>
            {loading ? (
                <Skeleton width={80} height={28} />
            ) : (
                <Typography
                    sx={{
                        fontSize: { xs: 16, md: 20 },
                        fontWeight: 900,
                        color: isPositive ? "#00DC8C" : "#000000",
                    }}
                >
                    {isPositive && parseFloat(value.replace(/[^0-9.-]/g, "")) > 0 ? "+" : ""}
                    ${value}
                </Typography>
            )}
        </Box>
    );

    return (
        <Box
            sx={{
                background: "#ffffff",
                border: "3px solid #000000",
                borderRadius: 4,
                boxShadow: "6px 6px 0px #000000",
                p: { xs: 2, md: 3 },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        background: "#7852FF",
                        border: "2px solid #000000",
                        boxShadow: "3px 3px 0px #000000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <SavingsIcon sx={{ color: "#ffffff", fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography
                        sx={{
                            fontSize: { xs: 18, md: 22 },
                            fontWeight: 900,
                            color: "#000000",
                        }}
                    >
                        Your Savings Overview
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: 12,
                            color: "#666666",
                        }}
                    >
                        {summary.positionCount} active position{summary.positionCount !== 1 ? "s" : ""} across chains
                    </Typography>
                </Box>
            </Box>

            {/* Stats Grid */}
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                <StatBox
                    label="Total Deposited"
                    value={summary.totalDeposited}
                    icon={<AccountBalanceIcon sx={{ fontSize: 22 }} />}
                    color="#3CD2FF"
                />
                <StatBox
                    label="Current Value"
                    value={summary.totalValue}
                    icon={<SavingsIcon sx={{ fontSize: 22 }} />}
                    color="#7852FF"
                />
                <StatBox
                    label="Total Earned"
                    value={summary.totalEarned}
                    icon={<TrendingUpIcon sx={{ fontSize: 22 }} />}
                    color="#00DC8C"
                    isPositive
                />
                <StatBox
                    label="Avg APY"
                    value={`${summary.averageApy}%`}
                    icon={<PercentIcon sx={{ fontSize: 22 }} />}
                    color="#FFD700"
                />
            </Box>

            {/* USDC Label */}
            <Box
                sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <Box
                    sx={{
                        background: "#000000",
                        color: "#ffffff",
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: 1,
                    }}
                >
                    ALL VALUES IN USDC
                </Box>
            </Box>
        </Box>
    );
}
