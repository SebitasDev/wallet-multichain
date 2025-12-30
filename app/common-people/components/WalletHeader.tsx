
"use client";

import { useState } from "react";
import { Box, Typography, Button, Switch, Stack, Collapse } from "@mui/material";
import { ArrowDownward, ArrowUpward, Login, ExpandMore, ExpandLess, Visibility, VisibilityOff } from "@mui/icons-material";
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
    BNB,
    GNOSIS
} from "@/app/constants/chais";

import { useLocalCurrency } from "@/app/hooks/useLocalCurrency";

import { useCurrencyStore } from "@/app/store/useCurrencyStore";
import { Loop, Language, CompareArrows, Refresh } from "@mui/icons-material"; // Icons
import { useLanguageStore } from "@/app/store/useLanguageStore";
import { useUserStore } from "@/app/store/useUserStore";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore";
import { CrossChainTransferModal } from "@/app/dashboard/components/CrossChainTransferModal";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletStore } from "@/app/store/useWalletsStore";

export function WalletHeader() {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { language, toggleLanguage } = useLanguageStore();
    const { name, showBalance, setShowBalance } = useUserStore();
    const { useLocal, toggleCurrency } = useCurrencyStore();
    const { openReceive } = useDashboardModalsStore();
    const { setSendModal } = useSendMoneyStore();
    const { mainWallet, refreshMainWalletBalances } = useXOWalletStore();
    const { updateWalletBalances } = useWalletStore();

    // Calculate total balance across all chains
    const totalBalance = (mainWallet.chains || []).reduce((acc, chain) => acc + (chain.amount || 0), 0);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                refreshMainWalletBalances(),
                updateWalletBalances()
            ]);
        } catch (error) {
            console.error("Failed to refresh balances:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Local currency hook
    const { code: localCode, formatParts: formatLocalParts, loading, symbol: localSymbol, rate: currencyRate } = useLocalCurrency();

    // Determine values based on preference
    const isLocal = useLocal && !loading;
    const currentCode = isLocal ? localCode : "USD";
    const currentSymbol = isLocal ? localSymbol : "$";

    // Helper to format balance for display (reused from chains logic, but slightly different for split)
    const formatMainBalance = (num: number) => {
        const fixed = num.toFixed(6); // Max 6 decimals
        const [int, dec] = fixed.split('.');
        // Remove trailing zeros from decimal part
        let cleanedDec = dec.replace(/0+$/, '');
        // Ensure at least 2 decimals for main display aesthetics for USD?
        // If 0 -> 00. If 0.1 -> 10.
        if (cleanedDec.length < 2) {
            cleanedDec = cleanedDec.padEnd(2, '0');
        }
        return { int, dec: cleanedDec };
    };

    // Parse formatted parts
    let integerPart = "0";
    let decimalPart = "00";
    let decimalSeparator = ".";

    if (isLocal) {
        const parts = formatLocalParts(totalBalance);
        integerPart = parts.filter(p => p.type === "integer" || p.type === "group").map(p => p.value).join("");
        decimalPart = parts.find(p => p.type === "fraction")?.value || "00";
        decimalSeparator = parts.find(p => p.type === "decimal")?.value || ".";
    } else {
        const formatted = formatMainBalance(totalBalance);
        integerPart = formatted.int;
        decimalPart = formatted.dec;
        decimalSeparator = ".";
    }

    // Template for static data (icons, colors, ids)
    const staticChainsData = [
        { id: "base", name: "Base", icon: BASE.icon, color: "#0052FF", configAssets: BASE.assets },
        { id: "optimism", name: "Optimism", icon: OPTIMISM.icon, color: "#FF0420", configAssets: OPTIMISM.assets },
        { id: "arbitrum", name: "Arbitrum", icon: ARBITRUM.icon, color: "#12AAFF", configAssets: ARBITRUM.assets },
        { id: "gnosis", name: "Gnosis", icon: GNOSIS.icon, color: "#04795B", configAssets: GNOSIS.assets }, // [MOVED UP]
        { id: "polygon", name: "Polygon", icon: POLYGON.icon, color: "#8247E5", configAssets: POLYGON.assets },
        { id: "avalanche", name: "Avalanche", icon: AVALANCHE.icon, color: "#E84142", configAssets: AVALANCHE.assets },
        { id: "bnb", name: "BNB Chain", icon: BNB.icon, color: "#F3BA2F", configAssets: BNB.assets },
        { id: "unichain", name: "Unichain", icon: UNICHAIN.icon, color: "#FF007A", configAssets: UNICHAIN.assets },
        { id: "worldchain", name: "World Chain", icon: WORLD_CHAIN.icon, color: "#000000", configAssets: WORLD_CHAIN.assets },
        { id: "monad", name: "Monad", icon: Monad.icon, color: "#836EF9", configAssets: Monad.assets },
        { id: "stellar", name: "Stellar", icon: STELLAR.icon, color: "#3E1B3C", configAssets: STELLAR.assets },
    ];

    // Helper to format balance: max 6 decimals, no rounding (truncation)
    const formatBalance = (num: number) => {
        if (!num) return "0.00";
        // Convert to fixed string with high precision to avoid scientific notation
        const fixed = num.toFixed(10);
        // extract integer and up to 6 decimals
        const [int, dec] = fixed.split('.');
        const truncatedDec = dec.slice(0, 6);
        // reconstruct
        let val = `${int}.${truncatedDec}`;
        // Remove trailing zeros, but keep at least two decimals if it was a float? 
        // User wants "max 6". "0.14" is 2. "0.141234" is 6.
        // If result is 0.140000 -> 0.14
        val = val.replace(/0+$/, '').replace(/\.$/, '');
        // Ensure "0.00" style for zero? Or just allow "0"? 
        // Screenshot shows "0.00".
        if (val === "0" || val === "") return "0.00";
        // If it looks like "0.1", maybe "0.10" is better?
        // Let's stick to strict truncation + cleanup. 
        // If the user wants 2 decimals minimum, we might need check.
        // Assuming "0.14" suffices.
        return val;
    };

    const chains: ChainData[] = staticChainsData.map(chainMetadata => {
        // Find corresponding chain in wallet store
        let storeChainId = "unknown";
        if (chainMetadata.id === "stellar") {
            storeChainId = "stellar";
        } else {
            // @ts-ignore
            storeChainId = chainMetadata.configAssets === BASE.assets ? BASE.evm?.chain.id.toString() :
                chainMetadata.configAssets === OPTIMISM.assets ? OPTIMISM.evm?.chain.id.toString() :
                    chainMetadata.configAssets === ARBITRUM.assets ? ARBITRUM.evm?.chain.id.toString() :
                        chainMetadata.configAssets === POLYGON.assets ? POLYGON.evm?.chain.id.toString() :
                            chainMetadata.configAssets === AVALANCHE.assets ? AVALANCHE.evm?.chain.id.toString() :
                                chainMetadata.configAssets === BNB.assets ? BNB.evm?.chain.id.toString() :
                                    chainMetadata.configAssets === UNICHAIN.assets ? UNICHAIN.evm?.chain.id.toString() :
                                        chainMetadata.configAssets === WORLD_CHAIN.assets ? WORLD_CHAIN.evm?.chain.id.toString() :
                                            chainMetadata.configAssets === Monad.assets ? Monad.evm?.chain.id.toString() :
                                                chainMetadata.configAssets === GNOSIS.assets ? GNOSIS.evm?.chain.id.toString() : "unknown";
        }

        const walletChain = (mainWallet.chains || []).find(c => c.chainId === storeChainId);
        const totalAmount = walletChain ? walletChain.amount : 0;

        // Convert to local currency for totalValue string fallback/calculation if needed elsewhere
        const finalValue = (isLocal && !loading) ? totalAmount * currencyRate : totalAmount;

        // Helper to format any amount
        const getFormattedParts = (amount: number) => {
            if (isLocal) {
                const parts = formatLocalParts(amount);
                const integer = parts.filter(p => p.type === "integer" || p.type === "group").map(p => p.value).join("");
                const decimal = parts.find(p => p.type === "fraction")?.value || "00";
                return {
                    symbol: localSymbol,
                    integer,
                    decimal,
                    code: localCode
                };
            } else {
                const { int, dec } = formatMainBalance(amount);
                return {
                    symbol: "$",
                    integer: int,
                    decimal: dec,
                    code: undefined // Don't show USD code, just symbol
                };
            }
        };

        const formattedBalance = getFormattedParts(totalAmount);

        return {
            id: chainMetadata.id,
            name: chainMetadata.name,
            icon: chainMetadata.icon,
            totalValue: formatBalance(finalValue),
            formattedBalance,
            color: chainMetadata.color,
            assets: chainMetadata.configAssets.map(asset => {
                const tokenBal = walletChain && walletChain.tokens ? (walletChain.tokens[asset.name] || 0) : 0;
                return {
                    symbol: asset.name,
                    balance: formatBalance(tokenBal),
                    value: `$${formatBalance(tokenBal)}`,
                    formattedValue: getFormattedParts(tokenBal),
                    icon: asset.icon
                };
            })
        };
    });

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

                        <Box display="flex" gap={1}>
                            {/* Refresh Button */}
                            <Box
                                onClick={handleRefresh}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    px: 1,
                                    py: 0.5,
                                    backgroundColor: "rgba(0,0,0,0.1)",
                                    borderRadius: "8px",
                                    border: "1px solid black",
                                    transition: "all 0.2s",
                                    "&:hover": { backgroundColor: "rgba(0,0,0,0.2)" },
                                    "&:active": { transform: "scale(0.95)" }
                                }}
                            >
                                <Refresh
                                    sx={{
                                        fontSize: 16,
                                        animation: isRefreshing ? "spin 1s linear infinite" : "none",
                                        "@keyframes spin": {
                                            "0%": { transform: "rotate(0deg)" },
                                            "100%": { transform: "rotate(360deg)" }
                                        }
                                    }}
                                />
                            </Box>

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
