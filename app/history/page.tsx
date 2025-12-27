"use client";

import { Box } from "@mui/material";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { useXOWalletStore } from "../store/useXOWalletStore";

import { HistoryTransactionList } from "./components/HistoryTransactionList";
import { HistoryMetrics } from "./components/HistoryMetrics";
import { HistoryTransactionDetail } from "./components/HistoryTransactionDetail";

export default function HistoryListPage() {
    const router = useRouter();
    const { mainWallet, xoWallet } = useXOWalletStore();
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
        totalFeesPaid: 0,
        weeklyActivity: [] as any[]
    });
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Prioritize XO Wallet address if available, otherwise fallback to Main Wallet
    const address = xoWallet?.address || mainWallet?.address;

    const handleRefresh = () => {
        setLoading(true);
        setRefreshTrigger(prev => prev + 1);
    };

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
                    const mapped = data.transactions.map((tx: any) => {
                        const cleanUserAddr = address.toLowerCase().startsWith('0x') ? address.toLowerCase().substring(0, 42) : address.toLowerCase();
                        const cleanTxFrom = tx.fromAddress.toLowerCase().startsWith('0x') ? tx.fromAddress.toLowerCase().substring(0, 42) : tx.fromAddress.toLowerCase();

                        const isSender = cleanTxFrom === cleanUserAddr;

                        return {
                            id: tx.id,
                            type: isSender ? "SEND" : "RECEIVE",
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
                            route: tx.route,
                            estimatedReceived: tx.estimatedReceived,
                            tokenSymbol: tx.tokenSymbol,
                            createdAt: tx.createdAt,
                            fee: tx.fee || 0
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
    }, [address, page, refreshTrigger]);


    // --- Monthly Chart Data (Current Week) ---
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 });
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });

    const weeklySendsData = weekDays.map(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayStat = stats.weeklyActivity.find((item: any) => item._id === dateStr);
        const dayTotal = dayStat ? dayStat.totalAmount : 0;
        const dayName = format(day, "eee", { locale: es });
        const formattedName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

        return {
            name: formattedName,
            value: dayTotal
        };
    });

    const selectedTx = transactions.find(t => t.id === selectedTxId);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f0f0f0", display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: { xs: 2, lg: 4 }, alignItems: "stretch" }}>

                    {/* LEFT COLUMN: Transactions List */}
                    <HistoryTransactionList
                        loading={loading}
                        transactions={transactions}
                        selectedTxId={selectedTxId}
                        setSelectedTxId={setSelectedTxId}
                        page={page}
                        totalPages={totalPages}
                        setPage={setPage}
                        handleRefresh={handleRefresh}
                    />

                    {/* DIVIDER LINE (Visible only on Desktop) */}
                    <Box sx={{ display: { xs: "none", lg: "block" }, width: "4px", bgcolor: "#000", opacity: 0.2, borderRadius: 1 }} />

                    {/* RIGHT COLUMN: Metrics OR Detail */}
                    <Box sx={{ flex: 1, minWidth: 0, width: "100%", pt: 12, px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
                        {selectedTx ? (
                            <HistoryTransactionDetail
                                transaction={selectedTx}
                                onClose={() => setSelectedTxId(null)}
                            />
                        ) : (
                            <HistoryMetrics
                                stats={stats}
                                weeklySendsData={weeklySendsData}
                            />
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
