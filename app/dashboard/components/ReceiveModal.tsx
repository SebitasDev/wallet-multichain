"use client";

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    MenuItem,
    Stack,
    TextField,
    Typography,
    IconButton,
} from "@mui/material";
import QRCode from "react-qr-code";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import { BaseIcon } from "@/app/components/atoms/BaseIcon";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import {useEffect, useMemo, useState} from "react";
import { toast } from "react-toastify";
import { WalletInfo } from "@/app/store/useWalletManager";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import PolygonIcon from "@/app/components/atoms/PolygonIcon";
import { UnichainIcon } from "@/app/components/atoms/UnichainIcon";

type Props = {
    open: boolean;
    wallets: WalletInfo[];
    onClose: () => void;
};

const chains = [
    { id: "base", label: "Base", icon: <BaseIcon /> },
    { id: "optimism", label: "Optimism", icon: <OPIcon /> },
    { id: "arbitrum", label: "Arbitrum", icon: <ArbIcon /> },
    { id: "polygon", label: "Polygon", icon: <PolygonIcon /> },
    { id: "unichain", label: "Unichain", icon: <UnichainIcon /> },
];

export function ReceiveModal({
                                 open,
                                 wallets,
                                 onClose,
                             }: Props) {
    const [selectedWallet, setSelectedWallet] = useState<string>("");
    const [selectedChain, setSelectedChain] = useState<string>("base");

    useEffect(() => {
        if (open && wallets.length) {
            setSelectedWallet(wallets[0].address);
            setSelectedChain("base");
        }
    }, [open, wallets]);

    const currentAddress = useMemo(() => {
        const found = wallets.find((w) => w.address === selectedWallet) ?? wallets[0];
        return found?.address ?? "";
    }, [selectedWallet, wallets]);

    const currentChain =
        chains.find((c) => c.id === selectedChain) || chains[0];

    const qrValue = currentAddress
        ? `${currentAddress}`
        : "ethereum:0x0000000000000000000000000000000000000000";

    const copyToClipboard = async (value: string) => {
        if (!value) {
            toast.error("No hay address para copiar");
            return;
        }
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
                toast.success("Address copiado");
                return;
            }
        } catch {
            // fallback abajo
        }
        const manual = window.prompt("Copia y pega:", value);
        if (manual !== null) toast.success("Address copiado");
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    overflow: "hidden",
                    border: "3px solid #000000",
                    boxShadow: "8px 8px 0px #000000",
                    background: "#ffffff",
                },
            }}
        >
            {/* HEADER */}
            <Box
                sx={{
                    background: "#000000",
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    color: "#fff",
                    borderBottom: "3px solid #000000",
                }}
            >
                <Box
                    sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 2.5,
                        background: "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid rgba(255,255,255,0.2)",
                    }}
                >
                    <DownloadIcon />
                </Box>

                <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={800} fontSize={18} sx={{ lineHeight: 1.2 }}>
                        Recibir fondos
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, fontSize: 13 }}>
                        Elige la wallet y la red para recibir.
                    </Typography>
                </Box>

                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{
                        color: "white",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 2,
                        "&:hover": {
                            background: "rgba(255,255,255,0.2)",
                        }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent
                sx={{
                    px: 3,
                    py: 3,
                    background: "#ffffff",
                }}
            >
                <Stack spacing={2.5}>
                    {/* SELECTORS */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <Box sx={{ flex: 1 }}>
                            <Typography
                                fontWeight={700}
                                fontSize={13}
                                sx={{
                                    mb: 1,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                    color: "#666666"
                                }}
                            >
                                Wallet
                            </Typography>
                            <TextField
                                select
                                fullWidth
                                size="medium"
                                value={selectedWallet}
                                onChange={(e) => setSelectedWallet(e.target.value)}
                                InputProps={{
                                    sx: {
                                        borderRadius: 2,
                                        background: "#f5f5f5",
                                        border: "2px solid #000000",
                                        fontWeight: 600,
                                        "&:hover": {
                                            background: "#ffffff",
                                        },
                                        "&.Mui-focused": {
                                            background: "#ffffff",
                                        }
                                    },
                                }}
                            >
                                {wallets.map((w) => (
                                    <MenuItem key={w.address} value={w.address}>
                                        <Typography fontWeight={600}>
                                            {w.name} — {w.address.slice(0, 6)}...{w.address.slice(-4)}
                                        </Typography>
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <Typography
                                fontWeight={700}
                                fontSize={13}
                                sx={{
                                    mb: 1,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                    color: "#666666"
                                }}
                            >
                                Chain
                            </Typography>
                            <TextField
                                select
                                fullWidth
                                size="medium"
                                value={selectedChain}
                                onChange={(e) => setSelectedChain(e.target.value)}
                                InputProps={{
                                    sx: {
                                        borderRadius: 2,
                                        background: "#f5f5f5",
                                        border: "2px solid #000000",
                                        fontWeight: 600,
                                        "&:hover": {
                                            background: "#ffffff",
                                        },
                                        "&.Mui-focused": {
                                            background: "#ffffff",
                                        }
                                    },
                                }}
                            >
                                {chains.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <Box sx={{
                                                width: 24,
                                                height: 24,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                "& svg": {
                                                    width: "100%",
                                                    height: "100%",
                                                }
                                            }}>
                                                {c.icon}
                                            </Box>
                                            <Typography fontWeight={600}>{c.label}</Typography>
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    </Stack>

                    {/* CHAIN INFO */}
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 3,
                            background: "#f5f5f5",
                            border: "2px solid #000000",
                            textAlign: "center",
                        }}
                    >
                        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1.5}>
                            <Box sx={{
                                width: 28,
                                height: 28,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                "& svg": {
                                    width: "100%",
                                    height: "100%",
                                }
                            }}>
                                {currentChain?.icon}
                            </Box>
                            <Typography fontWeight={800} fontSize={16}>{currentChain?.label}</Typography>
                        </Stack>
                        <Typography variant="body2" color="#666666" fontWeight={600} sx={{ mt: 1, fontSize: 13 }}>
                            Usa esta dirección solo en redes compatibles.
                        </Typography>
                    </Box>

                    {/* QR CODE */}
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 3,
                                background: "#f5f5f5",
                                border: "2px solid #000000",
                                display: "inline-flex",
                            }}
                        >
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    background: "#fff",
                                    display: "inline-flex",
                                }}
                            >
                                <QRCode value={qrValue} size={140} fgColor="#000000" />
                            </Box>
                        </Box>
                    </Box>

                    {/* ADDRESS */}
                    <Box
                        sx={{
                            textAlign: "center",
                            px: 2,
                            py: 1.5,
                            borderRadius: 3,
                            background: "#f5f5f5",
                            border: "2px solid #000000",
                            wordBreak: "break-all",
                        }}
                    >
                        <Typography
                            fontWeight={700}
                            fontSize={13}
                            sx={{
                                mb: 0.5,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                color: "#666666"
                            }}
                        >
                            Tu dirección
                        </Typography>
                        <Typography
                            fontWeight={800}
                            color="#000000"
                            sx={{
                                fontSize: 14,
                                fontFamily: "monospace",
                            }}
                        >
                            {currentAddress || "0x..."}
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1, background: "#ffffff" }}>
                <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ContentCopyOutlined />}
                    onClick={() => copyToClipboard(currentAddress)}
                    sx={{
                        textTransform: "none",
                        borderRadius: 3,
                        py: 1.4,
                        fontWeight: 800,
                        fontSize: 15,
                        background: "#3CD2FF",
                        color: "#000000",
                        border: "3px solid #000000",
                        boxShadow: "4px 4px 0px #000000",
                        transition: "all 0.2s",
                        "&:hover": {
                            background: "#2CC2EF",
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000",
                        },
                    }}
                >
                    Copiar dirección
                </Button>
            </DialogActions>
        </Dialog>
    );
}