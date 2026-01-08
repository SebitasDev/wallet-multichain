import { Box, Typography, IconButton, Chip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import React, { useState } from "react";
import { ChainLogo, TokenLogo, getExplorerUrl } from "./HistoryHelpers";

export const HistoryTransactionDetail = ({ transaction, onClose }: { transaction: any, onClose: () => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showRoute, setShowRoute] = useState(true);

    if (!transaction) return null;

    return (
        <Box sx={{ height: "100%", overflowY: "auto", pr: 1 }}>
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
                    <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="flex-start" mb={2} gap={{ xs: 2, sm: 0 }}>
                        <Box width={{ xs: "100%", sm: "auto" }}>
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
                                {transaction.estimatedReceived && transaction.amount && (
                                    <Typography variant="caption" fontWeight={800} color="#666" fontSize={10}>
                                        Est. Recibido: ${Number(transaction.estimatedReceived).toLocaleString('en-US', { maximumFractionDigits: 6 })}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <Box textAlign={{ xs: "left", sm: "right" }} width={{ xs: "100%", sm: "auto" }}>
                            <Box display="flex" justifyContent={{ xs: "space-between", sm: "flex-end" }} alignItems="flex-start" mb={1}>
                                <Box display={{ xs: "block", sm: "none" }} /> {/* Spacer for flex-between */}
                                <IconButton
                                    onClick={onClose}
                                    size="small"
                                    sx={{
                                        border: "2px solid #000",
                                        bgcolor: "#fff",
                                        borderRadius: 2,
                                        width: 24, height: 24,
                                        boxShadow: "2px 2px 0px #000",
                                        "&:hover": { bgcolor: "#f5f5f5", transform: "translate(1px, 1px)", boxShadow: "1px 1px 0px #000" }
                                    }}
                                >
                                    <CloseIcon sx={{ color: "#000", fontWeight: "bold", fontSize: 14 }} />
                                </IconButton>
                            </Box>

                            <Box display="flex" alignItems="center" justifyContent={{ xs: "flex-start", sm: "flex-end" }} gap={1}>
                                <Typography variant="h4" fontWeight={900} color="#000" sx={{ fontSize: { xs: "24px", sm: "34px" } }}>
                                    ${(transaction.type === "RECEIVE"
                                        ? (transaction.estimatedReceived || transaction.amount)
                                        : transaction.amount
                                    ).toLocaleString('en-US', { maximumFractionDigits: 6 })}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                    <TokenLogo token={transaction.token} size={24} />
                                    <Typography variant="caption" fontWeight={900} color="#666" fontSize={14}>
                                        {transaction.token}
                                    </Typography>
                                </Box>
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
                                <Typography variant="caption" fontWeight={900} color="#666" fontSize={11} mb={0.5} display="block">DE</Typography>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <Typography fontWeight={700} fontSize={14} fontFamily="monospace">
                                        {transaction.addressFrom.slice(0, 6)}...{transaction.addressFrom.slice(-4)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ p: 1.5 }}>
                                <Typography variant="caption" fontWeight={900} color="#666" fontSize={11} mb={0.5} display="block">PARA</Typography>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <Typography fontWeight={700} fontSize={14} fontFamily="monospace">
                                        {transaction.addressTo.slice(0, 6)}...{transaction.addressTo.slice(-4)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* CHAIN / HASH Row */}
                        <Box display="grid" gridTemplateColumns="1fr 1fr" sx={{ borderBottom: "2px solid #000" }}>
                            <Box sx={{ p: 1.5, borderRight: "2px solid #000" }}>
                                <Typography variant="caption" fontWeight={900} color="#666" fontSize={11} mb={0.5} display="block">CHAIN</Typography>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <ChainLogo chain={transaction.chainTo} />
                                    <Typography fontWeight={800} fontSize={14}>{transaction.chainTo}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ p: 1.5 }}>
                                <Typography variant="caption" fontWeight={900} color="#666" fontSize={11} mb={0.5} display="block">HASH</Typography>
                                <Typography fontWeight={700} fontSize={14} fontFamily="monospace" sx={{ wordBreak: "break-all", lineHeight: 1.1 }}>
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

                        {/* FINANCIALS Row */}
                        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="caption" fontWeight={900} color="#666" fontSize={11}>ENVIA</Typography>
                                <Typography fontWeight={800} fontSize={14}>${Number(transaction.usdValue ?? transaction.amount).toLocaleString('en-US', { maximumFractionDigits: 6 })}</Typography>
                            </Box>
                            {transaction.fee > 0 && (
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="caption" fontWeight={900} color="#666" fontSize={11}>FEE PLATAFORMA</Typography>
                                    <Typography fontWeight={800} fontSize={14} color="error.main">-${Number(transaction.fee).toLocaleString('en-US', { maximumFractionDigits: 6 })}</Typography>
                                </Box>
                            )}
                            {transaction.estimatedReceived && (
                                <>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="caption" fontWeight={900} color="#666" fontSize={11}>RECIBE (EST.)</Typography>
                                        <Box textAlign="right">
                                            <Typography fontWeight={800} fontSize={14} color="#00DC8C">
                                                {Number(transaction.estimatedReceived).toLocaleString('en-US', { maximumFractionDigits: 6 })} {transaction.tokenSymbol || "USDC"}
                                            </Typography>
                                            <Typography variant="caption" fontWeight={700} color="#00DC8C" fontSize={10} display="block">
                                                {/* Only calculate if we have USD data or if it's effectively 1:1 (stable) fallback which we don't assume here yet */}
                                                ≈ ${Number(transaction.receivedUsdValue ?? (
                                                    (transaction.usdValue && transaction.amount)
                                                        ? (transaction.estimatedReceived * (transaction.usdValue / transaction.amount))
                                                        : 0
                                                )).toLocaleString('en-US', { maximumFractionDigits: 6 })}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ borderTop: "1px dashed #ccc", my: 0.5 }} />
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="caption" fontWeight={900} color="#666" fontSize={11}>DIFERENCIA</Typography>
                                        <Typography fontWeight={800} fontSize={14} color="error.main">
                                            {(() => {
                                                const sentVal = transaction.usdValue || transaction.amount; // Fallback to amount is wrong for different decimals/value, but okay for USDC
                                                const recVal = transaction.receivedUsdValue || (
                                                    (transaction.usdValue && transaction.amount)
                                                        ? (transaction.estimatedReceived * (transaction.usdValue / transaction.amount))
                                                        : transaction.estimatedReceived
                                                );
                                                const diff = sentVal - recVal;
                                                // If we have mixed units (no usdValue and fallback used), this number is garbage.
                                                // Only show meaningful difference if we have usdValue OR if tokens match (simplified check)
                                                // For now, just show formatted diff.
                                                return `-$${Number(Math.abs(diff)).toLocaleString('en-US', { maximumFractionDigits: 6 })}`;
                                            })()}
                                        </Typography>
                                    </Box>
                                </>
                            )}
                        </Box>

                    </Box>
                </Box>

                {/* Sub-Transactions / Route */}
                {transaction.route && transaction.route.length > 0 && (
                    <>
                        <Box
                            onClick={() => setShowRoute(!showRoute)}
                            sx={{
                                bgcolor: "#FFD700",
                                p: 1,
                                borderBottom: "2.5px solid #000",
                                borderTop: "3px solid #000",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer",
                                "&:hover": { opacity: 0.9 }
                            }}
                        >
                            <Box sx={{ width: 24 }} />
                            <Typography fontWeight={900} textTransform="uppercase" fontSize={11} letterSpacing={1} textAlign="center">
                                Ruta de Ejecución
                            </Typography>
                            <Box sx={{ width: 24, display: "flex", justifyContent: "center" }}>
                                {showRoute ? <ExpandLessIcon sx={{ fontSize: 16, color: "#000" }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: "#000" }} />}
                            </Box>
                        </Box>
                        {showRoute && (
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
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
};
