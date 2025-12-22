"use client";

import { Box, Typography, Chip, IconButton, Avatar } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LinkIcon from "@mui/icons-material/Link";
import { useRouter, useParams } from "next/navigation";
import React from "react";
import { MOCK_TRANSACTIONS, CHAIN_LOGOS } from "../../lib/mockData";

// HELPER: Component to render chain logo with fallback
const ChainLogo = ({ chain }: { chain: string }) => {
    const logoUrl = CHAIN_LOGOS[chain];

    if (logoUrl) {
        return <Avatar src={logoUrl} sx={{ width: 16, height: 16 }} />;
    }

    // Fallback if logo not found
    return (
        <Avatar sx={{ width: 16, height: 16, bgcolor: "#333" }}>
            <LinkIcon sx={{ fontSize: 10, color: "#fff" }} />
        </Avatar>
    );
};

export default function TransactionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    // Find transaction by ID
    const transaction = MOCK_TRANSACTIONS.find(t => t.id === id);

    if (!transaction) {
        return (
            <Box sx={{ minHeight: "100vh", backgroundColor: "#f0f0f0", p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Typography variant="h5" fontWeight={900} mb={2}>Transacción no encontrada 😕</Typography>
                <IconButton onClick={() => router.back()} sx={{ border: "2px solid #000" }}>
                    <ArrowBackIcon />
                </IconButton>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#f0f0f0", p: { xs: 2, sm: 3 } }}>
            {/* Header / Back Button */}
            <Box sx={{ maxWidth: 500, mx: "auto", mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton
                    onClick={() => router.back()}
                    sx={{
                        border: "2.5px solid #000",
                        bgcolor: "#fff",
                        borderRadius: 2,
                        width: 40, height: 40,
                        boxShadow: "2px 2px 0px #000",
                        "&:hover": { bgcolor: "#f5f5f5", transform: "translate(1px, 1px)", boxShadow: "1px 1px 0px #000" }
                    }}
                >
                    <ArrowBackIcon sx={{ color: "#000", fontWeight: "bold", fontSize: 20 }} />
                </IconButton>
                <Typography variant="h6" fontWeight={900} sx={{ textTransform: "uppercase", letterSpacing: 1, fontSize: { xs: 18, sm: 20 } }}>
                    Detalle
                </Typography>
            </Box>

            {/* Transaction Card */}
            <Box
                sx={{
                    maxWidth: 500,
                    mx: "auto",
                    bgcolor: "#fff",
                    border: "2.5px solid #000",
                    borderRadius: 3,
                    boxShadow: "4px 4px 0px #000",
                    overflow: "hidden"
                }}
            >
                {/* Header Section */}
                <Box sx={{ p: { xs: 3, sm: 2.5 }, borderBottom: "2.5px solid #000", bgcolor: "#fff" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
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
                                        border: "2px solid #000",
                                        boxShadow: "1.5px 1.5px 0px #000",
                                        fontSize: 10,
                                        height: 22
                                    }}
                                />
                                <Typography variant="subtitle1" fontWeight={800} fontSize={14}>
                                    {transaction.type === "SEND" ? "Envío" : transaction.type === "RECEIVE" ? "Recepción" : "Operación"} de {transaction.token}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="#666" fontWeight={700} fontFamily="monospace" fontSize={11}>
                                ID: {transaction.id.slice(0, 12)}...
                            </Typography>
                        </Box>
                        <Box textAlign="right">
                            <Typography variant="h4" fontWeight={900} fontSize={{ xs: 22, sm: 24 }}>
                                ${transaction.amount.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" fontWeight={700} color="#666" fontSize={11}>
                                {transaction.token}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Details Grid */}
                    <Box
                        display="grid"
                        gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
                        gap={1.5}
                        sx={{
                            bgcolor: "#f8f8f8",
                            p: 1.5,
                            border: "2px solid #000",
                            borderRadius: 2
                        }}
                    >
                        <Box>
                            <Typography variant="caption" fontWeight={700} color="#666" fontSize={10}>DE</Typography>
                            <Typography fontWeight={700} fontSize={{ xs: 14, sm: 13 }}>{transaction.addressFrom}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" fontWeight={700} color="#666" fontSize={10}>PARA</Typography>
                            <Typography fontWeight={700} fontSize={{ xs: 14, sm: 13 }}>{transaction.addressTo}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" fontWeight={700} color="#666" fontSize={10}>CHAIN</Typography>
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <ChainLogo chain={transaction.chainTo} />
                                <Typography fontWeight={700} fontSize={{ xs: 14, sm: 13 }}>{transaction.chainTo}</Typography>
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="caption" fontWeight={700} color="#666" fontSize={10}>HASH</Typography>
                            <Typography fontWeight={700} sx={{ wordBreak: "break-all", fontFamily: "monospace", fontSize: 10 }}>
                                {transaction.txHash.slice(0, 16)}...
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Routes / Sub-transactions */}
                {transaction.route && transaction.route.length > 0 && (
                    <>
                        <Box sx={{ bgcolor: "#FFD700", p: 1.5, borderBottom: "2.5px solid #000" }}>
                            <Typography fontWeight={900} textTransform="uppercase" fontSize={11} letterSpacing={0.5}>
                                Ruta de Ejecución
                            </Typography>
                        </Box>

                        <Box>
                            {transaction.route.map((routeItem, index) => (
                                <Box key={index} sx={{ borderBottom: index !== transaction.route.length - 1 ? "2px solid #000" : "none" }}>
                                    {routeItem.chains.map((chain, chainIndex) => (
                                        <Box key={chainIndex} sx={{ p: { xs: 2.5, sm: 1.5 }, display: "flex", alignItems: "center", justifyContent: "space-between", "&:hover": { bgcolor: "#fff9c4" } }}>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Box
                                                    sx={{
                                                        width: 32, height: 32,
                                                        borderRadius: "50%",
                                                        bgcolor: "#3CD2FF",
                                                        border: "2px solid #000",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontWeight: 900,
                                                        fontSize: 13
                                                    }}
                                                >
                                                    {index + 1}
                                                </Box>
                                                <Box>
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <ChainLogo chain={chain.name} />
                                                        <Typography fontWeight={800} fontSize={{ xs: 16, sm: 14 }}>
                                                            {chain.name}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" fontWeight={600} fontFamily="monospace" color="#666" fontSize={{ xs: 11, sm: 10 }}>
                                                        {chain.txHash}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box textAlign="right">
                                                <Typography fontWeight={800} fontSize={{ xs: 16, sm: 14 }}>
                                                    ${chain.amount}
                                                </Typography>
                                                <Chip
                                                    label={chain.status}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: chain.status === "SUCCESS" ? "#00DC8C" : "#FFD700",
                                                        fontWeight: 800,
                                                        border: "1.5px solid #000",
                                                        fontSize: 10,
                                                        height: 20,
                                                        mt: 0.5
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ))}
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}
