
"use client";

import { useState } from "react";
import { Box, Typography, Button, Switch, Stack, Collapse } from "@mui/material";
import { ArrowDownward, ArrowUpward, Login, ExpandMore, ExpandLess, Visibility, VisibilityOff } from "@mui/icons-material";
import { ChainGrid } from "./ChainGrid";
import { AssetModal } from "./AssetModal";
import { ChainData } from "./ChainCard";
import { useRouter } from "next/navigation"; // Fixed import

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
import { Loop, AttachMoney, Language, CompareArrows } from "@mui/icons-material"; // Icons
import { useLanguageStore } from "@/app/store/useLanguageStore";
import { useUserStore } from "@/app/store/useUserStore";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore";
import { CrossChainTransferModal } from "@/app/dashboard/components/CrossChainTransferModal";

export function WalletHeader() {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [showBalance, setShowBalance] = useState(true);
    const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
    const { language, toggleLanguage } = useLanguageStore();
    const { name } = useUserStore();
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


    // Hardcoded chains data using real icons and assets
    const chains: ChainData[] = [
        {
            id: "base",
            name: "Base",
            icon: BASE.icon,
            totalValue: "0.10",
            color: "#0052FF",
            assets: BASE.assets.map(asset => ({
                symbol: asset.name,
                balance: asset.name === "USDC" ? "0.10" : "0.00",
                value: asset.name === "USDC" ? "$0.10" : "$0.00",
                icon: asset.icon
            })),
        },
        {
            id: "optimism",
            name: "Optimism",
            icon: OPTIMISM.icon,
            totalValue: "0.00",
            color: "#FF0420",
            assets: OPTIMISM.assets.map(asset => ({
                symbol: asset.name,
                balance: "0.00",
                value: "$0.00",
                icon: asset.icon
            })),
        },
        {
            id: "arbitrum",
            name: "Arbitrum",
            icon: ARBITRUM.icon,
            totalValue: "0.00",
            color: "#12AAFF",
            assets: ARBITRUM.assets.map(asset => ({
                symbol: asset.name,
                balance: "0.00",
                value: "$0.00",
                icon: asset.icon
            })),
        },
        {
            id: "polygon",
            name: "Polygon",
            icon: POLYGON.icon,
            totalValue: "0.00",
            color: "#8247E5",
            assets: POLYGON.assets.map(asset => ({
                symbol: asset.name,
                balance: "0.00",
                value: "$0.00",
                icon: asset.icon
            })),
        },
        {
            id: "avalanche",
            name: "Avalanche",
            icon: AVALANCHE.icon,
            totalValue: "0.00",
            color: "#E84142",
            assets: AVALANCHE.assets.map(asset => ({
                symbol: asset.name,
                balance: "0.00",
                value: "$0.00",
                icon: asset.icon
            })),
        },
        {
            id: "bnb",
            name: "BNB Chain",
            icon: BNB.icon,
            totalValue: "0.00",
            color: "#F3BA2F",
            assets: BNB.assets.map(asset => ({
                symbol: asset.name,
                balance: "0.00",
                value: "$0.00",
                icon: asset.icon
            })),
        },
        {
            id: "unichain",
            name: "Unichain",
            icon: UNICHAIN.icon,
            totalValue: "0.00",
            color: "#FF007A",
            assets: UNICHAIN.assets.map(asset => ({
                symbol: asset.name,
                balance: "0.00",
                value: "$0.00",
                icon: asset.icon
            })),
        },
        {
            id: "worldchain",
            name: "World Chain",
            icon: WORLD_CHAIN.icon,
            totalValue: "0.00",
            color: "#000000",
            assets: WORLD_CHAIN.assets.map(asset => ({
                symbol: asset.name,
                balance: "0.00",
                value: "$0.00",
                icon: asset.icon
            })),
        },
        {
            id: "monad",
            name: "Monad",
            icon: Monad.icon,
            totalValue: "0.00",
            color: "#836EF9",
            assets: Monad.assets.map(asset => ({
                symbol: asset.name,
                balance: "0.00",
                value: "$0.00",
                icon: asset.icon
            })),
        },
        {
            id: "stellar",
            name: "Stellar",
            icon: STELLAR.icon,
            totalValue: "0.00",
            color: "#3E1B3C",
            assets: STELLAR.assets.map(asset => ({
                symbol: asset.name,
                balance: "0.00",
                value: "$0.00",
                icon: asset.icon
            })),
        },
    ];

    return (
        <Box width="100%">
            {/* Welcome Message */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} id="common-welcome">
                <Box
                    onClick={() => router.push("/common-people/profile")}
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
                        cursor: "pointer",
                        transition: "transform 0.1s",
                        "&:active": {
                            transform: "scale(0.98)"
                        }
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
                        {name.charAt(0).toUpperCase()}
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
                id="common-balance-card"
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

                    <Box display="flex" alignItems="center" mb={4}>
                        <Typography variant="h2" fontWeight={900} sx={{ letterSpacing: "-0.05em", fontSize: "3rem", lineHeight: 1 }}>
                            {showBalance
                                ? (loading && useLocal ? "..." : `${currentSymbol} ${integerPart}${decimalSeparator}`)
                                : `${currentSymbol} ****`
                            }
                        </Typography>

                        {showBalance && (!loading || !useLocal) && (
                            <>
                                <Typography fontWeight={900} sx={{ fontSize: "1.5rem", lineHeight: 1, ml: 0.5, position: "relative", top: -10 }}>
                                    {decimalPart}
                                </Typography>
                                <Typography fontWeight="bold" fontSize={14} sx={{ ml: 1 }}>
                                    {currentCode}
                                </Typography>
                            </>
                        )}

                        <Box
                            onClick={() => setShowBalance(!showBalance)}
                            sx={{
                                ml: 2,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                p: 1,
                                borderRadius: "50%",
                                "&:hover": { backgroundColor: "rgba(0,0,0,0.05)" }
                            }}
                        >
                            {showBalance ? <Visibility sx={{ fontSize: 24 }} /> : <VisibilityOff sx={{ fontSize: 24 }} />}
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={2} mb={3} id="common-actions">
                        <Button
                            onClick={openReceive}
                            fullWidth
                            className="neobrutalist-button"
                            sx={{
                                flex: 1,
                                backgroundColor: "#18181b", // Zinc-950 (Almost Black)
                                color: "white",
                                py: 1.5,
                                borderRadius: "14px", // Slightly tighter radius
                                border: "2px solid #000000", // Thinner, sharper border
                                boxShadow: "4px 4px 0px #000000", // Classic solid shadow
                                fontWeight: 800, // Extra bold
                                textTransform: "none",
                                fontSize: "0.95rem",
                                display: "flex",
                                flexDirection: "column", // Vertical Layout (Icon Top, Text Bottom)
                                gap: 0.5,
                                minWidth: 0,
                                transition: "all 0.1s ease-in-out",
                                "&:hover": {
                                    backgroundColor: "#27272a", // Zinc-800
                                    transform: "translate(-2px, -2px)",
                                    boxShadow: "6px 6px 0px #000000",
                                },
                                "&:active": {
                                    transform: "translate(2px, 2px)",
                                    boxShadow: "0px 0px 0px #000000",
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    backgroundColor: "#2dd4bf", // Teal-400 (Contrast pop)
                                    color: "black",
                                    borderRadius: "50%",
                                    p: 0.5,
                                    mb: 0.2, // Tiny spacing
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "1.5px solid #000000"
                                }}
                            >
                                <ArrowDownward sx={{ fontSize: 18, strokeWidth: 2.5 }} />
                            </Box>
                            {language === "es" ? "Recibir" : "Receive"}
                        </Button>

                        <CrossChainTransferModal
                            trigger={
                                <Button
                                    fullWidth
                                    sx={{
                                        flex: 1,
                                        backgroundColor: "#18181b",
                                        color: "white",
                                        py: 1.5,
                                        borderRadius: "14px",
                                        border: "2px solid #000000",
                                        boxShadow: "4px 4px 0px #000000",
                                        fontWeight: 800,
                                        textTransform: "none",
                                        fontSize: "0.95rem",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 0.5,
                                        minWidth: 0,
                                        transition: "all 0.1s ease-in-out",
                                        "&:hover": {
                                            backgroundColor: "#27272a",
                                            transform: "translate(-2px, -2px)",
                                            boxShadow: "6px 6px 0px #000000",
                                        },
                                        "&:active": {
                                            transform: "translate(2px, 2px)",
                                            boxShadow: "0px 0px 0px #000000",
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            backgroundColor: "#facc15", // Yellow-400
                                            color: "black",
                                            borderRadius: "50%",
                                            p: 0.5,
                                            mb: 0.2,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            border: "1.5px solid #000000"
                                        }}
                                    >
                                        <CompareArrows sx={{ fontSize: 18, strokeWidth: 2.5 }} />
                                    </Box>
                                    Swap
                                </Button>
                            }
                        />

                        <Button
                            onClick={() => setSendModal(true)}
                            fullWidth
                            sx={{
                                flex: 1,
                                backgroundColor: "#18181b",
                                color: "white",
                                py: 1.5,
                                borderRadius: "14px",
                                border: "2px solid #000000",
                                boxShadow: "4px 4px 0px #000000",
                                fontWeight: 800,
                                textTransform: "none",
                                fontSize: "0.95rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                                minWidth: 0,
                                transition: "all 0.1s ease-in-out",
                                "&:hover": {
                                    backgroundColor: "#27272a",
                                    transform: "translate(-2px, -2px)",
                                    boxShadow: "6px 6px 0px #000000",
                                },
                                "&:active": {
                                    transform: "translate(2px, 2px)",
                                    boxShadow: "0px 0px 0px #000000",
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    backgroundColor: "#ef4444", // Red-500
                                    color: "black",
                                    borderRadius: "50%",
                                    p: 0.5,
                                    mb: 0.2,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "1.5px solid #000000"
                                }}
                            >
                                <ArrowUpward sx={{ fontSize: 18, strokeWidth: 2.5 }} />
                            </Box>
                            {language === "es" ? "Enviar" : "Send"}
                        </Button>
                    </Stack>

                    {/* Collapsible Content */}
                    <Collapse in={expanded}>
                        <Box mt={4} mb={2}>
                            <ChainGrid chains={chains} onSelectChain={setSelectedChain} hideBalance={!showBalance} />
                        </Box>
                    </Collapse>
                </Box>

                {/* Expand Button */}
                <Box id="common-expand-btn" display="flex" justifyContent="center" pb={1} onClick={() => setExpanded(!expanded)}>
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
