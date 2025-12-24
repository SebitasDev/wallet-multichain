"use client";

import { Box, Typography, IconButton, Card, CardActionArea, Chip, Avatar } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CallMadeIcon from "@mui/icons-material/CallMade";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import BarChartIcon from "@mui/icons-material/BarChart";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip
} from "recharts";

import { MOCK_TRANSACTIONS } from "../lib/mockData";

// Import Atom Icons locally for the Detail view
import { BaseIcon } from "../components/atoms/BaseIcon";
import { OPIcon } from "../components/atoms/OPIcon";
import { EthIcon } from "../components/atoms/EthIcon";
import ArbIcon from "../components/atoms/ArbIcon";
import PolygonIcon from "../components/atoms/PolygonIcon";
import { AvalancheIcon } from "../components/atoms/AvalancheIcon";

// ----------------------------------------------------------------------
// DATA & CONFIG
// ----------------------------------------------------------------------

const DAILY_SPEND_DATA = [
    { name: 'Lun', value: 120 },
    { name: 'Mar', value: 45 },
    { name: 'Mie', value: 200 },
    { name: 'Jue', value: 80 },
    { name: 'Vie', value: 150 },
    { name: 'Sab', value: 300 },
    { name: 'Dom', value: 90 },
];

const CHAIN_COMPONENTS: Record<string, React.ElementType> = {
    "Base": BaseIcon,
    "Optimism": OPIcon,
    "Ethereum": EthIcon,
    "Arbitrum": ArbIcon,
    "Polygon": PolygonIcon,
    "Avalanche": AvalancheIcon,
};

// ----------------------------------------------------------------------
// HELPER COMPONENTS
// ----------------------------------------------------------------------

const ChainLogo = ({ chain }: { chain: string }) => {
    const IconComponent = CHAIN_COMPONENTS[chain];
    if (IconComponent) return <IconComponent />;
    return (
        <Avatar sx={{ width: 16, height: 16, bgcolor: "#333" }}>
            <LinkIcon sx={{ fontSize: 10, color: "#fff" }} />
        </Avatar>
    );
};

