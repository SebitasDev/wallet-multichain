"use client";

import { Box, Typography, Button, SwipeableDrawer, IconButton } from "@mui/material";
import { Close, ContentCopy, OpenInNew } from "@mui/icons-material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLanguageStore } from "@/app/store/useLanguageStore";
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

interface TransactionDetailModalProps {
    open: boolean;
    onClose: () => void;
    transaction: any;
}

const CoinIcon = ({ token, size = 32 }: { token: string, size?: number }) => {
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


export const TransactionDetailModal = ({ open, onClose, transaction }: TransactionDetailModalProps) => {
    const { language } = useLanguageStore();

    if (!transaction) return null;

    const isReceive = transaction.type === "RECEIVE";
    const color = isReceive ? "#34d399" : "#f87171"; // bright green / red
    const amountSign = isReceive ? "+" : "-";

    // ... (rest of component logic matches original, but I need to render existing parts correctly)
    // I am replacing from imports down to amount render, so I will reconstruct the beginning of component

    return (
        <SwipeableDrawer
            anchor="bottom"
            open={open}
            onClose={onClose}
            onOpen={() => { }}
            disableSwipeToOpen={true}
            PaperProps={{
                sx: {
                    borderTopLeftRadius: "24px",
                    borderTopRightRadius: "24px",
                    backgroundColor: "#1f2937", // Dark Slate
                    color: "white",
                    borderTop: "3px solid #000000",
                    borderLeft: "3px solid #000000",
                    borderRight: "3px solid #000000",
                    maxHeight: "90vh",
                    width: { xs: "100%", md: "400px" }, // Constrain width on desktop
                    margin: { md: "0 auto" }, // Center on desktop
                }
            }}
            ModalProps={{
                BackdropProps: {
                    sx: {
                        backdropFilter: "blur(8px)",
                        backgroundColor: "rgba(0,0,0,0.6)",
                    }
                }
            }}
        >
            <Box p={3} pb={4} display="flex" flexDirection="column" alignItems="center">
                {/* Drag Handle */}
                <Box
                    onClick={onClose} // Allow clicking handle to close too
                    sx={{
                        width: 40,
                        height: 4,
                        backgroundColor: "rgba(255,255,255,0.3)",
                        borderRadius: 2,
                        mb: 4,
                        cursor: "pointer"
                    }}
                />

                {/* Close Button (Desktop Only) */}
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        color: "rgba(255,255,255,0.5)",
                        display: { xs: "none", md: "inline-flex" },
                        "&:hover": {
                            color: "white",
                            backgroundColor: "rgba(255,255,255,0.1)"
                        }
                    }}
                >
                    <Close />
                </IconButton>

                {/* Amount */}
                <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                    <Typography
                        variant="h2"
                        fontWeight={900}
                        sx={{
                            color: color,
                            fontSize: "2.5rem",
                            textShadow: "2px 2px 0px #000000",
                            lineHeight: 1
                        }}
                    >
                        {amountSign}{transaction.amount} {transaction.token}
                    </Typography>
                    <CoinIcon token={transaction.token} size={40} />
                </Box>

                {/* Date */}
                {/* Date */}
                <Typography color="#9ca3af" fontSize={14} mb={4} fontWeight="medium">
                    {format(
                        transaction.date,
                        language === "es" ? "d 'de' MMMM 'de' yyyy, h:mm a" : "MMMM d, yyyy, h:mm a",
                        { locale: language === "es" ? es : undefined }
                    )}
                </Typography>

                {/* Cards Section */}
                <Box width="100%" display="flex" flexDirection="column" gap={2}>

                    {/* From / To Card */}
                    <Box
                        sx={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderRadius: "16px",
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            border: "1px solid rgba(255,255,255,0.1)"
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                backgroundColor: isReceive ? "#dcfce7" : "#fee2e2",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px solid #000000"
                            }}
                        >
                            <Typography fontWeight="bold" color="black" fontSize={18}>
                                {isReceive ? "↓" : "↑"}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography fontSize={12} color="#9ca3af" fontWeight="bold">
                                {isReceive ? (language === "es" ? "De" : "From") : (language === "es" ? "Para" : "To")}
                            </Typography>
                            <Typography fontSize={14} fontWeight="bold" sx={{ wordBreak: "break-all" }}>
                                {isReceive
                                    ? (transaction.fromAddress || "Unknown")
                                    : (transaction.toAddress || "Unknown")}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Status Card */}
                    <Box
                        sx={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderRadius: "16px",
                            p: 2,
                            border: "1px solid rgba(255,255,255,0.1)"
                        }}
                    >
                        <Typography fontSize={12} color="#9ca3af" fontWeight="bold" mb={0.5}>
                            {language === "es" ? "Estado" : "Status"}
                        </Typography>
                        <Typography fontSize={16} fontWeight="bold" sx={{ textTransform: "capitalize" }}>
                            {transaction.status}
                        </Typography>
                    </Box>

                </Box>

                {/* Blockchain Action */}
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<OpenInNew />}
                    sx={{
                        mt: 4,
                        borderColor: "rgba(255,255,255,0.2)",
                        color: "white",
                        borderRadius: "12px",
                        py: 1.5,
                        textTransform: "none",
                        fontWeight: "bold",
                        "&:hover": {
                            borderColor: "white",
                            backgroundColor: "rgba(255,255,255,0.05)"
                        }
                    }}
                    onClick={() => {
                        if (transaction.hash) {
                            window.open(`https://etherscan.io/tx/${transaction.hash}`, "_blank");
                        }
                    }}
                >
                    {language === "es" ? "Recibo de blockchain" : "Blockchain Receipt"}
                </Button>

            </Box>
        </SwipeableDrawer>
    );
};
