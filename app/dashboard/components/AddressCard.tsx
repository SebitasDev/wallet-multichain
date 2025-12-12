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
            elevation={0}
            sx={{
                borderRadius: 4,
                overflow: "hidden",
                background: "#ffffff",
                border: "3px solid #000000",
                boxShadow: "6px 6px 0px #000000",
                transition: "all 0.2s",
                "&:hover": {
                    transform: "translate(2px, 2px)",
                    boxShadow: "4px 4px 0px #000000",
                },
            }}
        >
            {/* HEADER */}
            <Box
                sx={{
                    p: 3,
                    background: "#f5f5f5",
                    borderBottom: "3px solid #000000",
                    color: "#000000",
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>

                    {/* Left */}
                    <Box flex={1} minWidth={0}>
                        <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            flexWrap="wrap"
                            sx={{ minWidth: 0 }}
                        >
                            {/* Wallet name */}
                            <Typography
                                variant="h6"
                                fontWeight={800}
                                sx={{
                                    color: "#000000",
                                    maxWidth: { xs: 150, sm: 200 },
                                    minWidth: 0,
                                    whiteSpace: showNameExpanded ? "normal" : "nowrap",
                                    textOverflow: showNameExpanded ? "clip" : "ellipsis",
                                    overflow: "hidden",
                                    fontSize: { xs: 18, md: 20 },
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
                                        color: "#000000",
                                        background: "#ffffff",
                                        border: "2px solid #000000",
                                        borderRadius: 2,
                                        width: 28,
                                        height: 28,
                                        "&:hover": {
                                            background: "#f5f5f5",
                                        },
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
                                    background: "#ffffff",
                                    color: "#000000",
                                    border: "2px solid #000000",
                                    fontWeight: 800,
                                    fontSize: 11,
                                    letterSpacing: "0.5px",
                                }}
                            />
                        </Box>

                        <Box mt={1.5} display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Box
                                component="code"
                                sx={{
                                    backgroundColor: "#ffffff",
                                    px: 1.5,
                                    py: 0.75,
                                    borderRadius: 2,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    color: "#000000",
                                    border: "2px solid #000000",
                                    fontFamily: "monospace",
                                }}
                            >
                                {truncated}
                            </Box>

                            <IconButton
                                size="small"
                                aria-label="Copiar address"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(address, "Address");
                                }}
                                sx={{
                                    color: "#000000",
                                    background: "#ffffff",
                                    border: "2px solid #000000",
                                    borderRadius: 2,
                                    width: 32,
                                    height: 32,
                                    transition: "all 0.2s",
                                    "&:hover": {
                                        background: "#3CD2FF",
                                        transform: "scale(1.05)",
                                    },
                                }}
                            >
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>

                            <IconButton
                                size="small"
                                component="a"
                                href={`https://etherscan.io/address/${address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    color: "#000000",
                                    background: "#ffffff",
                                    border: "2px solid #000000",
                                    borderRadius: 2,
                                    width: 32,
                                    height: 32,
                                    transition: "all 0.2s",
                                    "&:hover": {
                                        background: "#7852FF",
                                        color: "#ffffff",
                                        transform: "scale(1.05)",
                                    },
                                }}
                            >
                                <OpenInNewIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Right */}
                    <Box textAlign="right" display="flex" flexDirection="column" alignItems="flex-end" gap={1}>

                        {/* Delete button */}
                        <IconButton
                            size="small"
                            sx={{
                                color: "#000000",
                                background: "#ff4444",
                                border: "2px solid #000000",
                                borderRadius: 2,
                                width: 36,
                                height: 36,
                                transition: "all 0.2s",
                                "&:hover": {
                                    background: "#ff3333",
                                    transform: "scale(1.05)",
                                },
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeWallet(address);
                            }}
                        >
                            <DeleteOutlineIcon fontSize="small" sx={{ color: "#ffffff" }} />
                        </IconButton>

                        <Box
                            sx={{
                                background: "#ffffff",
                                border: "2px solid #000000",
                                borderRadius: 2,
                                px: 2,
                                py: 1,
                                textAlign: "center",
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "#666666",
                                    fontWeight: 700,
                                    fontSize: 11,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    display: "block",
                                    mb: 0.5,
                                }}
                            >
                                Valor Total
                            </Typography>
                            <Typography
                                variant="h5"
                                fontWeight={900}
                                sx={{ color: "#000000", fontSize: { xs: 20, md: 24 } }}
                            >
                                ${totalBalance.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* LISTA DE CHAINS */}
            <CardContent
                sx={{
                    p: 0,
                    background: "#ffffff",
                    "& .MuiDivider-root": {
                        borderColor: "#000000",
                        borderWidth: "1px",
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
                            <Divider />
                            <UnichainChainItem address={address}/>
                            <Divider />
                            <PolygonChainItem address={address}/>
                            <Divider />
                            <AvalancheChainItem address={address}/>
                        </>
                    )}
                </List>
            </CardContent>

            {/* FOOTER */}
            <Divider sx={{ borderColor: "#000000", borderWidth: "3px" }} />
            <CardActions
                sx={{
                    p: 2,
                    background: "#f5f5f5",
                }}
            >
                <Button
                    fullWidth
                    variant="text"
                    startIcon={
                        <ExpandMoreIcon
                            sx={{
                                transform: showMore ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.3s",
                                color: "#000000",
                            }}
                        />
                    }
                    sx={{
                        textTransform: "none",
                        color: "#000000",
                        fontWeight: 800,
                        fontSize: 14,
                        py: 1.2,
                        borderRadius: 3,
                        border: "2px solid #000000",
                        background: "#ffffff",
                        transition: "all 0.2s",
                        "&:hover": {
                            background: "#f5f5f5",
                            transform: "scale(1.01)",
                        },
                    }}
                    onClick={() => setShowMore(!showMore)}
                >
                    {showMore ? "Ocultar chains" : "Ver 4 chains más"}
                </Button>
            </CardActions>
        </Card>
    );
}