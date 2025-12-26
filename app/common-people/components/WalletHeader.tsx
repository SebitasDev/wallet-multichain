
"use client";

import { useState } from "react";
import { Box, Typography, Button, Switch, Stack, Collapse } from "@mui/material";
import { ArrowDownward, ArrowUpward, Login, ExpandMore, ExpandLess } from "@mui/icons-material";
import { ChainGrid } from "./ChainGrid";
import { AssetModal } from "./AssetModal";
import { ChainData } from "./ChainCard";
import { useRouter } from "next/navigation";

// Import Chain Constants for Icons
import {
    BASE,
    OPTIMISM,
    POLYGON,
    ARBITRUM,
    UNICHAIN,
    AVALANCHE,
    WORLD_CHAIN,
    STELLAR,
    Monad,
    BNB
} from "@/app/constants/chais";

import { useLocalCurrency } from "@/app/hooks/useLocalCurrency";

import { useCurrencyStore } from "@/app/store/useCurrencyStore";
import { Loop, AttachMoney, Language } from "@mui/icons-material"; // Icons
import { useLanguageStore } from "@/app/store/useLanguageStore";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore";

export function WalletHeader() {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
    const { language, toggleLanguage } = useLanguageStore();
    const { useLocal, toggleCurrency } = useCurrencyStore();
    const { openReceive } = useDashboardModalsStore();
    const { setSendModal } = useSendMoneyStore();

    // Local currency hook
    const { code: localCode, formatParts: formatLocalParts, loading, symbol: localSymbol } = useLocalCurrency();

    // Determine values based on preference
    const isLocal = useLocal && !loading;
    const currentCode = isLocal ? localCode : "USD";
    const currentSymbol = isLocal ? localSymbol : "$";

    // Parse formatted parts
    // If USD, we just mock the parts for 0.10 USD, otherwise use hook
    let integerPart = "0";
    let decimalPart = "10";
    let decimalSeparator = ".";

    if (isLocal) {
        const parts = formatLocalParts(0.10);
        integerPart = parts.filter(p => p.type === "integer" || p.type === "group").map(p => p.value).join("");
        decimalPart = parts.find(p => p.type === "fraction")?.value || "00";
        decimalSeparator = parts.find(p => p.type === "decimal")?.value || ".";
    } else {
        // Default USD formatting for 0.10
        integerPart = "0";
        decimalPart = "10";
        decimalSeparator = ".";
    }


    // Hardcoded chains data using real icons
    const chains: ChainData[] = [
        {
            id: "base",
            name: "Base",
            icon: BASE.icon,
            totalValue: "0.10",
            color: "#0052FF",
            assets: [{ symbol: "USDC", balance: "0.10", value: "$0.10", icon: BASE.assets[0].icon }],
        },
        {
            id: "optimism",
            name: "Optimism",
            icon: OPTIMISM.icon,
            totalValue: "0.00",
            color: "#FF0420",
            assets: [{ symbol: "OP", balance: "0.00", value: "$0.00", icon: OPTIMISM.assets[0].icon }], // Assuming Optimism has assets defined similarly
        },
        {
            id: "arbitrum",
            name: "Arbitrum",
            icon: ARBITRUM.icon,
            totalValue: "0.00",
            color: "#12AAFF",
            assets: [{ symbol: "ARB", balance: "0.00", value: "$0.00", icon: ARBITRUM.assets[0].icon }],
        },
        {
            id: "polygon",
            name: "Polygon",
            icon: POLYGON.icon,
            totalValue: "0.00",
            color: "#8247E5",
            assets: [{ symbol: "POL", balance: "0.00", value: "$0.00", icon: POLYGON.assets[0].icon }],
        },
        {
            id: "avalanche",
            name: "Avalanche",
            icon: AVALANCHE.icon,
            totalValue: "0.00",
            color: "#E84142",
            assets: [{ symbol: "AVAX", balance: "0.00", value: "$0.00", icon: AVALANCHE.assets[0]?.icon }],
        },
        {
            id: "bnb",
            name: "BNB Chain",
            icon: BNB.icon,
            totalValue: "0.00",
            color: "#F3BA2F",
            assets: [{ symbol: "BNB", balance: "0.00", value: "$0.00", icon: BNB.assets[0]?.icon }],
        },
        {
            id: "unichain",
            name: "Unichain",
            icon: UNICHAIN.icon,
            totalValue: "0.00",
            color: "#FF007A",
            assets: [{ symbol: "UNI", balance: "0.00", value: "$0.00", icon: UNICHAIN.assets[0]?.icon }],
        },
        {
            id: "worldchain",
            name: "World Chain",
            icon: WORLD_CHAIN.icon,
            totalValue: "0.00",
            color: "#000000",
            assets: [{ symbol: "WLD", balance: "0.00", value: "$0.00", icon: WORLD_CHAIN.assets[0]?.icon }],
        },
        {
            id: "monad",
            name: "Monad",
            icon: Monad.icon,
            totalValue: "0.00",
            color: "#836EF9",
            assets: [{ symbol: "MON", balance: "0.00", value: "$0.00", icon: Monad.assets[0]?.icon }],
        },
        {
            id: "stellar",
            name: "Stellar",
            icon: STELLAR.icon,
            totalValue: "0.00",
            color: "#3E1B3C",
            assets: [{ symbol: "XLM", balance: "0.00", value: "$0.00", icon: STELLAR.assets[0]?.icon }],
        },
    ];

    return (
        <Box width="100%">
            {/* Welcome Message */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        backgroundColor: "#0f766e",
                        color: "white",
                        px: 2,
                        py: 1,
                        borderRadius: 10,
                        border: "3px solid #000000",
                        boxShadow: "4px 4px 0px #000000",
                    }}
                >
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: "#2dd4bf",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "black",
                            fontWeight: "bold",
                            border: "2px solid #000000",
                        }}
                    >
                        S
                    </Box>
                    <Typography fontWeight="bold" fontSize={14}>
                        {language === "es" ? "¡Bienvenido a 1llet! 👋" : "Welcome to 1llet! 👋"}
                    </Typography>
                </Box>

                <Box
                    onClick={toggleLanguage}
                    sx={{
                        p: 1,
                        border: "3px solid #000000",
                        borderRadius: 2,
                        boxShadow: "4px 4px 0px #000000",
                        backgroundColor: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        transition: "all 0.2s",
                        "&:hover": {
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000",
                        },
                    }}
                >
                    <Language sx={{ fontSize: 24, color: "black" }} />
                    <Typography fontWeight={900} fontSize={14}>
                        {language.toUpperCase()}
                    </Typography>
                </Box>
            </Box>

            {/* Main Collapsible Card */}
            <Box
                sx={{
                    backgroundColor: "#00DC8C",
                    border: "3px solid #000000",
                    borderRadius: "24px",
                    boxShadow: "8px 8px 0px #000000",
                    position: "relative",
                    overflow: "hidden",
                    transition: "height 0.3s ease",
                }}
            >
                {/* Background Decorations */}
                <Box sx={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(40px)", mr: -10, mt: -10, pointerEvents: "none" }} />

                <Box p={3} pb={expanded ? 1 : 3}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography fontWeight="bold" fontSize={18}>
                            {language === "es" ? "Total" : "Total Balance"}
                        </Typography>

                        {/* Currency Toggle Button */}
                        <Box
                            onClick={toggleCurrency}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                cursor: "pointer",
                                px: 1,
                                py: 0.5,
                                backgroundColor: "rgba(0,0,0,0.1)",
                                borderRadius: "8px",
                                border: "1px solid black",
                                transition: "all 0.2s",
                                "&:hover": { backgroundColor: "rgba(0,0,0,0.2)" }
                            }}
                        >
                            <Loop sx={{ fontSize: 16 }} />
                            <Typography fontSize={12} fontWeight="bold">
                                {useLocal ? "USD" : localCode}
                            </Typography>
                        </Box>
                    </Box>

                    <Box display="flex" alignItems="baseline" mb={4}>
                        <Typography variant="h2" fontWeight={900} sx={{ letterSpacing: "-0.05em", fontSize: "3rem", lineHeight: 1 }}>
                            {loading && useLocal ? "..." : `${currentSymbol} ${integerPart}${decimalSeparator}`}
                        </Typography>
                        {(!loading || !useLocal) && (
                            <>
                                <Typography fontWeight={900} sx={{ fontSize: "1.5rem", lineHeight: 1, ml: 0.5, position: "relative", top: -10 }}>
                                    {decimalPart}
                                </Typography>
                                <Typography fontWeight="bold" fontSize={14} sx={{ ml: 1 }}>
                                    {currentCode}
                                </Typography>
                            </>
                        )}
                    </Box>

                    <Stack direction="row" spacing={2} mb={2}>
                        <Button
                            onClick={openReceive}
                            fullWidth
                            sx={{
                                backgroundColor: "#0f766e",
                                color: "white",
                                py: 1.5,
                                px: 2,
                                borderRadius: "16px",
                                border: "3px solid #000000",
                                boxShadow: "4px 4px 0px #000000",
                                fontWeight: "bold",
                                textTransform: "none",
                                fontSize: 16,
                                "&:hover": { backgroundColor: "#0d6e66", transform: "translate(2px, 2px)", boxShadow: "2px 2px 0px #000000" },
                                "&:active": { transform: "translate(4px, 4px)", boxShadow: "none" },
                            }}
                            startIcon={
                                <Box sx={{ backgroundColor: "white", borderRadius: "50%", p: 0.5, border: "2px solid #000000", display: "flex" }}>
                                    <ArrowDownward sx={{ fontSize: 16, color: "black", strokeWidth: 3 }} />
                                </Box>
                            }
                        >
                            {language === "es" ? "Recibir" : "Receive"}
                        </Button>
                        <Button
                            onClick={() => setSendModal(true)}
                            fullWidth
                            sx={{
                                backgroundColor: "#0f766e",
                                color: "white",
                                py: 1.5,
                                px: 2,
                                borderRadius: "16px",
                                border: "3px solid #000000",
                                boxShadow: "4px 4px 0px #000000",
                                fontWeight: "bold",
                                textTransform: "none",
                                fontSize: 16,
                                "&:hover": { backgroundColor: "#0d6e66", transform: "translate(2px, 2px)", boxShadow: "2px 2px 0px #000000" },
                                "&:active": { transform: "translate(4px, 4px)", boxShadow: "none" },
                            }}
                            startIcon={
                                <Box sx={{ backgroundColor: "white", borderRadius: "50%", p: 0.5, border: "2px solid #000000", display: "flex" }}>
                                    <ArrowUpward sx={{ fontSize: 16, color: "black", strokeWidth: 3 }} />
                                </Box>
                            }
                        >
                            {language === "es" ? "Enviar" : "Send"}
                        </Button>
                    </Stack>

                    {/* Collapsible Content */}
                    <Collapse in={expanded}>
                        <Box mt={4} mb={2}>
                            <ChainGrid chains={chains} onSelectChain={setSelectedChain} />
                        </Box>
                    </Collapse>
                </Box>

                {/* Expand Button */}
                <Box display="flex" justifyContent="center" pb={1} onClick={() => setExpanded(!expanded)}>
                    <Box
                        sx={{
                            backgroundColor: "#1f2937", // dark gray
                            color: "white",
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid #000000",
                            cursor: "pointer",
                            "&:hover": { transform: "scale(1.1)" },
                            transition: "transform 0.2s"
                        }}
                    >
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                </Box>
            </Box>

            <AssetModal
                isOpen={!!selectedChain}
                onClose={() => setSelectedChain(null)}
                chain={selectedChain}
            />
        </Box>
    );
}
