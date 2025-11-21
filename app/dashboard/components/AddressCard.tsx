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
import {useMemo, useState} from "react";
import CeloChainItem from "@/app/components/molecules/CeloChainItem";
import {Address} from "abitype";

interface IAddressCardProps {
    Address: Address
}

export const AddressCard = ({
        Address
    }: IAddressCardProps) => {
    const [showMore, setShowMore] = useState(false);

    const bgGradient = useMemo(() => {
        const pastelClaro = () =>
            `hsl(${Math.floor(Math.random() * 360)}, 90%, 95%)`;

        const c1 = pastelClaro();
        const c2 = pastelClaro();

        return `linear-gradient(135deg, ${c1}, ${c2})`;
    }, []);

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
                                wallet name
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
                                {/* address */}
                                0x742d...bEb7
                            </Typography>

                            <IconButton size="small">
                                <ContentCopyIcon fontSize="inherit" />
                            </IconButton>

                            <IconButton
                                size="small"
                                component="a"
                                href="https://etherscan.io/address/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7"
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
                            $12,847.32
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
                    <BaseChainItem/>

                    {/* Optimism */}
                    <Divider/>
                    <OptimismChainItem/>

                    {showMore && (
                        <>
                            <Divider />
                            <CeloChainItem />
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