// Transaction Detail Component (Embedded) - COMPACT VERSION
const TransactionDetailView = ({ transaction, onClose }: { transaction: any, onClose: () => void }) => {
    const [isExpanded, setIsExpanded] = useState(false); // State to control View More
    if (!transaction) return null;

    return (
        <Box sx={{ height: "100%", overflowY: "auto", pr: 1 }}>
            {/* Header / Close Button */}


            {/* Content Card - COMPACT */}
            <Box
                sx={{
                    bgcolor: "#fff",
                    border: "3px solid #000",
                    borderRadius: 3,
                    boxShadow: "4px 4px 0px #000",
                    overflow: "hidden"
                }}
            >
                {/* Main Info */}
                <Box sx={{ p: 2.5, borderBottom: "3px solid #000", bgcolor: "#fff" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <Chip
                                    label={transaction.status}
                                    size="small"
                                    sx={{
                                        borderRadius: 1,
                                        bgcolor: transaction.status === "SUCCESS" ? "#00DC8C" : transaction.status === "FAILED" ? "#FF2E2E" : "#FFF59D",
                                        color: "#000",
                                        fontWeight: 900,
                                        border: "1.5px solid #000",
                                        boxShadow: "1.5px 1.5px 0px #000",
                                        fontSize: 10,
                                        height: 22,
                                        px: 0.5
                                    }}
                                />
                                <Typography variant="subtitle1" fontWeight={800}>
                                    {transaction.type === "SEND" ? "Envío" : transaction.type === "RECEIVE" ? "Recepción" : "Operación"}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="#666" fontWeight={700} fontFamily="monospace" fontSize={11}>
                                ID: {transaction.id.slice(0, 12)}...
                            </Typography>
                        </Box>
                        <Box textAlign="right">
                            <IconButton
                                onClick={onClose}
                                size="small"
                                sx={{
                                    border: "2px solid #000",
                                    bgcolor: "#fff",
                                    borderRadius: 2,
                                    width: 24, height: 24,
                                    boxShadow: "2px 2px 0px #000",
                                    mb: 1,
                                    "&:hover": { bgcolor: "#f5f5f5", transform: "translate(1px, 1px)", boxShadow: "1px 1px 0px #000" }
                                }}
                            >
                                <CloseIcon sx={{ color: "#000", fontWeight: "bold", fontSize: 14 }} />
                            </IconButton>
                            <Typography variant="h4" fontWeight={900}>
                                ${transaction.amount.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" fontWeight={700} color="#666">
                                {transaction.token}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Grid Info */}
                    <Box
                        display="grid"
                        gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
                        gap={1.5}
                        sx={{
                            bgcolor: "#f8f8f8",
                            p: 2,
                            border: "2px solid #000",
                            borderRadius: 2
                        }}
                    >
                        <Box>
                            <Typography variant="caption" fontWeight={700} color="#666" fontSize={10}>DE</Typography>
                            <Typography fontWeight={700} fontSize={13} sx={{ wordBreak: "break-all" }}>{transaction.addressFrom}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" fontWeight={700} color="#666" fontSize={10}>PARA</Typography>
                            <Typography fontWeight={700} fontSize={13} sx={{ wordBreak: "break-all" }}>{transaction.addressTo}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" fontWeight={700} color="#666" fontSize={10}>CHAIN</Typography>
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <ChainLogo chain={transaction.chainTo} />
                                <Typography fontWeight={700} fontSize={13}>{transaction.chainTo}</Typography>
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="caption" fontWeight={700} color="#666" fontSize={10}>HASH</Typography>
                            <Typography fontWeight={700} sx={{ wordBreak: "break-all", fontFamily: "monospace", fontSize: 11 }}>
                                {transaction.txHash.slice(0, 8)}...
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Sub-Transactions / Route */}
                {transaction.route && transaction.route.length > 0 && (
                    <>
                        <Box sx={{ bgcolor: "#FFD700", p: 1, borderBottom: "2.5px solid #000" }}>
                            <Typography fontWeight={900} textTransform="uppercase" fontSize={10} letterSpacing={1}>
                                Ruta de Ejecución
                            </Typography>
                        </Box>
                        <Box>
                            {(() => {
                                // Flatten all steps for the view logic
                                const allSteps = transaction.route.flatMap((routeItem: any, idx: number) =>
                                    routeItem.chains.map((chain: any, cIdx: number) => ({
                                        ...chain,
                                        groupIndex: idx,
                                        cumulativeIndex: transaction.route.slice(0, idx).reduce((acc: number, item: any) => acc + (item.chains?.length || 0), 0) + cIdx + 1
                                    }))
                                );

                                const visibleSteps = isExpanded ? allSteps : allSteps.slice(0, 5);

                                return (
                                    <>
                                        {visibleSteps.map((step: any, flatIndex: number) => {
                                            // Check if we need a group separator (border)
                                            // We draw a border IF:
                                            // 1. It is NOT the last item in the list
                                            // 2. The NEXT item belongs to a DIFFERENT group
                                            const showGroupBorder = flatIndex < visibleSteps.length - 1 && step.groupIndex !== visibleSteps[flatIndex + 1].groupIndex;

                                            // Also, if this is the very last VISIBLE item, but NOT the last ACTUAL item (collapsed state), we might want a visual cue?
                                            // Actually, standard list border is fine.

                                            return (
                                                <Box key={flatIndex} sx={{ borderBottom: showGroupBorder ? "2px solid #000" : "1px solid #eee" }}>
                                                    {/* Note: I changed inner borders to lighter line, and only group borders to black line for clarity */}
                                                    <Box sx={{ p: 1.5, display: "flex", alignItems: "flex-start", justifyContent: "space-between", "&:hover": { bgcolor: "#fff9c4" } }}>
                                                        <Box display="flex" alignItems="flex-start" gap={1.5}>
                                                            {/* Step Number */}
                                                            <Box
                                                                sx={{
                                                                    width: 24, height: 24,
                                                                    borderRadius: "50%",
                                                                    bgcolor: "#3CD2FF",
                                                                    border: "2px solid #000",
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                    fontWeight: 900,
                                                                    fontSize: 11,
                                                                    boxShadow: "1px 1px 0px #000",
                                                                    flexShrink: 0,
                                                                    mt: 0.5
                                                                }}
                                                            >
                                                                {step.cumulativeIndex}
                                                            </Box>

                                                            {/* Content */}
                                                            <Box display="flex" gap={1}>
                                                                <Box mt={0.5}><ChainLogo chain={step.name} /></Box>
                                                                <Box>
                                                                    <Typography fontWeight={800} fontSize={14} sx={{ lineHeight: 1.2 }}>
                                                                        {step.name}
                                                                    </Typography>
                                                                    <Typography variant="caption" fontWeight={600} fontFamily="monospace" color="#666" fontSize={10} sx={{ display: "block", lineHeight: 1.2 }}>
                                                                        {step.txHash.slice(0, 12)}...
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                        <Box textAlign="right">
                                                            <Typography fontWeight={800} fontSize={14}>${step.amount}</Typography>
                                                            <Chip
                                                                label={step.status}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: step.status === "SUCCESS" ? "#00DC8C" : "#FFD700",
                                                                    fontWeight: 800,
                                                                    border: "1.5px solid #000",
                                                                    fontSize: 9,
                                                                    height: 18,
                                                                    mt: 0.5
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            );
                                        })}

                                        {/* Toggle Button */}
                                        {allSteps.length > 5 && (
                                            <Box sx={{ p: 2, textAlign: "center", borderTop: "2px solid #000" }}>
                                                <Typography
                                                    onClick={() => setIsExpanded(!isExpanded)}
                                                    sx={{
                                                        cursor: "pointer",
                                                        fontWeight: 800,
                                                        textTransform: "uppercase",
                                                        fontSize: 12,
                                                        textDecoration: "underline",
                                                        "&:hover": { color: "#555" }
                                                    }}
                                                >
                                                    {isExpanded ? "Ver menos" : `Ver más (+${allSteps.length - 5})`}
                                                </Typography>
                                            </Box>
                                        )}
                                    </>
                                );
                            })()}
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
};

// ----------------------------------------------------------------------
// MAIN PAGE COMPONENT
// ----------------------------------------------------------------------

export default function HistoryListPage() {
    const router = useRouter();
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false); // State for main list expansion

    // Derived Metrics from MOCK_TRANSACTIONS
    const totalSends = MOCK_TRANSACTIONS.filter(tx => tx.type === "SEND").length;
    const totalFees = MOCK_TRANSACTIONS.reduce((acc, tx) => acc + (tx.fee || 0), 0);
    const maxSent = Math.max(...MOCK_TRANSACTIONS.filter(tx => tx.type === "SEND").map(tx => tx.amount), 0);

    const tokenCounts = MOCK_TRANSACTIONS.reduce((acc: any, tx) => {
        acc[tx.token] = (acc[tx.token] || 0) + 1;
        return acc;
    }, {});
    const mostUsedToken = Object.keys(tokenCounts).reduce((a, b) => tokenCounts[a] > tokenCounts[b] ? a : b, "N/A");

    // Helper to find selected tx
    const selectedTx = MOCK_TRANSACTIONS.find(t => t.id === selectedTxId);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f0f0f0", display: "flex", flexDirection: "column" }}>


            <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: { xs: 2, lg: 4 }, alignItems: "stretch" }}>

                    {/* LEFT COLUMN: Transactions List (50%) */}
                    <Box sx={{ flex: 1, minWidth: 0, width: "100%", display: "flex", flexDirection: "column", p: { xs: 2, md: 3 } }}>
                        {/* Header Moved Here */}
                        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
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
                        <Box display="flex" flexDirection="column" gap={2} sx={{
                            pr: 1,
                            pb: 2
                        }}>
                            {(isHistoryExpanded ? MOCK_TRANSACTIONS : MOCK_TRANSACTIONS.slice(0, 5)).map((tx) => (
                                <Card
                                    key={tx.id}
                                    sx={{
                                        flexShrink: 0, // Prevent shrinking
                                        border: selectedTxId === tx.id ? "4px solid #000" : "3px solid #000",
                                        borderRadius: 3,
                                        bgcolor: selectedTxId === tx.id ? "#fff9c4" : "#fff", // Highlight selected
                                        boxShadow: selectedTxId === tx.id ? "2px 2px 0px #000" : "4px 4px 0px #000", // "Pressed" effect if selected
                                        transform: selectedTxId === tx.id ? "translate(2px, 2px)" : "none",
                                        transition: "all 0.1s",
                                        "&:hover": {
                                            transform: selectedTxId === tx.id ? "translate(2px, 2px)" : "translate(-2px, -2px)",
                                            boxShadow: selectedTxId === tx.id ? "2px 2px 0px #000" : "6px 6px 0px #000"
                                        }
                                    }}
                                >
                                    <CardActionArea
                                        onClick={() => setSelectedTxId(tx.id)}
                                        sx={{ p: 2.5 }}
                                    >
                                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                            {/* Left: Icon + Info */}
                                            <Box display="flex" alignItems="center" gap={2} flex={1} overflow="hidden" minWidth={0}>
                                                <Box
                                                    sx={{
                                                        width: 52, height: 52,
                                                        minWidth: 52, // Prevent shrinking
                                                        borderRadius: 2,
                                                        border: "2.5px solid #000",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        bgcolor: tx.type === "SEND" ? "#FF90E8" : tx.type === "RECEIVE" ? "#00DC8C" : "#FFD700"
                                                    }}
                                                >
                                                    {tx.type === "SEND" && <CallMadeIcon sx={{ color: "#000", fontSize: 28 }} />}
                                                    {tx.type === "RECEIVE" && <CallReceivedIcon sx={{ color: "#000", fontSize: 28 }} />}
                                                    {tx.type === "SAVINGS" && <Typography fontSize={24}>🏦</Typography>}
                                                </Box>
                                                <Box flex={1} overflow="hidden" minWidth={0}>
                                                    <Typography fontWeight={900} fontSize={18} noWrap sx={{ lineHeight: 1.2, mb: 0.5 }}>
                                                        {tx.type === "SEND" ? "Envío" : tx.type === "RECEIVE" ? "Recibido" : "Yield Deposit"}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={700} color="#666" noWrap sx={{ lineHeight: 1.2 }}>
                                                        {tx.date} • {tx.type === "SEND" ? tx.to : tx.from || tx.to}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Right: Amount + Status */}
                                            <Box textAlign="right" flexShrink={0} ml={2}>
                                                <Typography fontWeight={900} fontSize={18} color={tx.type === "SEND" ? "#000" : "#008a57"}>
                                                    {tx.type === "SEND" ? "-" : "+"}${tx.amount} {tx.token}
                                                </Typography>
                                                <Chip
                                                    label={tx.status}
                                                    size="small"
                                                    sx={{
                                                        height: 24,
                                                        fontSize: 11,
                                                        fontWeight: 900,
                                                        border: "2px solid #000",
                                                        bgcolor: tx.status === "SUCCESS" ? "#fff" : tx.status === "FAILED" ? "#FF2E2E" : "#FFF59D",
                                                        color: tx.status === "FAILED" ? "#fff" : "#000",
                                                        mt: 0.5
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </CardActionArea>
                                </Card>
                            ))}

                            {/* History Toggle Button */}
                            {MOCK_TRANSACTIONS.length > 5 && (
                                <Box sx={{ textAlign: "center", py: 2 }}>
                                    <Typography
                                        onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                        sx={{
                                            cursor: "pointer",
                                            fontWeight: 900,
                                            textTransform: "uppercase",
                                            fontSize: 14,
                                            textDecoration: "underline",
                                            "&:hover": { color: "#555" }
                                        }}
                                    >
                                        {isHistoryExpanded ? "Ver menos" : `Ver más (+${MOCK_TRANSACTIONS.length - 5})`}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* DIVIDER LINE (Visible only on Desktop) */}
                    <Box sx={{ display: { xs: "none", lg: "block" }, width: "4px", bgcolor: "#000", opacity: 0.2, borderRadius: 1 }} />

                    {/* RIGHT COLUMN: Metrics OR Detail (50%) */}
                    <Box sx={{ flex: 1, minWidth: 0, width: "100%", pt: 12, px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
                        {selectedTx ? (
                            // SHOW DETAIL VIEW
                            <TransactionDetailView
                                transaction={selectedTx}
                                onClose={() => setSelectedTxId(null)}
                            />
                        ) : (
                            // SHOW METRICS VIEW
                            <Box display="flex" flexDirection="column" gap={3}>
                                {/* QUICK STATS CARD */}
                                <Box
                                    sx={{
                                        border: "3px solid #000",
                                        borderRadius: 3,
                                        bgcolor: "#fff",
                                        boxShadow: "4px 4px 0px #000",
                                        p: 3
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <AssessmentIcon sx={{ color: "#000" }} />
                                        <Typography fontWeight={900} textTransform="uppercase">Métricas Clave</Typography>
                                    </Box>

                                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                            <Typography variant="caption" fontWeight={700} color="#666">TOTAL ENVÍOS</Typography>
                                            <Typography variant="h5" fontWeight={900}>{totalSends}</Typography>
                                        </Box>
                                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                            <Typography variant="caption" fontWeight={700} color="#666">FEE PAGADO</Typography>
                                            <Typography variant="h5" fontWeight={900}>${totalFees.toFixed(2)}</Typography>
                                        </Box>
                                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                            <Typography variant="caption" fontWeight={700} color="#666">TOP COIN</Typography>
                                            <Typography variant="h5" fontWeight={900}>{mostUsedToken}</Typography>
                                        </Box>
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
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
