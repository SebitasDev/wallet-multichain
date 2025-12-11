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
                position: "relative",
                isolation: "isolate",
                borderRadius: 18,
                overflow: "hidden",
                transition: "0.25s",
                background:
                    "radial-gradient(circle at 18% 12%, rgba(126,87,255,0.2) 0%, transparent 30%), radial-gradient(circle at 85% 5%, rgba(255,72,160,0.18) 0%, transparent 25%), linear-gradient(185deg, #0d0a1f 0%, #0b081a 45%, #05040f 100%)",
                color: "#f9fafb",
                boxShadow:
                    "0 24px 68px rgba(0,0,0,0.78), 0 12px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                border: "1px solid rgba(126,87,255,0.18)",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: -6,
                    borderRadius: "inherit",
                    background: "linear-gradient(135deg, rgba(126,87,255,0.35), rgba(255,72,160,0.3))",
                    filter: "blur(16px)",
                    opacity: 0.32,
                    zIndex: 0,
                },
            }}
        >
            {/* HEADER */}
            <Box
                sx={{
                    p: 3,
                    background: `linear-gradient(135deg, rgba(24,18,46,0.92) 0%, rgba(14,10,32,0.95) 100%), ${bgGradient}`,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    color: "#f9fafb",
                    boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.05)",
                    position: "relative",
                    zIndex: 1,
                    backdropFilter: "blur(4px)",
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
                                    color: "#f9fafb",
                                    maxWidth: { xs: 150, sm: 200 },
                                    minWidth: 0,
                                    whiteSpace: showNameExpanded ? "normal" : "nowrap",
                                    textOverflow: showNameExpanded ? "clip" : "ellipsis",
                                    overflow: "hidden",
                                    letterSpacing: "0.3px",
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
                                    sx={{
                                        color: "rgba(255,255,255,0.85)",
                                        p: 0.25,
                                        backgroundColor: "rgba(255,255,255,0.08)",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        "&:hover": { backgroundColor: "rgba(255,255,255,0.14)" },
                                    }}
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
                                    background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
                                    color: "#f3f4f6",
                                    border: "1px solid rgba(255,255,255,0.18)",
                                    fontWeight: 700,
                                    letterSpacing: "0.35px",
                                    backdropFilter: "blur(10px)",
                                    boxShadow: "0 14px 32px rgba(0,0,0,0.45)",
                                }}
                            />
                        </Box>

                        <Box mt={1.5} display="flex" alignItems="center" gap={1}>
                            <Typography
                                component="code"
                                sx={{
                                    backgroundColor: "rgba(255,255,255,0.08)",
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: "12px",
                                    color: "#f9fafb",
                                    border: "1px solid rgba(255,255,255,0.12)",
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
                                sx={{
                                    color: "rgba(255,255,255,0.85)",
                                    backgroundColor: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
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
                                sx={{
                                    color: "rgba(255,255,255,0.85)",
                                    backgroundColor: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
                                }}
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
                                color: "#f87171",
                                mb: 1,
                                backgroundColor: "rgba(248,113,113,0.1)",
                                border: "1px solid rgba(248,113,113,0.35)",
                                "&:hover": { backgroundColor: "rgba(248,113,113,0.18)" },
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeWallet(address);
                            }}
                        >
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>

                        <Typography variant="h5" fontWeight="bold">
                            <Box component="span" sx={{ color: "#f9fafb" }}>
                                ${totalBalance.toFixed(2)}
                            </Box>
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(226,232,240,0.7)" }}>
                            Valor Total
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* LISTA DE CHAINS */}
            <CardContent
                sx={{
                    p: 0,
                    background: "rgba(8,8,18,0.9)",
                    color: "#e5e7eb",
                    backdropFilter: "blur(6px)",
                    "& .MuiDivider-root": { borderColor: "rgba(255,255,255,0.08)" },
                    "& .MuiTypography-root": { color: "#e5e7eb" },
                    "& .MuiTypography-root.MuiTypography-caption": { color: "rgba(229,231,235,0.7)" },
                    "& .MuiListItemButton-root": {
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                    },
                    "& .MuiListItem-root": {
                        color: "#e5e7eb",
                    },
                }}
            >
                <List disablePadding sx={{ backgroundColor: "transparent" }}>
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
            <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
            <CardActions
                sx={{
                    p: 2,
                    color: "#e5e7eb",
                    backgroundColor: "rgba(8,8,18,0.9)",
                    backdropFilter: "blur(6px)",
                }}
            >
                <Button
                    fullWidth
                    variant="text"
                    startIcon={
                        <ExpandMoreIcon
                            sx={{
                                transform: showMore ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "0.2s",
                                color: "#cbd5e1",
                            }}
                        />
                    }
                    sx={{
                        textTransform: "none",
                        color: "#e5e7eb",
                        fontWeight: 700,
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" },
                    }}
                    onClick={() => setShowMore(!showMore)}
                >
                    {showMore ? "Ocultar chains" : "Ver 1 chain más"}
                </Button>
            </CardActions>
        </Card>
    );
}
