"use client";

import { Box, Typography, IconButton, Card, CardActionArea, Chip, Avatar, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CallMadeIcon from "@mui/icons-material/CallMade";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import BarChartIcon from "@mui/icons-material/BarChart";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip
} from "recharts";
import { format } from "date-fns";

// Import Atom Icons locally for the Detail view
import { BaseIcon } from "../components/atoms/BaseIcon";
import { OPIcon } from "../components/atoms/OPIcon";
import { EthIcon } from "../components/atoms/EthIcon";
import ArbIcon from "../components/atoms/ArbIcon";
import PolygonIcon from "../components/atoms/PolygonIcon";
import { AvalancheIcon } from "../components/atoms/AvalancheIcon";
import { BnbIcon } from "../components/atoms/BnbIcon";
import { StellarIcon } from "../components/atoms/StellarIcon";
import { MonadIcon } from "../components/atoms/MonadIcon";
import { UnichainIcon } from "../components/atoms/UnichainIcon";
import { WorldChainIcon } from "../components/atoms/WorldChainIcon";
import { UsdcIcon } from "../components/atoms/UsdcIcon";
import { UsdtIcon } from "../components/atoms/UsdtIcon";
import { useXOWalletStore } from "../store/useXOWalletStore";

// ----------------------------------------------------------------------
// DATA & CONFIG
// ----------------------------------------------------------------------

