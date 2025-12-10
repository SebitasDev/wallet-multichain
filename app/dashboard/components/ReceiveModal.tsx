"use client";

import {
    Box,
    Button,
    Dialog,
    DialogContent,
    MenuItem,
    Stack,
    TextField,
    Typography,
    IconButton,
} from "@mui/material";
import QRCode from "react-qr-code";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import ShareOutlined from "@mui/icons-material/ShareOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadIcon from "@mui/icons-material/Download";
import { BaseIcon } from "@/app/components/atoms/BaseIcon";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import { AvalancheIcon } from "@/app/components/atoms/AvalancheIcon";
import { UnichainIcon } from "@/app/components/atoms/UnichainIcon";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { WalletInfo } from "@/app/store/useWalletManager";
import PolygonIcon from "@/app/components/atoms/PolygonIcon";

type Props = {
    open: boolean;
    wallets: WalletInfo[];
    onClose: () => void;
};

// All supported chains - EVM addresses work across all of them
const supportedChains = [
    { id: "base", label: "Base", icon: <BaseIcon />, color: "#0052ff" },
    { id: "optimism", label: "Optimism", icon: <OPIcon />, color: "#ff0420" },
    { id: "arbitrum", label: "Arbitrum", icon: <ArbIcon />, color: "#28a0f0" },
    { id: "polygon", label: "Polygon", icon: <PolygonIcon />, color: "#8247e5" },
    { id: "avalanche", label: "Avalanche", icon: <AvalancheIcon />, color: "#e84142" },
    { id: "unichain", label: "Unichain", icon: <UnichainIcon />, color: "#ff007a" },
];

