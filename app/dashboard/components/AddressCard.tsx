"use client";

import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Box,
    IconButton,
    Button,
    Chip,
    Divider,
    List,
} from "@mui/material";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
import BaseChainItem from "@/app/components/molecules/BaseChainItem";
import OptimismChainItem from "@/app/components/molecules/OptimismChainItem";
import {useMemo, useState} from "react";
import ArbitrumChainItem from "@/app/components/molecules/ArbitrumChainItem";
import {Address} from "abitype";
import { toast } from "react-toastify";
import {useWalletStore} from "@/app/store/useWalletsStore";
import UnichainChainItem from "@/app/components/molecules/UnichainChainItem";
import PolygonChainItem from "@/app/components/molecules/PolygonChainItem";
import AvalancheChainItem from "@/app/components/molecules/AvalancheChainItem";

interface IAddressCardProps {
    address: Address
    walletName: string
}

export const AddressCard = ({
        address,
        walletName
    }: IAddressCardProps) => {
    const [showMore, setShowMore] = useState(false);
    const [showNameExpanded, setShowNameExpanded] = useState(false);

    const totalBalance = useWalletStore(
        (state) => state.getWalletTotalBalance(address)
    );

    const bgGradient = useMemo(() => {
        const seed = address
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const pastel = (h: number) => `hsl(${h % 360}, 80%, 92%)`;
        return `linear-gradient(135deg, ${pastel(seed)}, ${pastel(seed * 7)})`;
    }, [address]);

    const copyToClipboard = async (value: string, label: string) => {
        const text = value ?? "";
        if (!text) {
            toast.error("No hay nada para copiar");
            return;
        }
        const onSuccess = () => toast.success(`${label} copiado`);
        const onError = () => toast.error("No se pudo copiar");
        const promptFallback = () => {
            const manual = window.prompt("Copia y pega:", text);
            if (manual !== null) onSuccess();
        };
        const fallbackCopy = () => {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try {
                const ok = document.execCommand("copy");
                ok ? onSuccess() : onError();
            } catch {
                onError();
                promptFallback();
            } finally {
                document.body.removeChild(textarea);
            }
        };

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                onSuccess();
            } else {
                fallbackCopy();
            }
        } catch {
            fallbackCopy();
        }
    };
    const { removeWallet } = useWalletStore();

    const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const exceedsNameLimit = walletName.length > 12;
    const displayName = exceedsNameLimit && !showNameExpanded ? `${walletName.slice(0, 12)}...` : walletName;

    return (
        <Card
            elevation={3}
            sx={{
                borderRadius: 12,
                overflow: "hidden",
                transition: "0.2s",
                background: "#ffffff",
                color: "#0f172a",
                boxShadow:
                    "0 0 0 1.5px rgba(255,255,255,0.1), 0 0 10px rgba(200,200,200,0.6), 0 10px 24px rgba(15,23,42,0.18), inset 0 0 0 1.5px rgba(210,210,210,0.7)",
                border: "1.25px solid rgba(215,215,215,0.85)",
            }}
        >
            {/* HEADER */}
            <Box
                sx={{
                    p: 3,
                    background: bgGradient,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">

                    {/* Left */}
                    <Box flex={1} minWidth={0}>
                        <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            flexWrap="nowrap"
                            sx={{ minWidth: 0, overflow: "hidden" }}
                        >
                            {/* Wallet name */}
                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                sx={{
                                    color: "#0f172a",
                                    maxWidth: { xs: 150, sm: 200 },
                                    minWidth: 0,
                                    whiteSpace: showNameExpanded ? "normal" : "nowrap",
                                    textOverflow: showNameExpanded ? "clip" : "ellipsis",
                                    overflow: "hidden",
                                }}
                                title={walletName}
                            >
                                {displayName}
                            </Typography>

                            {exceedsNameLimit && (
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowNameExpanded((prev) => !prev);
                                    }}
                                    sx={{ color: "#2563eb", p: 0.25 }}
                                >
                                    {showNameExpanded ? (
                                        <ExpandLess fontSize="small" />
                                    ) : (
                                        <ExpandMoreIcon fontSize="small" />
                                    )}
                                </IconButton>
                            )}

                            {/* numero de chains disponibles */}
                            <Chip
                                label="6 chains"
                                size="small"
                                sx={{
                                    backgroundColor: "rgba(16,185,129,0.15)",
                                    color: "#0f5132",
                                }}
                            />
                        </Box>

                        <Box mt={1.5} display="flex" alignItems="center" gap={1}>
                            <Typography
                                component="code"
                                sx={{
                                    backgroundColor: "rgba(248,250,252,0.8)",
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: "12px",
                                    color: "#0f172a",
                                }}
                            >
                                {truncated}
                            </Typography>

                            <IconButton
                                size="small"
                                aria-label="Copiar address"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(address, "Address");
                                }}
                            >
                                <ContentCopyIcon fontSize="inherit" />
                            </IconButton>

                            <IconButton
                                size="small"
                                component="a"
                                href={`https://etherscan.io/address/${address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <OpenInNewIcon fontSize="inherit" />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Right */}
                    <Box textAlign="right" display="flex" flexDirection="column" alignItems="flex-end">

                        {/* Delete button */}
                        <IconButton
                            size="small"
                            sx={{
                                color: "#b91c1c",
                                mb: 1,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeWallet(address);
                            }}
                        >
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>

                        <Typography variant="h5" fontWeight="bold">
                            ${totalBalance.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Valor Total
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* LISTA DE CHAINS */}
            <CardContent sx={{ p: 0 }}>
                <List disablePadding>
                    {/* Base */}
                    <Divider />
                    <BaseChainItem address={address}/>

                    {/* Optimism */}
                    <Divider/>
                    <OptimismChainItem address={address}/>

                    {showMore && (
                        <>
                            <Divider />
                            <ArbitrumChainItem address={address}/>
                            <UnichainChainItem address={address}/>
                            <PolygonChainItem address={address}/>
                            <AvalancheChainItem address={address}/>
                        </>
                    )}
                </List>
            </CardContent>

            {/* FOOTER */}
            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
            <CardActions sx={{ p: 2, color: "#475569" }}>
                <Button
                    fullWidth
                    variant="text"
                    startIcon={
                        <ExpandMoreIcon
                            sx={{
                                transform: showMore ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "0.2s",
                                color: "#475569",
                            }}
                        />
                    }
                    sx={{
                        textTransform: "none",
                        color: "#475569",
                        fontWeight: 700,
                        "&:hover": { backgroundColor: "rgba(148,163,184,0.08)" },
                    }}
                    onClick={() => setShowMore(!showMore)}
                >
                    {showMore ? "Ocultar chains" : "Ver 1 chain más"}
                </Button>
            </CardActions>
        </Card>
    );
}
