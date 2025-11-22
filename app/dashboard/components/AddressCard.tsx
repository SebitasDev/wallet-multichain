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
import CeloChainItem from "@/app/components/molecules/CeloChainItem";
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
                borderRadius: 3,
                overflow: "hidden",
                transition: "0.2s",
                "&:hover": { boxShadow: 8 },
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
                            <Typography variant="h6" fontWeight="bold">
                                {walletName}
                            </Typography>

                            {/* numero de chains disponibles */}
                            <Chip label="3 chains" size="small" sx={{
                                    backgroundColor: "#009460",
                                    color: "#fff",
                                }}
                            />
                        </Box>

                        <Box mt={1.5} display="flex" alignItems="center" gap={1}>
                            <Typography
                                component="code"
                                sx={{
                                    backgroundColor: "action.hover",
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: "12px",
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
                            <CeloChainItem address={address}/>
                        </>
                    )}
                </List>
            </CardContent>

            {/* FOOTER */}
            <Divider />
            <CardActions sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="text"
                    startIcon={
                        <ExpandMoreIcon
                            sx={{
                                transform: showMore ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "0.2s",
                            }}
                        />
                    }
                    sx={{ textTransform: "none" }}
                    onClick={() => setShowMore(!showMore)}
                >
                    {showMore ? "Ocultar chains" : "Ver 1 chain más"}
                </Button>
            </CardActions>
        </Card>
    );
}