export function ReceiveModal({ open, wallets, onClose }: Props) {
    const [selectedWallet, setSelectedWallet] = useState<string>("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (open && wallets.length) {
            setSelectedWallet(wallets[0].address);
            setCopied(false);
        }
    }, [open, wallets]);

    const currentWallet = useMemo(() => {
        return wallets.find((w) => w.address === selectedWallet) ?? wallets[0];
    }, [selectedWallet, wallets]);

    const currentAddress = currentWallet?.address ?? "";

    const copyToClipboard = async (value: string) => {
        if (!value) {
            toast.error("No address to copy");
            return;
        }
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
                setCopied(true);
                toast.success("Address copied to clipboard!");
                setTimeout(() => setCopied(false), 2000);
                return;
            }
        } catch {
            // fallback
        }
        const manual = window.prompt("Copy and paste:", value);
        if (manual !== null) {
            toast.success("Address copied!");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (!currentAddress) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "My Wallet Address",
                    text: `Send crypto to my address: ${currentAddress}`,
                });
            } catch {
                // User cancelled or not supported
            }
        } else {
            copyToClipboard(currentAddress);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "20px",
                    overflow: "hidden",
                    background: "linear-gradient(145deg, #0f1729 0%, #131c2d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 32px 64px rgba(0, 0, 0, 0.5)",
                    maxWidth: "440px",
                },
            }}
            slotProps={{
                backdrop: {
                    sx: {
                        backdropFilter: "blur(8px)",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                    },
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <DownloadIcon sx={{ color: "#10b981", fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "17px", color: "#f1f5f9" }}>
                            Receive Funds
                        </Typography>
                        <Typography sx={{ fontSize: "13px", color: "#64748b" }}>
                            Scan QR or copy address
                        </Typography>
                    </Box>
                </Stack>
                <IconButton
                    onClick={onClose}
                    sx={{
                        color: "#64748b",
                        "&:hover": { color: "#f1f5f9", background: "rgba(255,255,255,0.08)" },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: 3, py: 3 }}>
                <Stack spacing={3}>
                    {/* Wallet Selector */}
                    {wallets.length > 1 && (
                        <TextField
                            select
                            label="Select Wallet"
                            fullWidth
                            size="small"
                            value={selectedWallet}
                            onChange={(e) => setSelectedWallet(e.target.value)}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "12px",
                                    background: "rgba(255, 255, 255, 0.04)",
                                    color: "#f1f5f9",
                                    "& fieldset": {
                                        borderColor: "rgba(255, 255, 255, 0.1)",
                                    },
                                    "&:hover fieldset": {
                                        borderColor: "rgba(255, 255, 255, 0.2)",
                                    },
                                    "&.Mui-focused fieldset": {
                                        borderColor: "#0ea5e9",
                                    },
                                },
                                "& .MuiInputLabel-root": {
                                    color: "#64748b",
                                },
                                "& .MuiSelect-icon": {
                                    color: "#64748b",
                                },
                            }}
                        >
                            {wallets.map((w) => (
                                <MenuItem
                                    key={w.address}
                                    value={w.address}
                                    sx={{
                                        color: "#f1f5f9",
                                        "&:hover": { background: "rgba(255,255,255,0.08)" },
                                        "&.Mui-selected": { background: "rgba(14, 165, 233, 0.15)" },
                                    }}
                                >
                                    {w.name} — {w.address.slice(0, 6)}...{w.address.slice(-4)}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}

                    {/* QR Code Section */}
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        {/* QR Code Container */}
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: "20px",
                                background: "#ffffff",
                                boxShadow: "0 8px 32px rgba(14, 165, 233, 0.2)",
                            }}
                        >
                            <QRCode
                                value={currentAddress || "0x0000000000000000000000000000000000000000"}
                                size={180}
                                fgColor="#0f172a"
                                bgColor="#ffffff"
                                level="M"
                            />
                        </Box>

                        {/* Wallet Name */}
                        {currentWallet && (
                            <Typography
                                sx={{
                                    mt: 2,
                                    fontWeight: 600,
                                    fontSize: "15px",
                                    color: "#f1f5f9",
                                }}
                            >
                                {currentWallet.name}
                            </Typography>
                        )}

                        {/* Address Display */}
                        <Box
                            sx={{
                                mt: 1.5,
                                px: 2,
                                py: 1,
                                borderRadius: "10px",
                                background: "rgba(255, 255, 255, 0.04)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                maxWidth: "100%",
                                overflow: "hidden",
                            }}
                        >
                            <Typography
                                component="code"
                                sx={{
                                    fontSize: "13px",
                                    color: "#0ea5e9",
                                    fontFamily: "var(--font-mono), monospace",
                                    wordBreak: "break-all",
                                    textAlign: "center",
                                    display: "block",
                                }}
                            >
                                {currentAddress || "0x..."}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Supported Chains Info */}
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: "12px",
                            background: "rgba(16, 185, 129, 0.08)",
                            border: "1px solid rgba(16, 185, 129, 0.15)",
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                            <CheckCircleIcon sx={{ fontSize: 18, color: "#10b981" }} />
                            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#10b981" }}>
                                Same address on all EVM chains
                            </Typography>
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {supportedChains.map((chain) => (
                                <Stack
                                    key={chain.id}
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                    sx={{
                                        px: 1.25,
                                        py: 0.5,
                                        borderRadius: "8px",
                                        background: "rgba(255, 255, 255, 0.06)",
                                        border: "1px solid rgba(255, 255, 255, 0.08)",
                                    }}
                                >
                                    <Box sx={{ display: "flex", "& svg": { width: 16, height: 16 } }}>
                                        {chain.icon}
                                    </Box>
                                    <Typography sx={{ fontSize: "12px", color: "#94a3b8" }}>
                                        {chain.label}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1.5}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={
                                copied ? (
                                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                                ) : (
                                    <ContentCopyOutlined sx={{ fontSize: 18 }} />
                                )
                            }
                            onClick={() => copyToClipboard(currentAddress)}
                            sx={{
                                textTransform: "none",
                                py: 1.25,
                                borderRadius: "12px",
                                fontWeight: 700,
                                fontSize: "14px",
                                background: copied
                                    ? "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)"
                                    : "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
                                boxShadow: copied
                                    ? "0 4px 20px rgba(16, 185, 129, 0.4)"
                                    : "0 4px 20px rgba(14, 165, 233, 0.35)",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    background: copied
                                        ? "linear-gradient(135deg, #059669 0%, #0891b2 100%)"
                                        : "linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)",
                                },
                            }}
                        >
                            {copied ? "Copied!" : "Copy Address"}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<ShareOutlined sx={{ fontSize: 18 }} />}
                            onClick={handleShare}
                            sx={{
                                textTransform: "none",
                                py: 1.25,
                                px: 2.5,
                                borderRadius: "12px",
                                fontWeight: 700,
                                fontSize: "14px",
                                color: "#f1f5f9",
                                borderColor: "rgba(255, 255, 255, 0.15)",
                                "&:hover": {
                                    borderColor: "rgba(255, 255, 255, 0.25)",
                                    background: "rgba(255, 255, 255, 0.06)",
                                },
                            }}
                        >
                            Share
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
