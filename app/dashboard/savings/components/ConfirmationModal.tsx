"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    CircularProgress,
} from "@mui/material";
import { SavingsChainKey, getSavingsChainConfig } from "@/app/savings/config";
import { NETWORKS } from "@/app/constants/chainsInformation";

interface ConfirmationModalProps {
    open: boolean;
    type: "deposit" | "withdraw";
    chain: SavingsChainKey;
    amount: string;
    isLoading: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function ConfirmationModal({
    open,
    type,
    chain,
    amount,
    isLoading,
    onClose,
    onConfirm,
}: ConfirmationModalProps) {
    const chainConfig = getSavingsChainConfig(chain);
    const networkConfig = NETWORKS[chain];

    const getChainIcon = () => {
        return networkConfig.icon;
    };

    return (
        <Dialog
            open={open}
            onClose={isLoading ? undefined : onClose}
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    border: "3px solid #000000",
                    boxShadow: "8px 8px 0px #000000",
                    background: "#ffffff",
                    maxWidth: 400,
                    width: "100%",
                },
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    background: type === "deposit" ? "#7852FF" : "#ff4444",
                    borderBottom: "3px solid #000000",
                    color: "#ffffff",
                    py: 2,
                    px: 3,
                }}
            >
                <Typography
                    sx={{
                        fontSize: 20,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                    }}
                >
                    Confirm {type === "deposit" ? "Deposit" : "Withdrawal"}
                </Typography>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ p: 3 }}>
                {/* Amount Display */}
                <Box
                    sx={{
                        background: "#f5f5f5",
                        border: "2px solid #000000",
                        borderRadius: 3,
                        p: 3,
                        textAlign: "center",
                        mb: 3,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#666666",
                            textTransform: "uppercase",
                            mb: 1,
                        }}
                    >
                        {type === "deposit" ? "You are depositing" : "You are withdrawing"}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: 32,
                            fontWeight: 900,
                            color: "#000000",
                        }}
                    >
                        ${parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#666666",
                        }}
                    >
                        USDC
                    </Typography>
                </Box>

                {/* Chain Info */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        p: 2,
                        mb: 2,
                    }}
                >
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Chain:</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                            sx={{
                                width: 24,
                                height: 24,
                                borderRadius: 1,
                                background: chainConfig.chipColor,
                                border: "2px solid #000000",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                "& svg": { width: 14, height: 14 },
                            }}
                        >
                            {getChainIcon()}
                        </Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{chain}</Typography>
                    </Box>
                </Box>

                {/* Estimated Gas */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        p: 2,
                        mb: 2,
                    }}
                >
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Est. Gas:</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                        ~{networkConfig.aproxFromFee} {networkConfig.chipLabel}
                    </Typography>
                </Box>

                {/* Vault Info */}
                <Box
                    sx={{
                        background:
                            type === "deposit"
                                ? "rgba(120, 82, 255, 0.1)"
                                : "rgba(255, 68, 68, 0.1)",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        p: 2,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#666666",
                            textAlign: "center",
                        }}
                    >
                        {type === "deposit"
                            ? "Your USDC will be deposited into Spark.fi sUSDC vault and will earn ~4.50% APY"
                            : "Your sUSDC shares will be converted back to USDC and sent to your wallet"}
                    </Typography>
                </Box>

                {/* Loading State */}
                {isLoading && (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                            mt: 3,
                            py: 2,
                        }}
                    >
                        <CircularProgress size={40} sx={{ color: "#7852FF" }} />
                        <Typography
                            sx={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#666666",
                                textAlign: "center",
                            }}
                        >
                            {type === "deposit" ? "Processing deposit..." : "Processing withdrawal..."}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: 12,
                                color: "#999999",
                                textAlign: "center",
                            }}
                        >
                            Please wait for the transaction to complete
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            {/* Actions */}
            {!isLoading && (
                <DialogActions
                    sx={{
                        p: 3,
                        pt: 0,
                        gap: 2,
                    }}
                >
                    <Button
                        onClick={onClose}
                        sx={{
                            flex: 1,
                            background: "#ffffff",
                            color: "#000000",
                            border: "3px solid #000000",
                            borderRadius: 2,
                            boxShadow: "4px 4px 0px #000000",
                            py: 1.5,
                            fontWeight: 900,
                            fontSize: 14,
                            textTransform: "uppercase",
                            "&:hover": {
                                background: "#f5f5f5",
                                transform: "translate(2px, 2px)",
                                boxShadow: "2px 2px 0px #000000",
                            },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        sx={{
                            flex: 1,
                            background: type === "deposit" ? "#7852FF" : "#ff4444",
                            color: "#ffffff",
                            border: "3px solid #000000",
                            borderRadius: 2,
                            boxShadow: "4px 4px 0px #000000",
                            py: 1.5,
                            fontWeight: 900,
                            fontSize: 14,
                            textTransform: "uppercase",
                            "&:hover": {
                                background: type === "deposit" ? "#6642EE" : "#ff3333",
                                transform: "translate(2px, 2px)",
                                boxShadow: "2px 2px 0px #000000",
                            },
                        }}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
}
