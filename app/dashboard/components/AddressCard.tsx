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

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BaseChainItem from "@/app/components/molecules/BaseChainItem";
import OptimismChainItem from "@/app/components/molecules/OptimismChainItem";
import {useEffect, useMemo, useState} from "react";
import PolyChainItem from "@/app/components/molecules/PolyChainItem";
import {Address} from "abitype";
import {useAddressInfo} from "@/app/dashboard/hooks/useAddressInfo";
import { toast } from "react-toastify";

interface IAddressCardProps {
    address: Address
    walletName: string
}

export const AddressCard = ({
        address,
        walletName
    }: IAddressCardProps) => {
    const [showMore, setShowMore] = useState(false);
    const {total} = useAddressInfo(address);

    const [bgGradient, setBgGradient] = useState("linear-gradient(135deg, #f1f5ff, #e8f5f1)");

    useEffect(() => {
        const pastelClaro = () =>
            `hsl(${Math.floor(Math.random() * 360)}, 90%, 95%)`;
        const c1 = pastelClaro();
        const c2 = pastelClaro();
        setBgGradient(`linear-gradient(135deg, ${c1}, ${c2})`);
    }, []);

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

    const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;

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
                <Box display="flex" justifyContent="space-between">
                    {/* Left */}
                    <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                            {/* Wallet name */}
                            <Typography variant="h6" fontWeight="bold" sx={{ color: "#0f172a" }}>
                                {walletName}
                            </Typography>

                            {/* numero de chains disponibles */}
                            <Chip label="3 chains" size="small" sx={{
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
                    <Box textAlign="right">
                        <Typography variant="h5" fontWeight="bold">
                            ${total}
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
                            <PolyChainItem address={address}/>
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