const CHAIN_COMPONENTS: Record<string, React.ElementType> = {
    "Base": BaseIcon,
    "Optimism": OPIcon,
    "Ethereum": EthIcon,
    "Arbitrum": ArbIcon,
    "Polygon": PolygonIcon,
    "Avalanche": AvalancheIcon,
    "BNB": BnbIcon,
    "Binance": BnbIcon,
    "Binance Smart Chain": BnbIcon,
    "BSC": BnbIcon,
    "Stellar": StellarIcon,
    "Monad": MonadIcon,
    "Unichain": UnichainIcon,
    "World Chain": WorldChainIcon,
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
                            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                                <Typography variant="h4" fontWeight={900}>
                                    ${transaction.amount.toLocaleString()}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={0.25} flexDirection="column" mt={1.5}>
                                    {transaction.token === 'USDC' && <UsdcIcon />}
                                    {transaction.token === 'USDT' && <UsdtIcon />}
                                    <Typography variant="caption" fontWeight={900} color="#666" fontSize={10}>
                                        {transaction.token}
                                    </Typography>
                                </Box>
                            </Box>
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
                        {transaction.txHash && (
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="#666" fontSize={10}>HASH</Typography>
                                <Typography fontWeight={700} sx={{ wordBreak: "break-all", fontFamily: "monospace", fontSize: 11 }}>
                                    {transaction.txHash}
                                </Typography>
                            </Box>
                        )}

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
                                // For current route logic, it's a simple list of steps. 
                                // We might need to adapt if the model changes to groups of chains.
                                // The backend returns: route: [{ chainName, amount, status, txHash }]
                                // The UI expects: routeItem: { chains: [...] } structure OR we adapt here.

                                // Adapting BACKEND format to UI logic or simplifying UI logic.
                                // Let's simplify UI logic for now as the backend structure is flat for now (or simple list)

                                const steps = transaction.route;
                                const visibleSteps = isExpanded ? steps : steps.slice(0, 5);

                                return (
                                    <>
                                        {visibleSteps.map((step: any, index: number) => {
                                            return (
                                                <Box key={index} sx={{ borderBottom: "1px solid #eee" }}>
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
                                                                {index + 1}
                                                            </Box>

                                                            {/* Content */}
                                                            <Box display="flex" gap={1}>
                                                                <Box mt={0.5}><ChainLogo chain={step.chainName} /></Box>
                                                                <Box>
                                                                    <Typography fontWeight={800} fontSize={14} sx={{ lineHeight: 1.2 }}>
                                                                        {step.chainName}
                                                                    </Typography>
                                                                    <Typography variant="caption" fontWeight={600} fontFamily="monospace" color="#666" fontSize={10} sx={{ display: "block", lineHeight: 1.2 }}>
                                                                        {step.txHash || 'N/A'}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                        <Box textAlign="right">
                                                            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                                                                <Typography fontWeight={800} fontSize={14}>${step.amount}</Typography>
                                                                {step.assetOrigin && (
                                                                    <>
                                                                        {step.assetOrigin === 'USDC' && <UsdcIcon />}
                                                                        {step.assetOrigin === 'USDT' && <UsdtIcon />}
                                                                    </>
                                                                )}
                                                            </Box>
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
                                        {steps.length > 5 && (
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
                                                    {isExpanded ? "Ver menos" : `Ver más (+${steps.length - 5})`}
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
    const { mainWallet } = useXOWalletStore();
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false); // State for main list expansion

    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const address = mainWallet?.address;

    useEffect(() => {
        const fetchHistory = async () => {
            if (!address) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/transactions?address=${address}`);
                const data = await res.json();
                if (data.success) {
                    // Map API data to UI format
                    const mapped = data.transactions.map((tx: any) => ({
                        id: tx.id,
                        type: "SEND", // Infer type if possible, for now default to SEND as that's what we support
                        date: format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm"),
                        amount: tx.totalAmount,
                        token: tx.tokenSymbol || "USDC",
                        status: tx.status,
                        from: tx.fromAddress,
                        to: tx.toAddress || "Unknown",
                        addressFrom: tx.fromAddress,
                        addressTo: tx.toAddress || "Unknown",
                        chainTo: tx.destinationChain || "Unknown",
                        txHash: tx.route?.[0]?.txHash || "",
                        fee: 0, // Not stored in main object yet, maybe infer diff?
                        route: tx.route
                    }));
                    setTransactions(mapped);
                }
            } catch (error) {
                console.error("Failed to fetch history", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [address]);


    // Derived Metrics 
    const totalSends = transactions.length;
    // Mocking daily data for now as we don't have enough real data for a chart
    const DAILY_SPEND_DATA = [
        { name: 'Lun', value: 0 },
        { name: 'Mar', value: 0 },
        { name: 'Mie', value: 0 },
        { name: 'Jue', value: 0 },
        { name: 'Vie', value: 0 },
        { name: 'Sab', value: 0 },
        { name: 'Dom', value: 0 },
    ];

    // Update chart with real totals if available? For now keep placeholder or simple sum.
    const totalVolume = transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
    const maxSent = transactions.length > 0 ? Math.max(...transactions.map(tx => tx.amount)) : 0;

    const tokenCounts = transactions.reduce((acc: any, tx) => {
        acc[tx.token] = (acc[tx.token] || 0) + 1;
        return acc;
    }, {});
    const mostUsedToken = Object.keys(tokenCounts).length > 0
        ? Object.keys(tokenCounts).reduce((a, b) => tokenCounts[a] > tokenCounts[b] ? a : b)
        : "N/A";

    // Helper to find selected tx
    const selectedTx = transactions.find(t => t.id === selectedTxId);

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

                        {loading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <CircularProgress sx={{ color: "#000" }} />
                            </Box>
                        ) : (
                            <Box display="flex" flexDirection="column" gap={2} sx={{
                                pr: 1,
                                pb: 2
                            }}>
                                {transactions.length === 0 && (
                                    <Typography variant="body1" textAlign="center" color="text.secondary">No hay transacciones aún.</Typography>
                                )}
                                {(isHistoryExpanded ? transactions : transactions.slice(0, 5)).map((tx) => (
                                    <Card
                                        key={tx.id}
                                        sx={{
                                            flexShrink: 0, // Prevent shrinking
                                            border: selectedTxId === tx.id ? "4px solid #000" : "3px solid #000",
                                            borderRadius: 3,
                                            // Dynamic Background based on Action when selected
                                            bgcolor: selectedTxId === tx.id
                                                ? "#fff9c4" // Standard Yellow highlight for all
                                                : "#fff",
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
                                                            // Send = Orange, Receive = Green, Savings = Yellow
                                                            bgcolor: tx.type === "SEND" ? "#FFAB40" : tx.type === "RECEIVE" ? "#00DC8C" : "#FFD700"
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
                                                            bgcolor: tx.status === "SUCCESS" ? "#00DC8C" : tx.status === "FAILED" ? "#FF2E2E" : "#FFF59D",
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
                                {transactions.length > 5 && (
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
                                            {isHistoryExpanded ? "Ver menos" : `Ver más (+${transactions.length - 5})`}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}

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
                                            <Typography variant="caption" fontWeight={700} color="#666">VOLUMEN TOTAL</Typography>
                                            <Typography variant="h5" fontWeight={900}>${totalVolume.toLocaleString()}</Typography>
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
