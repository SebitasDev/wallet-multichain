"use client";

import { Box, Typography } from "@mui/material";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import ShowChartIcon from '@mui/icons-material/ShowChart';

interface BlendYieldChartProps {
    invested: number;
    apy: number;
}

interface ChartDataPoint {
    name: string;
    value: number;
    earnings: number;
}

const calculateCompoundInterest = (principal: number, apy: number, months: number): number => {
    const rate = apy / 100;
    const years = months / 12;
    return principal * Math.pow(1 + rate, years);
};

export const BlendYieldChart = ({ invested, apy }: BlendYieldChartProps) => {
    const chartData: ChartDataPoint[] = [
        { name: "Ahora", value: invested, earnings: 0 },
        { name: "1M", value: calculateCompoundInterest(invested, apy, 1), earnings: calculateCompoundInterest(invested, apy, 1) - invested },
        { name: "3M", value: calculateCompoundInterest(invested, apy, 3), earnings: calculateCompoundInterest(invested, apy, 3) - invested },
        { name: "6M", value: calculateCompoundInterest(invested, apy, 6), earnings: calculateCompoundInterest(invested, apy, 6) - invested },
        { name: "1A", value: calculateCompoundInterest(invested, apy, 12), earnings: calculateCompoundInterest(invested, apy, 12) - invested },
    ];

    const yearlyEarnings = chartData[4].earnings;

    if (invested <= 0) {
        return (
            <Box
                sx={{
                    p: 3,
                    border: "3px solid #000",
                    borderRadius: 4,
                    boxShadow: "5px 5px 0px #000",
                    bgcolor: "#fff",
                    textAlign: "center",
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: "#7B61FF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <ShowChartIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                    <Typography
                        sx={{
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            color: "#666",
                        }}
                    >
                        Proyecciones
                    </Typography>
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#999" }}>
                    Deposita USDC para ver tus proyecciones de ganancias
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                p: 3,
                border: "3px solid #000",
                borderRadius: 4,
                boxShadow: "5px 5px 0px #000",
                bgcolor: "#fff",
            }}
        >
            <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "#7B61FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <ShowChartIcon sx={{ color: "#fff", fontSize: 20 }} />
                </Box>
                <Typography
                    sx={{
                        fontSize: 12,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        color: "#666",
                    }}
                >
                    Proyecciones
                </Typography>
            </Box>

            {/* Yearly earnings highlight */}
            <Box
                sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: "#E8F5E9",
                    border: "2px solid #000",
                    borderRadius: 2,
                }}
            >
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase" }}>
                    Ganancia estimada (1 Año)
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 900, color: "#00DC8C" }}>
                    +${yearlyEarnings.toFixed(2)} USDC
                </Typography>
            </Box>

            {/* Chart */}
            <Box sx={{ width: "100%", height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7B61FF" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#7B61FF" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 700, fill: "#666" }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 600, fill: "#999" }}
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#000",
                                border: "none",
                                borderRadius: 8,
                                padding: "10px 14px",
                            }}
                            labelStyle={{ color: "#fff", fontWeight: 700, marginBottom: 4 }}
                            formatter={(value, name) => {
                                const numValue = Number(value) || 0;
                                if (name === "value") {
                                    return [`$${numValue.toFixed(2)} USDC`, "Total"];
                                }
                                return [`+$${numValue.toFixed(2)}`, "Ganancia"];
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#7B61FF"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            dot={{ fill: "#7B61FF", strokeWidth: 2, stroke: "#fff", r: 4 }}
                            activeDot={{ r: 6, stroke: "#000", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Box>

            {/* Legend */}
            <Box display="flex" justifyContent="center" gap={2} mt={2}>
                <Box display="flex" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#7B61FF" }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#666" }}>
                        Proyección con {apy}% APY
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};
