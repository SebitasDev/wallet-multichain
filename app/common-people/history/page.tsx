"use client";

import { Box, Typography, Button, CircularProgress, Stack, Container } from "@mui/material";
import { ArrowBack, NorthEast, SouthWest, ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { transactionsApi } from "@/app/services/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLanguageStore } from "@/app/store/useLanguageStore";
import { TransactionDetailModal } from "./components/TransactionDetailModal";

export default function CommonHistoryPage() {
    const router = useRouter();
    const { language } = useLanguageStore();
    const { mainWallet, xoWallet } = useXOWalletStore();
    const address = xoWallet?.address || mainWallet?.address;

    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedTx, setSelectedTx] = useState<any | null>(null);
    const LIMIT = 6;

    useEffect(() => {
        const fetchHistory = async () => {
            if (!address) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const data = await transactionsApi.getAll({ address, page, limit: LIMIT });
                if (data.success && data.transactions) {
                    const mapped = data.transactions.map((tx: any) => {
                        const cleanUserAddr = address.toLowerCase();
                        const cleanTxFrom = tx.fromAddress.toLowerCase();
                        const isSender = cleanTxFrom === cleanUserAddr;

                        return {
                            id: tx.id,
                            type: isSender ? "SEND" : "RECEIVE",
                            date: new Date(tx.createdAt),
                            amount: tx.totalAmount,
                            token: tx.tokenSymbol || "USDC",
                            status: tx.status,
                            color: isSender ? "#fee2e2" : "#dcfce7", // Red/Green bg for icon
                            hash: tx.hash
                        };
                    });
                    setTransactions(mapped);
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

        fetchHistory();
    }, [address, page]);

    const handleNext = () => {
        if (page < totalPages) setPage(p => p + 1);
    };

    const handlePrev = () => {
        if (page > 1) setPage(p => p - 1);
    };

    return (
        <Box sx={{
            minHeight: "100vh",
            backgroundColor: "white", // Match Dashboard bg
            py: 4,
            px: 2
        }}>
            <Container maxWidth="md">
                {/* Header */}
                <Box display="flex" alignItems="center" gap={2} mb={4}>
                    <Button
                        onClick={() => router.back()}
                        sx={{
                            minWidth: 48,
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            border: "2px solid #000000",
                            color: "black",
                            boxShadow: "4px 4px 0px #000000",
                            backgroundColor: "#2dd4bf", // Teal accent
                            "&:hover": {
                                transform: "translate(-2px, -2px)",
                                boxShadow: "6px 6px 0px #000000",
                            },
                            "&:active": {
                                transform: "translate(2px, 2px)",
                                boxShadow: "0px 0px 0px #000000",
                            }
                        }}
                    >
                        <ArrowBack />
                    </Button>
                    <Typography variant="h4" fontWeight={900}>
                        {language === "es" ? "Historial" : "History"}
                    </Typography>
                </Box>

                {/* Main Content Container (Dark Style like Widget) */}
                <Box sx={{
                    backgroundColor: "#2c2d35",
                    color: "white",
                    border: "3px solid #000000",
                    borderRadius: "24px",
                    p: { xs: 2, md: 4 },
                    boxShadow: "8px 8px 0px #000000",
                    position: "relative"
                }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" py={10}>
                            <CircularProgress sx={{ color: "#2dd4bf" }} />
                        </Box>
                    ) : transactions.length === 0 ? (
                        <Box textAlign="center" py={8} px={2}>
                            <Typography fontWeight="bold" fontSize={18}>
                                {language === "es" ? "No hay movimientos" : "No transactions"}
                            </Typography>
                            <Typography mt={1} color="#9ca3af">
                                {language === "es" ? "Aún no has realizado ninguna operación." : "You haven't made any transactions yet."}
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {transactions.map((tx) => (
                                <Box
                                    key={tx.id}
                                    onClick={() => setSelectedTx(tx)}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        p: 2,
                                        borderRadius: "16px",
                                        backgroundColor: "rgba(255,255,255,0.05)", // Transparent Items
                                        border: "1px solid transparent",
                                        transition: "all 0.2s",
                                        cursor: "pointer",
                                        "&:hover": {
                                            backgroundColor: "rgba(255,255,255,0.1)",
                                            border: "1px solid rgba(255,255,255,0.2)",
                                        }
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: "50%",
                                                border: "2px solid #000000",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: tx.color,
                                            }}
                                        >
                                            {tx.type === "RECEIVE" ? (
                                                <SouthWest sx={{ color: "#15803d" }} />
                                            ) : (
                                                <NorthEast sx={{ color: "#b91c1c" }} />
                                            )}
                                        </Box>
                                        <Box>
                                            <Typography fontWeight="bold" fontSize={16}>
                                                {tx.type === "RECEIVE" ? (language === "es" ? "Recibido" : "Received") : (language === "es" ? "Enviado" : "Sent")}
                                            </Typography>
                                            <Typography fontSize={14} color="#9ca3af">
                                                {format(tx.date, "dd MMM, HH:mm", { locale: language === "es" ? es : undefined })}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box textAlign="right">
                                        <Typography
                                            fontWeight={900}
                                            fontSize={18}
                                            sx={{ color: tx.type === "RECEIVE" ? "#34d399" : "#fca5a5" }}
                                        >
                                            {tx.type === "RECEIVE" ? "+" : "-"}{parseFloat(tx.amount).toLocaleString("en-US", { maximumFractionDigits: 6 })} {tx.token}
                                        </Typography>
                                        <Typography fontSize={12} fontWeight="bold" sx={{ opacity: 0.6 }}>
                                            {tx.status}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    )}

                    {/* Pagination Controls */}
                    {!loading && (transactions.length > 0 || page > 1) && (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={4} pt={2} borderTop="1px solid rgba(255,255,255,0.1)">
                            <Button
                                disabled={page === 1}
                                onClick={handlePrev}
                                startIcon={<ChevronLeft />}
                                sx={{
                                    color: "white",
                                    fontWeight: "bold",
                                    "&:disabled": { opacity: 0.3, color: "white" }
                                }}
                            >
                                {language === "es" ? "Anterior" : "Previous"}
                            </Button>

                            <Typography fontWeight="bold" fontSize={14} color="#9ca3af">
                                {page} / {totalPages}
                            </Typography>

                            <Button
                                disabled={page >= totalPages}
                                onClick={handleNext}
                                endIcon={<ChevronRight />}
                                sx={{
                                    color: "white",
                                    fontWeight: "bold",
                                    "&:disabled": { opacity: 0.3, color: "white" }
                                }}
                            >
                                {language === "es" ? "Siguiente" : "Next"}
                            </Button>
                        </Box>
                    )}
                </Box>
            </Container>

            <TransactionDetailModal
                open={!!selectedTx}
                onClose={() => setSelectedTx(null)}
                transaction={selectedTx}
            />
        </Box>
    );
}
