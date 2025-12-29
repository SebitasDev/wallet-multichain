"use client";

import { Box, Typography, Button, List, ListItem, ListItemText, ListItemAvatar, CircularProgress, IconButton } from "@mui/material";
import { NorthEast, SouthWest, Refresh } from "@mui/icons-material";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";
import { UsdtIcon } from "@/app/components/atoms/UsdtIcon";
import { EthIcon } from "@/app/components/atoms/EthIcon";
import { BnbIcon } from "@/app/components/atoms/BnbIcon";
import { AvalancheIcon } from "@/app/components/atoms/AvalancheIcon";
import PolygonIcon from "@/app/components/atoms/PolygonIcon";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import { StellarIcon } from "@/app/components/atoms/StellarIcon";
import { WorldChainIcon } from "@/app/components/atoms/WorldChainIcon";
import { useLanguageStore } from "@/app/store/useLanguageStore";
import { useRouter } from "next/navigation";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { transactionsApi } from "@/app/services/api";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TransactionDetailModal } from "../history/components/TransactionDetailModal";

const CoinIcon = ({ token, size = 20 }: { token: string, size?: number }) => {
    switch (token.toUpperCase()) {
        case "USDC": return <UsdcIcon size={size} />;
        case "USDT": return <UsdtIcon size={size} />;
        case "ETH": return <EthIcon size={size} />;
        case "BNB": return <BnbIcon size={size} />;
        case "AVAX": return <AvalancheIcon size={size} />;
        case "MATIC":
        case "POL": return <PolygonIcon size={size} />;
        case "ARB": return <ArbIcon size={size} />;
        case "OP": return <OPIcon size={size} />;
        case "XLM": return <StellarIcon size={size} />;
        case "WLD": return <WorldChainIcon size={size} />;
        default: return null;
    }
};

export function TransactionHistory() {
    const { language } = useLanguageStore();
    const router = useRouter();
    const { mainWallet, xoWallet } = useXOWalletStore();
    const address = xoWallet?.address || mainWallet?.address;

    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState<any | null>(null);

    const fetchRecent = useCallback(async () => {
        if (!address) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await transactionsApi.getAll({ address, page: 1, limit: 3 });
            if (data.success && data.transactions) {
                const mapped = data.transactions.map((tx: any) => {
                    const cleanUserAddr = address.toLowerCase();
                    const cleanTxFrom = tx.fromAddress.toLowerCase();
                    const isSender = cleanTxFrom === cleanUserAddr;

                    return {
                        id: tx.id,
                        type: isSender ? "SEND" : "RECEIVE",
                        title: isSender ? (language === "es" ? "Enviado" : "Sent") : (language === "es" ? "Recibido" : "Received"),
                        time: format(new Date(tx.createdAt), "dd MMM", { locale: language === "es" ? es : undefined }),
                        date: new Date(tx.createdAt), // For modal
                        amount: tx.totalAmount,
                        token: tx.tokenSymbol || "USDC",
                        color: isSender ? "#fee2e2" : "#dcfce7",
                        status: tx.status,
                        hash: tx.hash,
                        fromAddress: tx.fromAddress,
                        toAddress: tx.toAddress
                    };
                });
                setTransactions(mapped);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [address, language]);

    useEffect(() => {
        fetchRecent();
    }, [fetchRecent]);

    return (
        <Box
            id="common-transactions"
            sx={{
                backgroundColor: "#2c2d35",
                color: "white",
                border: "3px solid #000000",
                borderRadius: "24px",
                p: 3,
                boxShadow: "8px 8px 0px #000000",
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6" fontWeight="bold">
                        {language === "es" ? "Actividad reciente" : "Recent Activity"}
                    </Typography>
                    <IconButton
                        onClick={fetchRecent}
                        disabled={loading}
                        size="small"
                        sx={{
                            color: "rgba(255,255,255,0.5)",
                            "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.1)" },
                        }}
                    >
                        <Refresh
                            sx={{
                                fontSize: 20,
                                animation: loading ? "spin 1s linear infinite" : "none",
                                "@keyframes spin": {
                                    "0%": { transform: "rotate(0deg)" },
                                    "100%": { transform: "rotate(360deg)" }
                                }
                            }}
                        />
                    </IconButton>
                </Box>
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => router.push("/common-people/history")}
                    sx={{
                        backgroundColor: "#4b5563",
                        color: "white",
                        border: "2px solid #000000",
                        fontWeight: "bold",
                        textTransform: "none",
                        borderRadius: "8px",
                        boxShadow: "none",
                        "&:hover": {
                            backgroundColor: "#374151",
                            boxShadow: "none",
                        },
                    }}
                >
                    {language === "es" ? "Ver más" : "View more"}
                </Button>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} sx={{ color: "white" }} />
                </Box>
            ) : transactions.length === 0 ? (
                <Typography fontSize={14} color="gray" textAlign="center" py={2}>
                    {language === "es" ? "Sin movimientos recientes" : "No recent activity"}
                </Typography>
            ) : (
                <List disablePadding>
                    {transactions.map((tx) => (
                        <ListItem
                            key={tx.id}
                            disableGutters
                            onClick={() => setSelectedTx(tx)}
                            sx={{
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                                "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    borderRadius: "12px",
                                },
                                px: 1,
                            }}
                        >
                            <ListItemAvatar>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        backgroundColor: tx.color,
                                        borderRadius: "50%",
                                        border: "2px solid #000000",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {tx.type === "RECEIVE" ? (
                                        <SouthWest sx={{ fontSize: 24, color: "#15803d" }} />
                                    ) : (
                                        <NorthEast sx={{ fontSize: 24, color: "#b91c1c" }} />
                                    )}
                                </Box>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Typography fontWeight="bold" fontSize={16}>
                                        {tx.title}
                                    </Typography>
                                }
                                secondary={
                                    <Typography fontSize={14} color="#9ca3af" fontWeight="medium">
                                        {tx.time}
                                    </Typography>
                                }
                            />
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography
                                    sx={{
                                        color: tx.type === "RECEIVE" ? "#34d399" : "#fca5a5",
                                        fontWeight: "bold",
                                        fontSize: 18,
                                    }}
                                >
                                    {tx.type === "RECEIVE" ? "+" : "-"}{parseFloat(tx.amount).toLocaleString("en-US", { maximumFractionDigits: 6 })} {tx.token}
                                </Typography>
                                <CoinIcon token={tx.token} size={20} />
                            </Box>
                        </ListItem>
                    ))}
                </List>
            )}

            <TransactionDetailModal
                open={!!selectedTx}
                onClose={() => setSelectedTx(null)}
                transaction={selectedTx}
            />
        </Box>
    );
}
