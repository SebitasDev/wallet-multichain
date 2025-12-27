import { Box, Typography, IconButton, Card, CardActionArea, CircularProgress, Chip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import CallMadeIcon from "@mui/icons-material/CallMade";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import React from "react";
import { useRouter } from "next/navigation";
import { TokenLogo } from "./HistoryHelpers";

type Props = {
    loading: boolean;
    transactions: any[];
    selectedTxId: string | null;
    setSelectedTxId: (id: string | null) => void;
    page: number;
    totalPages: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    handleRefresh: () => void;
};

export const HistoryTransactionList = ({
    loading,
    transactions,
    selectedTxId,
    setSelectedTxId,
    page,
    totalPages,
    setPage,
    handleRefresh
}: Props) => {
    const router = useRouter();

    return (
        <Box sx={{ flex: 1, minWidth: 0, width: "100%", display: "flex", flexDirection: "column", p: { xs: 2, md: 3 } }}>
            {/* Header */}
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
                <IconButton
                    onClick={handleRefresh}
                    sx={{
                        border: "2px solid #000",
                        bgcolor: "#fff",
                        borderRadius: 2,
                        width: 40, height: 40,
                        boxShadow: "3px 3px 0px #000",
                        "&:hover": { bgcolor: "#f5f5f5", transform: "translate(1px, 1px)", boxShadow: "2px 2px 0px #000" },
                        "&:active": { transform: "translate(3px, 3px)", boxShadow: "0px 0px 0px #000" }
                    }}
                >
                    <RefreshIcon sx={{ color: "#000", fontWeight: "bold" }} />
                </IconButton>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress sx={{ color: "#000" }} />
                </Box>
            ) : (
                <Box display="flex" flexDirection="column" gap={2} sx={{ pr: 1, pb: 2 }}>
                    {transactions.length === 0 && (
                        <Typography variant="body1" textAlign="center" color="text.secondary">No hay transacciones aún.</Typography>
                    )}
                    {transactions.map((tx) => (
                        <Card
                            key={tx.id}
                            sx={{
                                flexShrink: 0,
                                border: selectedTxId === tx.id ? "4px solid #000" : "3px solid #000",
                                borderRadius: 3,
                                bgcolor: selectedTxId === tx.id ? "#fff9c4" : "#fff",
                                boxShadow: selectedTxId === tx.id ? "2px 2px 0px #000" : "4px 4px 0px #000",
                                transform: selectedTxId === tx.id ? "translate(2px, 2px)" : "none",
                                transition: "all 0.1s",
                                "&:hover": {
                                    transform: selectedTxId === tx.id ? "translate(2px, 2px)" : "translate(-2px, -2px)",
                                    boxShadow: selectedTxId === tx.id ? "2px 2px 0px #000" : "6px 6px 0px #000"
                                }
                            }}
                        >
                            <CardActionArea onClick={() => setSelectedTxId(tx.id)} sx={{ p: 2.5 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                    {/* Left: Icon + Info */}
                                    <Box display="flex" alignItems="center" gap={2} flex={1} overflow="hidden" minWidth={0}>
                                        <Box
                                            sx={{
                                                width: 52, height: 52,
                                                minWidth: 52,
                                                borderRadius: 2,
                                                border: "2.5px solid #000",
                                                display: "flex", alignItems: "center", justifyContent: "center",
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
                                                    Est: ${Number(tx.estimatedReceived).toLocaleString('en-US', { maximumFractionDigits: 6 })}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Right: Amount + Status */}
                                    <Box textAlign="right" flexShrink={0} ml={2}>
                                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                                            <Typography fontWeight={900} fontSize={18} color={tx.type === "SEND" ? "#FF2E2E" : "#008a57"}>
                                                {tx.type === "SEND" ? "-" : "+"}${Number(tx.type === "RECEIVE" ? (tx.estimatedReceived || tx.amount) : tx.amount).toLocaleString('en-US', { maximumFractionDigits: 6 })}
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
                                <ArrowBackIcon sx={{ transform: "rotate(180deg)" }} />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};
