import { Box, Typography } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BarChartIcon from "@mui/icons-material/BarChart";
import React from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    AreaChart,
    Area
} from "recharts";
import { TokenLogo, CustomTooltip } from "./HistoryHelpers";

export const HistoryMetrics = ({ stats, weeklySendsData }: { stats: any, weeklySendsData: any[] }) => {
    return (
        <Box display="flex" flexDirection="column" gap={3}>
            {/* QUICK STATS CARD */}
            <Box
                sx={{
                    border: "3px solid #000",
                    borderRadius: 3,
                    bgcolor: "#fff",
                    boxShadow: "4px 4px 0px #000",
                    p: 3,
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                {/* BACKGROUND CHART */}
                <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100%", zIndex: 0, opacity: 0.2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklySendsData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00DC8C" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#00DC8C" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#00DC8C"
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                                strokeWidth={3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>

                <Box position="relative" zIndex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <AssessmentIcon sx={{ color: "#000" }} />
                        <Typography fontWeight={900} textTransform="uppercase">Métricas Clave</Typography>
                    </Box>

                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                        {/* SEND STATS */}
                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                            <Typography variant="caption" fontWeight={700} color="#666">TOTAL ENVÍOS</Typography>
                            <Typography variant="h5" fontWeight={900}>{stats.totalSends}</Typography>
                        </Box>
                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                            <Typography variant="caption" fontWeight={700} color="#666">TOTAL ENVIADO</Typography>
                            <Typography variant="h5" fontWeight={900} color="#FF2E2E">${stats.totalSentAmount.toLocaleString('en-US', { maximumFractionDigits: 6 })}</Typography>
                        </Box>

                        {/* RECEIVE STATS */}
                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                            <Typography variant="caption" fontWeight={700} color="#666">TOTAL RECIBIDOS</Typography>
                            <Typography variant="h5" fontWeight={900}>{stats.totalReceives}</Typography>
                        </Box>
                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                            <Typography variant="caption" fontWeight={700} color="#666">TOTAL RECIBIDO</Typography>
                            <Typography variant="h5" fontWeight={900} color="#008A57">${stats.totalReceivedAmount.toLocaleString('en-US', { maximumFractionDigits: 6 })}</Typography>
                        </Box>

                        {/* OTHER STATS */}
                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                            <Typography variant="caption" fontWeight={700} color="#666">TOP COIN</Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="h5" fontWeight={900}>{stats.mostUsedToken}</Typography>
                                {stats.mostUsedToken !== "N/A" && <TokenLogo token={stats.mostUsedToken} size={28} />}
                            </Box>
                        </Box>
                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                            <Typography variant="caption" fontWeight={700} color="#666">MAYOR ENVÍO</Typography>
                            <Typography variant="h5" fontWeight={900}>${stats.maxSent}</Typography>
                        </Box>
                        {/* Total Fees */}
                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000", gridColumn: "1 / -1" }}>
                            <Typography variant="caption" fontWeight={700} color="#666">TOTAL FEES PAGADOS</Typography>
                            <Typography variant="h5" fontWeight={900} color="#FF8C00">
                                ${stats.totalFeesPaid.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                            </Typography>
                        </Box>
                    </Box>
                </Box> {/* End relative content wrapper */}
            </Box>

            {/* Daily Spend Bar Chart */}
            <Box
                sx={{
                    border: "3px solid #000",
                    borderRadius: 3,
                    bgcolor: "#fff",
                    boxShadow: "4px 4px 0px #000",
                    p: 3,
                    height: 350
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <BarChartIcon />
                        <Typography fontWeight={900} textTransform="uppercase">Envíos por Día (Semana Actual)</Typography>
                    </Box>
                </Box>

                <Box sx={{ width: "100%", height: "85%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklySendsData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000" strokeOpacity={0.1} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fontWeight: 800, fill: '#000' }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis hide domain={[0, "dataMax"]} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f5', opacity: 0.5 }} />
                            <Bar
                                dataKey="value"
                                fill="#FFAB40"
                                stroke="#000"
                                strokeWidth={2}
                                radius={[6, 6, 0, 0]}
                                maxBarSize={50}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Box>
        </Box>
    );
};
