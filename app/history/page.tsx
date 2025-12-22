"use client";

import { Box, Typography, IconButton, Card, CardActionArea, Chip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CallMadeIcon from "@mui/icons-material/CallMade";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import BarChartIcon from "@mui/icons-material/BarChart";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useRouter } from "next/navigation";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip
} from "recharts";

import { MOCK_TRANSACTIONS } from "../lib/mockData";

// Mock Chart Data - Money Sent Per Day
const DAILY_SPEND_DATA = [
    { name: 'Lun', value: 120 },
    { name: 'Mar', value: 45 },
    { name: 'Mie', value: 200 },
    { name: 'Jue', value: 80 },
    { name: 'Vie', value: 150 },
    { name: 'Sab', value: 300 },
    { name: 'Dom', value: 90 },
];

export default function HistoryListPage() {
    const router = useRouter();

    // Derived Metrics from MOCK_TRANSACTIONS
    const totalSends = MOCK_TRANSACTIONS.filter(tx => tx.type === "SEND").length;
    const totalFees = MOCK_TRANSACTIONS.reduce((acc, tx) => acc + (tx.fee || 0), 0);
    const maxSent = Math.max(...MOCK_TRANSACTIONS.filter(tx => tx.type === "SEND").map(tx => tx.amount), 0);

    // Most Used Token (Mode)
    const tokenCounts = MOCK_TRANSACTIONS.reduce((acc: any, tx) => {
        acc[tx.token] = (acc[tx.token] || 0) + 1;
        return acc;
    }, {});
    const mostUsedToken = Object.keys(tokenCounts).reduce((a, b) => tokenCounts[a] > tokenCounts[b] ? a : b, "N/A");


    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#f0f0f0", p: { xs: 2, md: 4 } }}>
            {/* Header */}
            <Box sx={{ maxWidth: "1400px", mx: "auto", mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton
                    onClick={() => router.push("/dashboard")}
                    sx={{
                        border: "3px solid #000",
                        bgcolor: "#fff",
                        borderRadius: 2,
                        boxShadow: "4px 4px 0px #000",
                        "&:hover": { bgcolor: "#f5f5f5", transform: "translate(2px, 2px)", boxShadow: "2px 2px 0px #000" }
                    }}
                >
                    <ArrowBackIcon sx={{ color: "#000", fontWeight: "bold" }} />
                </IconButton>
                <Typography variant="h4" fontWeight={900} sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                    Historial
                </Typography>
            </Box>

            <Box sx={{ maxWidth: "1400px", mx: "auto" }}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 4 }}>
                    {/* LEFT COLUMN: Transactions (Flex 2) */}
                    <Box sx={{ flex: { xs: "1 1 auto", lg: 2 }, minWidth: 0 }}>
                        <Box display="flex" flexDirection="column" gap={2}>
                            {MOCK_TRANSACTIONS.map((tx) => (
                                <Card
                                    key={tx.id}
                                    sx={{
                                        border: "3px solid #000",
                                        borderRadius: 3,
                                        boxShadow: "4px 4px 0px #000",
                                        overflow: "visible", // For hover effect
                                        transition: "transform 0.1s",
                                        "&:hover": {
                                            transform: "translate(-2px, -2px)",
                                            boxShadow: "6px 6px 0px #000"
                                        }
                                    }}
                                >
                                    <CardActionArea
                                        onClick={() => router.push(`/history/${tx.id}`)}
                                        sx={{ p: 2 }}
                                    >
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            {/* Left: Icon + Info */}
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Box
                                                    sx={{
                                                        width: 50, height: 50,
                                                        borderRadius: 2,
                                                        border: "2px solid #000",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        bgcolor: tx.type === "SEND" ? "#FF90E8" : tx.type === "RECEIVE" ? "#00DC8C" : "#FFD700"
                                                    }}
                                                >
                                                    {tx.type === "SEND" && <CallMadeIcon sx={{ color: "#000" }} />}
                                                    {tx.type === "RECEIVE" && <CallReceivedIcon sx={{ color: "#000" }} />}
                                                    {tx.type === "SAVINGS" && <Typography fontSize={20}>🏦</Typography>}
                                                </Box>
                                                <Box>
                                                    <Typography fontWeight={800} fontSize={18}>
                                                        {tx.type === "SEND" ? "Envío" : tx.type === "RECEIVE" ? "Recibido" : "Yield Deposit"}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={600} color="#666">
                                                        {tx.date} • {tx.type === "SEND" ? tx.to : tx.from || tx.to}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Right: Amount + Status */}
                                            <Box textAlign="right">
                                                <Typography fontWeight={900} fontSize={18} color={tx.type === "SEND" ? "#000" : "#008a57"}>
                                                    {tx.type === "SEND" ? "-" : "+"}${tx.amount} {tx.token}
                                                </Typography>
                                                <Chip
                                                    label={tx.status}
                                                    size="small"
                                                    sx={{
                                                        height: 24,
                                                        fontSize: 10,
                                                        fontWeight: 900,
                                                        border: "1.5px solid #000",
                                                        bgcolor: tx.status === "SUCCESS" ? "#fff" : tx.status === "FAILED" ? "#FF2E2E" : "#FFF59D",
                                                        color: tx.status === "FAILED" ? "#fff" : "#000"
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </CardActionArea>
                                </Card>
                            ))}
                        </Box>
                    </Box>

                    {/* RIGHT COLUMN: Metrics (Flex 1) */}
                    <Box sx={{ flex: { xs: "1 1 auto", lg: 1 }, minWidth: { lg: 400 } }}>
                        <Box display="flex" flexDirection="column" gap={3}>

                            {/* QUICK STATS CARD */}
                            <Box
                                sx={{
                                    border: "3px solid #000",
                                    borderRadius: 3,
                                    bgcolor: "#fff", // White instead of Yellow
                                    boxShadow: "4px 4px 0px #000",
                                    p: 3
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <AssessmentIcon sx={{ color: "#000" }} />
                                    <Typography fontWeight={900} textTransform="uppercase">Métricas Clave</Typography>
                                </Box>

                                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                                    {/* Stat 1 */}
                                    <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                        <Typography variant="caption" fontWeight={700} color="#666">TOTAL ENVÍOS</Typography>
                                        <Typography variant="h5" fontWeight={900}>{totalSends}</Typography>
                                    </Box>
                                    {/* Stat 2 */}
                                    <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                        <Typography variant="caption" fontWeight={700} color="#666">FEE PAGADO</Typography>
                                        <Typography variant="h5" fontWeight={900}>${totalFees.toFixed(2)}</Typography>
                                    </Box>
                                    {/* Stat 3 */}
                                    <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                        <Typography variant="caption" fontWeight={700} color="#666">TOP COIN</Typography>
                                        <Typography variant="h5" fontWeight={900}>{mostUsedToken}</Typography>
                                    </Box>
                                    {/* Stat 4 */}
                                    <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                        <Typography variant="caption" fontWeight={700} color="#666">MAYOR ENVÍO</Typography>
                                        <Typography variant="h5" fontWeight={900}>${maxSent}</Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Daily Spend Bar Chart */}
                            <Box
                                sx={{
                                    border: "3px solid #000",
                                    borderRadius: 3,
                                    bgcolor: "#fff",
                                    boxShadow: "4px 4px 0px #000",
                                    p: 3,
                                    height: 300
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <BarChartIcon />
                                    <Typography fontWeight={900} textTransform="uppercase">Envíos por Día</Typography>
                                </Box>

                                <Box sx={{ width: "100%", height: "85%" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={DAILY_SPEND_DATA}>
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 12, fontWeight: 700 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis hide />
                                            <Tooltip
                                                cursor={{ fill: '#f0f0f0' }}
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '2px solid #000',
                                                    borderRadius: '8px',
                                                    boxShadow: '4px 4px 0px #000',
                                                    fontWeight: 900
                                                }}
                                            />
                                            <Bar
                                                dataKey="value"
                                                fill="#FF90E8"
                                                stroke="#000"
                                                strokeWidth={2}
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>

                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
