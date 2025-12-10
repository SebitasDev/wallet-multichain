"use client";

import { Box, Button, Typography, Stack } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import KeyIcon from "@mui/icons-material/Key";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

type Props = {
    onAddWallet: () => void;
    onGenerateWallet?: () => void;
};

export function EmptyState({ onAddWallet, onGenerateWallet }: Props) {
    return (
        <Box
            sx={{
                maxWidth: 560,
                mx: "auto",
                textAlign: "center",
                py: { xs: 6, md: 8 },
                px: 3,
            }}
        >
            {/* Icon */}
            <Box
                sx={{
                    width: 100,
                    height: 100,
                    borderRadius: "28px",
                    background: "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 4,
                    position: "relative",
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        inset: -2,
                        borderRadius: "30px",
                        padding: "2px",
                        background: "linear-gradient(135deg, rgba(14, 165, 233, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)",
                        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        maskComposite: "xor",
                        WebkitMaskComposite: "xor",
                    },
                }}
            >
                <AccountBalanceWalletIcon
                    sx={{
                        fontSize: 48,
                        color: "#0ea5e9",
                    }}
                />
            </Box>

            {/* Text */}
            <Typography
                sx={{
                    fontSize: { xs: "24px", md: "28px" },
                    fontWeight: 800,
                    color: "#f1f5f9",
                    mb: 1.5,
                    letterSpacing: "-0.02em",
                }}
            >
                No wallets connected yet
            </Typography>
            <Typography
                sx={{
                    fontSize: "15px",
                    color: "#94a3b8",
                    mb: 4,
                    maxWidth: 400,
                    mx: "auto",
                    lineHeight: 1.6,
                }}
            >
                Add your first wallet to start tracking your multichain portfolio. Import an existing wallet or generate a new one.
            </Typography>

            {/* Action Cards */}
            <Stack spacing={2}>
                {/* Import Wallet Option */}
                <Box
                    onClick={onAddWallet}
                    sx={{
                        p: 2.5,
                        borderRadius: "16px",
                        background: "linear-gradient(145deg, #0f1729 0%, #131c2d 100%)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        cursor: "pointer",
                        transition: "all 0.25s ease",
                        "&:hover": {
                            transform: "translateY(-2px)",
                            border: "1px solid rgba(14, 165, 233, 0.3)",
                            boxShadow: "0 8px 32px rgba(14, 165, 233, 0.15)",
                        },
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Box
                            sx={{
                                width: 52,
                                height: 52,
                                borderRadius: "14px",
                                background: "linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <KeyIcon sx={{ fontSize: 26, color: "#0ea5e9" }} />
                        </Box>
                        <Box sx={{ textAlign: "left", flex: 1 }}>
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: "16px",
                                    color: "#f1f5f9",
                                    mb: 0.25,
                                }}
                            >
                                Import with seed phrase
                            </Typography>
                            <Typography sx={{ fontSize: "13px", color: "#64748b" }}>
                                12 or 24 word recovery phrase
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: "10px",
                                background: "rgba(255, 255, 255, 0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <AddIcon sx={{ fontSize: 20, color: "#64748b" }} />
                        </Box>
                    </Stack>
                </Box>

                {/* Generate New Wallet Option */}
                {onGenerateWallet && (
                    <Box
                        onClick={onGenerateWallet}
                        sx={{
                            p: 2.5,
                            borderRadius: "16px",
                            background: "linear-gradient(145deg, #0f1729 0%, #131c2d 100%)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            cursor: "pointer",
                            transition: "all 0.25s ease",
                            "&:hover": {
                                transform: "translateY(-2px)",
                                border: "1px solid rgba(139, 92, 246, 0.3)",
                                boxShadow: "0 8px 32px rgba(139, 92, 246, 0.15)",
                            },
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Box
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: "14px",
                                    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <AutoAwesomeIcon sx={{ fontSize: 26, color: "#8b5cf6" }} />
                            </Box>
                            <Box sx={{ textAlign: "left", flex: 1 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: "16px",
                                        color: "#f1f5f9",
                                        mb: 0.25,
                                    }}
                                >
                                    Generate new wallet
                                </Typography>
                                <Typography sx={{ fontSize: "13px", color: "#64748b" }}>
                                    Create a fresh address instantly
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "10px",
                                    background: "rgba(255, 255, 255, 0.06)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <AddIcon sx={{ fontSize: 20, color: "#64748b" }} />
                            </Box>
                        </Stack>
                    </Box>
                )}
            </Stack>

            {/* Help Text */}
            <Typography
                sx={{
                    fontSize: "13px",
                    color: "#475569",
                    mt: 4,
                }}
            >
                Your seed phrase is encrypted locally and never leaves your device.
            </Typography>
        </Box>
    );
}
