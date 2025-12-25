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
    Tooltip,
    CartesianGrid
} from "recharts";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

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

const TOKEN_COMPONENTS: Record<string, React.ElementType> = {
    "USDC": UsdcIcon,
    "USDT": UsdtIcon,
    "BNB": BnbIcon,
    "ETH": EthIcon,
    "WETH": EthIcon,
    "MATIC": PolygonIcon,
    "AVAX": AvalancheIcon,
    "XLM": StellarIcon,
    "OP": OPIcon,
    "ARB": ArbIcon,
    "MON": MonadIcon,
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <Box sx={{
                bgcolor: '#fff',
                border: '2px solid #000',
                boxShadow: '4px 4px 0px #000',
                p: 1.5,
                borderRadius: 2
            }}>
                <Typography fontWeight={900} fontSize={12} textTransform="uppercase" color="#666" mb={0.5}>
                    {label}
                </Typography>
                <Typography fontWeight={900} fontSize={16} color="#000">
                    ${payload[0].value.toLocaleString()}
                </Typography>
                <Typography variant="caption" fontWeight={700} color="#00DC8C">
                    En envíos
                </Typography>
            </Box>
        );
    }
    return null;
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

const TokenLogo = ({ token, size = 16 }: { token: string, size?: number }) => {
    const IconComponent = TOKEN_COMPONENTS[token] || TOKEN_COMPONENTS[token.toUpperCase()];

    // Customize size for Icons that accept it, or wrap standard ones
    if (IconComponent) {
        // Some icons like UsdcIcon might accept size, others might not. 
        // For consistency in this specific codebase where icons seem to be varied:
        // We'll wrap in a Box to enforce size if needed, or pass size prop if supported.
        // Looking at BnbIcon, it returns an img with fixed 24x24 but style access?
        // Let's wrap in a styled Box to handle visual sizing broadly.
        return (
            <Box sx={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', '& > *': { width: '100%', height: '100%' } }}>
                <IconComponent />
            </Box>
        );
    }

    return (
        <Avatar sx={{ width: size, height: size, bgcolor: "#000", fontSize: size * 0.5, fontWeight: 900 }}>
            {token.charAt(0)}
        </Avatar>
    );
};

const getExplorerUrl = (chain: string, hash: string) => {
    const baselines: Record<string, string> = {
        "Ethereum": "https://etherscan.io/tx/",
        "Polygon": "https://polygonscan.com/tx/",
        "BNB": "https://bscscan.com/tx/",
        "Arbitrum": "https://arbiscan.io/tx/",
        "Optimism": "https://optimistic.etherscan.io/tx/",
        "Avalanche": "https://snowtrace.io/tx/",
        "Base": "https://basescan.org/tx/",
        "Stellar": "https://stellar.expert/explorer/public/tx/",
        "Monad": "https://explorer.monad.xyz/tx/", // Hypothetical URL
        "Unichain": "https://unichain-explorer.com/tx/", // Hypothetical URL
        "World Chain": "https://worldchain-explorer.com/tx/", // Hypothetical URL,
        "Unknown": "#"
    };
    const base = baselines[chain] || baselines[Object.keys(baselines).find(k => chain.toLowerCase().includes(k.toLowerCase())) || "Unknown"];
    if (base === "#" || !hash) return "#";
    return `${base}${hash}`;
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
                            <Box>
                                <Typography variant="caption" color="#666" fontWeight={700} fontFamily="monospace" fontSize={11} display="block">
                                    ID: {transaction.id.slice(0, 12)}...
                                </Typography>
                                {transaction.estimatedReceived && transaction.totalAmount && (
                                    <Typography variant="caption" fontWeight={800} color="#666" fontSize={10}>
                                        Est. Recibido: ${Number(transaction.estimatedReceived).toFixed(4)}
                                    </Typography>
                                )}
                            </Box>
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
                                <Box display="flex" alignItems="center" gap={0.5} flexDirection="column" mt={0.5}>
                                    <Typography variant="caption" fontWeight={900} color="#666" fontSize={10}>
                                        {transaction.token}
                                    </Typography>
                                </Box>
                                {transaction.estimatedReceived && (
                                    <Box mt={0.5}>
                                        <Typography variant="caption" color="error" fontWeight={900} fontSize={10} display="block">
                                            Fee/Diff: -${(transaction.totalAmount - transaction.estimatedReceived).toFixed(4)}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Grid Info */}
                    <Box
                        display="grid"
                        gridTemplateColumns="1fr"
                        gap={0}
                        sx={{
                            bgcolor: "#f8f8f8",
                            border: "2px solid #000",
                            borderRadius: 2,
                            overflow: "hidden"
                        }}
                    >
                        {/* DE / PARA Row */}
                        <Box display="grid" gridTemplateColumns="1fr 1fr" sx={{ borderBottom: "2px solid #000" }}>
                            <Box sx={{ p: 1.5, borderRight: "2px solid #000" }}>
                                <Typography variant="caption" fontWeight={900} color="#666" fontSize={10} mb={0.5} display="block">DE</Typography>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <Typography fontWeight={700} fontSize={12} fontFamily="monospace">
                                        {transaction.addressFrom.slice(0, 6)}...{transaction.addressFrom.slice(-4)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ p: 1.5 }}>
                                <Typography variant="caption" fontWeight={900} color="#666" fontSize={10} mb={0.5} display="block">PARA</Typography>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <Typography fontWeight={700} fontSize={12} fontFamily="monospace">
                                        {transaction.addressTo.slice(0, 6)}...{transaction.addressTo.slice(-4)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* CHAIN / HASH Row */}
                        <Box display="grid" gridTemplateColumns="1fr 1fr">
                            <Box sx={{ p: 1.5, borderRight: "2px solid #000" }}>
                                <Typography variant="caption" fontWeight={900} color="#666" fontSize={10} mb={0.5} display="block">CHAIN</Typography>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <ChainLogo chain={transaction.chainTo} />
                                    <Typography fontWeight={800} fontSize={12}>{transaction.chainTo}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ p: 1.5 }}>
                                <Typography variant="caption" fontWeight={900} color="#666" fontSize={10} mb={0.5} display="block">HASH</Typography>
                                <Typography fontWeight={700} fontSize={12} fontFamily="monospace" sx={{ wordBreak: "break-all", lineHeight: 1.1 }}>
                                    {transaction.txHash ? (
                                        <a
                                            href={getExplorerUrl(transaction.chainTo, transaction.txHash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: "inherit", textDecoration: "underline", textDecorationThickness: "2px" }}
                                        >
                                            {transaction.txHash.slice(0, 10)}...{transaction.txHash.slice(-8)}
                                        </a>
                                    ) : "N/A"}
                                </Typography>
                            </Box>
                        </Box>

                    </Box>
                </Box>

                {/* Sub-Transactions / Route */}
                {transaction.route && transaction.route.length > 0 && (
                    <>
                        <Box sx={{ bgcolor: "#FFD700", p: 1, borderBottom: "2.5px solid #000", borderTop: "3px solid #000" }}>
                            <Typography fontWeight={900} textTransform="uppercase" fontSize={11} letterSpacing={1} textAlign="center">
                                Ruta de Ejecución
                            </Typography>
                        </Box>
                        <Box>
                            {(() => {
                                const steps = transaction.route;
                                const visibleSteps = isExpanded ? steps : steps.slice(0, 5);

                                return (
                                    <>
                                        {visibleSteps.map((step: any, index: number) => {
                                            return (
                                                <Box key={index} sx={{ borderBottom: "1px solid #eee" }}>
                                                    <Box sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", "&:hover": { bgcolor: "#fff9c4" } }}>
                                                        <Box display="flex" alignItems="center" gap={1.5}>
                                                            {/* Step Number */}
                                                            <Box
                                                                sx={{
                                                                    width: 20, height: 20,
                                                                    borderRadius: "50%",
                                                                    bgcolor: "#3CD2FF",
                                                                    border: "2px solid #000",
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                    fontWeight: 900,
                                                                    fontSize: 10,
                                                                    boxShadow: "1px 1px 0px #000",
                                                                    flexShrink: 0
                                                                }}
                                                            >
                                                                {index + 1}
                                                            </Box>

                                                            {/* Content */}
                                                            <Box>
                                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                                    <ChainLogo chain={step.chainName} />
                                                                    <Typography fontWeight={800} fontSize={13}>
                                                                        {step.chainName}
                                                                    </Typography>
                                                                </Box>
                                                                <Typography variant="caption" fontWeight={600} fontFamily="monospace" color="#666" fontSize={10}>
                                                                    {step.txHash ? (
                                                                        <a
                                                                            href={getExplorerUrl(step.chainName, step.txHash)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={{ color: "#666", textDecoration: "none", borderBottom: "1px dotted #666" }}
                                                                            onMouseEnter={(e: any) => e.target.style.color = "#000"}
                                                                            onMouseLeave={(e: any) => e.target.style.color = "#666"}
                                                                        >
                                                                            {step.txHash.slice(0, 6)}...{step.txHash.slice(-4)}
                                                                        </a>
                                                                    ) : 'N/A'}
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        {/* Right Side: Status & Amount */}
                                                        <Box textAlign="right" display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                                <Typography fontWeight={800} fontSize={13}>${step.amount}</Typography>
                                                                {step.assetOrigin && (
                                                                    <TokenLogo token={step.assetOrigin} size={16} />
                                                                )}
                                                            </Box>
                                                            <Chip
                                                                label={step.status}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: step.status === "SUCCESS" ? "#00DC8C" : "#FFD700",
                                                                    fontWeight: 900,
                                                                    border: "1.5px solid #000",
                                                                    fontSize: 8,
                                                                    height: 16,
                                                                    px: 0.5
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

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 5;

    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalSends: 0,
        totalSentAmount: 0,
        maxSent: 0,
        totalReceives: 0,
        totalReceivedAmount: 0,
        mostUsedToken: "N/A",
        weeklyActivity: [] as any[]
    });
    const [loading, setLoading] = useState(true);

    const address = mainWallet?.address;

    useEffect(() => {
        const fetchHistory = async () => {
            if (!address) {
                setLoading(false);
                return;
            }

            try {
                // Fetch with pagination
                const res = await fetch(`/api/transactions?address=${address}&page=${page}&limit=${LIMIT}`);
                const data = await res.json();
                if (data.success) {
                    // Map API data to UI format
                    const mapped = data.transactions.map((tx: any) => {
                        // Fuzzy check for isSender: if the stored fromAddress starts with our address (or vice versa)
                        // This handles cases where one might have a suffix (e.g. 0x...B)
                        const cleanUserAddr = address.toLowerCase().startsWith('0x') ? address.toLowerCase().substring(0, 42) : address.toLowerCase();
                        const cleanTxFrom = tx.fromAddress.toLowerCase().startsWith('0x') ? tx.fromAddress.toLowerCase().substring(0, 42) : tx.fromAddress.toLowerCase();

                        const isSender = cleanTxFrom === cleanUserAddr; // Robust comparison

                        return {
                            id: tx.id,
                            type: isSender ? "SEND" : "RECEIVE",
                            date: format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm"),
                            amount: tx.totalAmount,
                            token: tx.tokenSymbol || "USDC", // Fallback, but now we should have it
                            status: tx.status,
                            from: tx.fromAddress,
                            to: tx.toAddress || "Unknown",
                            addressFrom: tx.fromAddress,
                            addressTo: tx.toAddress || "Unknown",
                            chainTo: tx.destinationChain || "Unknown",
                            txHash: tx.route?.[0]?.txHash || "",
                            fee: 0,
                            route: tx.route,
                            route: tx.route,
                            tokenSymbol: tx.tokenSymbol,
                            createdAt: tx.createdAt // [NEW] Needed for filtering by date
                        };
                    });
                    setTransactions(mapped);
                    // Update Page Info
                    if (data.pagination) {
                        setTotalPages(data.pagination.totalPages);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch history", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchStats = async () => {
            if (!address) return;
            try {
                const res = await fetch(`/api/transactions/stats?address=${address}`);
                const data = await res.json();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };

        fetchHistory();
        fetchStats();
    }, [address, page]);


    // --- NEW LOGIC: Weekly Chart Data (Current Week) ---
    const today = new Date();
    // Get start and end of current week (Sunday to Saturday)
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 });
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 0 });

    // Generate array of days for the current week
    const weekDays = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });

    const weeklySendsData = weekDays.map(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        // Find stats for this day
        const dayStat = stats.weeklyActivity.find((item: any) => item._id === dateStr);
        const dayTotal = dayStat ? dayStat.totalAmount : 0;

        // Format day name (e.g., "Lun", "Mar")
        const dayName = format(day, "eee", { locale: es });
        // Capitalize first letter
        const formattedName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

        return {
            name: formattedName,
            value: dayTotal
        };
    });

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
                                {transactions.map((tx) => (
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
                                                        {tx.estimatedReceived && tx.type === "SEND" && (
                                                            <Typography variant="caption" fontWeight={800} color="#666" sx={{ fontSize: 10, bgcolor: "#eee", px: 0.5, borderRadius: 0.5, display: "inline-block", mt: 0.5 }}>
                                                                Est: ${Number(tx.estimatedReceived).toFixed(2)}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>

                                                {/* Right: Amount + Status */}
                                                <Box textAlign="right" flexShrink={0} ml={2}>
                                                    <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                                                        <Typography fontWeight={900} fontSize={18} color={tx.type === "SEND" ? "#000" : "#008a57"}>
                                                            {tx.type === "SEND" ? "-" : "+"}${tx.amount}
                                                        </Typography>
                                                        <TokenLogo token={tx.token} size={20} />
                                                    </Box>
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

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={2}>
                                        <IconButton
                                            disabled={page === 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            sx={{
                                                border: "2px solid #000",
                                                bgcolor: page === 1 ? "#e0e0e0" : "#fff",
                                                color: page === 1 ? "#999" : "#000",
                                                boxShadow: page === 1 ? "none" : "3px 3px 0px #000",
                                                "&:hover": {
                                                    bgcolor: page === 1 ? "#e0e0e0" : "#f5f5f5",
                                                    transform: page === 1 ? "none" : "translate(1px, 1px)",
                                                    boxShadow: page === 1 ? "none" : "2px 2px 0px #000"
                                                }
                                            }}
                                        >
                                            <ArrowBackIcon />
                                        </IconButton>
                                        <Typography fontWeight={900} fontSize={14}>
                                            Página {page} de {totalPages}
                                        </Typography>
                                        <IconButton
                                            disabled={page === totalPages}
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            sx={{
                                                border: "2px solid #000",
                                                bgcolor: page === totalPages ? "#e0e0e0" : "#fff",
                                                color: page === totalPages ? "#999" : "#000",
                                                boxShadow: page === totalPages ? "none" : "3px 3px 0px #000",
                                                "&:hover": {
                                                    bgcolor: page === totalPages ? "#e0e0e0" : "#f5f5f5",
                                                    transform: page === totalPages ? "none" : "translate(1px, 1px)",
                                                    boxShadow: page === totalPages ? "none" : "2px 2px 0px #000"
                                                }
                                            }}
                                        >
                                            {/* Rotate ArrowBack to make it ArrowForward since we already imported ArrowBack */}
                                            <ArrowBackIcon sx={{ transform: "rotate(180deg)" }} />
                                        </IconButton>
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
                                        {/* SEND STATS */}
                                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                            <Typography variant="caption" fontWeight={700} color="#666">TOTAL ENVÍOS</Typography>
                                            <Typography variant="h5" fontWeight={900}>{stats.totalSends}</Typography>
                                        </Box>
                                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                            <Typography variant="caption" fontWeight={700} color="#666">TOTAL ENVIADO</Typography>
                                            <Typography variant="h5" fontWeight={900}>${stats.totalSentAmount.toLocaleString()}</Typography>
                                        </Box>

                                        {/* RECEIVE STATS */}
                                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                            <Typography variant="caption" fontWeight={700} color="#666">TOTAL RECIBIDOS</Typography>
                                            <Typography variant="h5" fontWeight={900}>{stats.totalReceives}</Typography>
                                        </Box>
                                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                            <Typography variant="caption" fontWeight={700} color="#666">TOTAL RECIBIDO</Typography>
                                            <Typography variant="h5" fontWeight={900}>${stats.totalReceivedAmount.toLocaleString()}</Typography>
                                        </Box>

                                        {/* OTHER STATS */}
                                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                            <Typography variant="caption" fontWeight={700} color="#666">TOP COIN</Typography>
                                            <Typography variant="h5" fontWeight={900}>{stats.mostUsedToken}</Typography>
                                        </Box>
                                        <Box sx={{ bgcolor: "#f8f8f8", p: 1.5, borderRadius: 2, border: "2px solid #000" }}>
                                            <Typography variant="caption" fontWeight={700} color="#666">MAYOR ENVÍO</Typography>
                                            <Typography variant="h5" fontWeight={900}>${stats.maxSent}</Typography>
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
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <BarChartIcon />
                                            <Typography fontWeight={900} textTransform="uppercase">Envíos por Día (Semana Actual)</Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ width: "100%", height: "85%" }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={weeklySendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                                    fill="#FF90E8"
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
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
