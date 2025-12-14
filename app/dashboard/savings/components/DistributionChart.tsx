"use client";

import { Box, Typography } from "@mui/material";
import { useSavingsStore } from "@/app/store/useSavingsStore";
import { getSavingsChainConfig, SavingsChainKey } from "@/app/savings/config";
import { NETWORKS } from "@/app/constants/chainsInformation";

export function DistributionChart() {
    const { positions, getAllPositionsWithEarnings, getSummary } = useSavingsStore();
    const positionsWithEarnings = getAllPositionsWithEarnings();
    const summary = getSummary();

    if (positions.length === 0) {
        return null;
    }

    // Calculate percentages
    const totalValue = positions.reduce(
        (sum, p) => sum + parseFloat(BigInt(p.currentValue).toString()) / 1e6,
        0
    );

    const chartData = positionsWithEarnings.map((position) => {
        const value = parseFloat(position.currentValue.replace(/[^0-9.]/g, ""));
        const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
        return {
            chain: position.chain,
            value,
            percentage,
            color: getSavingsChainConfig(position.chain).chipColor,
        };
    });

    const getChainIcon = (chain: SavingsChainKey) => {
        return NETWORKS[chain].icon;
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
                    Distribution by Chain
                </Typography>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        gap: 4,
                        alignItems: { xs: "stretch", md: "center" },
                    }}
                >
                    {/* Visual Bar Chart */}
                    <Box
                        sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        {chartData.map((item) => (
                            <Box key={item.chain}>
                                {/* Chain Label */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 0.5,
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 1,
                                                background: item.color,
                                                border: "2px solid #000000",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                "& svg": { width: 14, height: 14 },
                                            }}
                                        >
                                            {getChainIcon(item.chain)}
                                        </Box>
                                        <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
                                            {item.chain}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                                        ${item.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </Typography>
                                </Box>

                                {/* Progress Bar */}
                                <Box
                                    sx={{
                                        width: "100%",
                                        height: 24,
                                        background: "#f5f5f5",
                                        border: "2px solid #000000",
                                        borderRadius: 2,
                                        overflow: "hidden",
                                        position: "relative",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: `${item.percentage}%`,
                                            height: "100%",
                                            background: item.color,
                                            transition: "width 0.5s ease-out",
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            position: "absolute",
                                            right: 8,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            fontWeight: 900,
                                            fontSize: 11,
                                            color: "#000000",
                                        }}
                                    >
                                        {item.percentage.toFixed(1)}%
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* Pie Chart Visual (Simple CSS) */}
                    <Box
                        sx={{
                            display: { xs: "none", md: "flex" },
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <Box
                            sx={{
                                width: 150,
                                height: 150,
                                borderRadius: "50%",
                                border: "3px solid #000000",
                                boxShadow: "4px 4px 0px #000000",
                                background: generateConicGradient(chartData),
                                position: "relative",
                            }}
                        >
                            {/* Center Circle */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    width: 80,
                                    height: 80,
                                    borderRadius: "50%",
                                    background: "#ffffff",
                                    border: "3px solid #000000",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: "#666666",
                                    }}
                                >
                                    TOTAL
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        fontWeight: 900,
                                        color: "#000000",
                                    }}
                                >
                                    ${summary.totalValue}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Legend */}
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1,
                                justifyContent: "center",
                            }}
                        >
                            {chartData.map((item) => (
                                <Box
                                    key={item.chain}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        background: "#f5f5f5",
                                        border: "1px solid #000000",
                                        borderRadius: 1,
                                        px: 1,
                                        py: 0.25,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            background: item.color,
                                            border: "1px solid #000000",
                                        }}
                                    />
                                    <Typography sx={{ fontSize: 10, fontWeight: 700 }}>
                                        {item.chain}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

// Helper to generate conic gradient for pie chart
function generateConicGradient(
    data: { chain: string; percentage: number; color: string }[]
): string {
    if (data.length === 0) return "#f5f5f5";

    let currentAngle = 0;
    const segments: string[] = [];

    for (const item of data) {
        const startAngle = currentAngle;
        const endAngle = currentAngle + (item.percentage / 100) * 360;
        segments.push(`${item.color} ${startAngle}deg ${endAngle}deg`);
        currentAngle = endAngle;
    }

    return `conic-gradient(${segments.join(", ")})`;
}
