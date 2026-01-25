
"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Box,
    Chip,
    Collapse,
    ListItemButton,
    ListItemSecondaryAction,
    Typography,
    List,
    ListItem
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";
import { Address } from "abitype";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey, UIAsset as Asset } from "@/app/types/chain";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { pricesApi } from "@/app/services/api/prices";

interface IChainItemProps {
    address: Address;
    chainKey: ChainKey;
}

// Helper component for individual tokens to handle price hooks
const TokenItem = ({ asset, balance, price }: { asset: Asset, balance: number, price?: number | null }) => {
    // If price is provided by parent, use it. Otherwise, could fetch, but we want consistency.
    // We'll rely on parent providing it for now to ensure sum matches total.

    const assetFormattedBal = (Math.floor(balance * 1000000) / 1000000).toFixed(6); // Show up to 6 decimals for quantity

    // Calculate USD Value
    let usdValue = 0;
    if (typeof price === "number") {
        usdValue = balance * price;
    } else if (asset.name.includes("USD")) {
        usdValue = balance; // Fallback for stablecoins if price missing
    }

    return (
        <ListItem
            sx={{
                backgroundColor: "#ffffff",
                border: "2px solid #000000",
                borderRadius: 3,
                py: 1.5,
                px: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 1,
                transition: "all 0.2s",
                "&:hover": {
                    backgroundColor: "#f5f5f5",
                    transform: "translateX(4px)",
                },
            }}
        >
            <Box sx={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                "& svg": { width: "100%", height: "100%" }
            }}>
                {asset.icon || <UsdcIcon size={32} />}
            </Box>

            <Box display="flex" flexDirection="column" flex={1} minWidth={0}>
                <Typography
                    fontWeight={800}
                    sx={{
                        fontSize: { xs: 13, sm: 14 },
                        color: "#000000"
                    }}
                >
                    {asset.name}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: "#666666",
                        fontWeight: 600,
                        fontSize: { xs: 11, sm: 12 }
                    }}
                >
                    Balance: {balance > 0 ? assetFormattedBal : "0.00"}
                </Typography>
            </Box>

            <Box sx={{ flexShrink: 0, textAlign: "right" }}>
                <Typography
                    fontWeight={800}
                    sx={{
                        fontSize: { xs: 13, sm: 14 },
                        color: "#000000"
                    }}
                >
                    {formatCurrency(usdValue)}
                </Typography>
            </Box>
        </ListItem>
    );
};

export default function ChainItem({ address, chainKey }: IChainItemProps) {
    const [open, setOpen] = useState(false);

    const config = NETWORKS[chainKey];
    const chainId = config.evm?.chain.id.toString() || "unknown";

    // Obtener todas las wallets y datos del store
    const wallets = useWalletStore((state) => state.wallets);

    const { tokens } = useMemo(() => {
        const wallet = wallets.find(
            (w) => w.address.toLowerCase() === address.toLowerCase()
        );
        if (!wallet) return { amount: 0, tokens: {} as Record<string, number> };
        const chainInfo = wallet.chains.find((c) => c.chainId === chainId);
        return {
            tokens: (chainInfo?.tokens ?? {}) as Record<string, number>
        };
    }, [wallets, address, chainId]);

    // --- Dynamic Price Calculation ---
    const [prices, setPrices] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchChainPrices = async () => {
            const ids = config.assets
                .map(a => a.coingeckoId)
                .filter((id): id is string => !!id);

            if (ids.length === 0) return;

            try {
                const pricesData = await pricesApi.getPrices(ids);
                const newPrices: Record<string, number> = {};

                config.assets.forEach(asset => {
                    if (asset.coingeckoId && pricesData[asset.coingeckoId]?.usd) {
                        newPrices[asset.coingeckoId] = pricesData[asset.coingeckoId].usd;
                    } else if (asset.name.includes("USD")) {
                        newPrices[asset.coingeckoId || asset.name] = 1; // Fallback
                    }
                });
                setPrices(newPrices);
            } catch (error) {
                console.error("Failed to fetch prices for chain item", error);
            }
        };

        fetchChainPrices();
    }, [config.assets]);

    // Calculate Total Dynamically
    const dynamicTotal = useMemo(() => {
        let total = 0;
        config.assets.forEach(asset => {
            const balance = tokens[asset.name] || 0;
            const price = (asset.coingeckoId ? prices[asset.coingeckoId] : null) ?? (asset.name.includes("USD") ? 1 : 0);
            total += balance * price;
        });
        return total;
    }, [tokens, prices, config.assets]);


    // Use the dynamic total for display
    const formattedTotalBalance = formatCurrency(dynamicTotal);

    // Sort assets by USD value
    const sortedItems = useMemo(() => {
        return config.assets.map(asset => {
            const balance = Number(tokens[asset.name] || 0);
            const price = (asset.coingeckoId ? prices[asset.coingeckoId] : null) ?? (asset.name.includes("USD") ? 1 : 0);
            const usdValue = balance * price;
            return { asset, balance, price, usdValue };
        })
            .sort((a, b) => b.usdValue - a.usdValue);
    }, [config.assets, tokens, prices]);


    return (
        <>
            <ListItemButton
                sx={{
                    py: 2,
                    px: { xs: 2, sm: 3 },
                    transition: "all 0.2s",
                    "&:hover": {
                        backgroundColor: "#f5f5f5",
                    },
                }}
                onClick={() => setOpen(!open)}
            >
                <Box display="flex" alignItems="center" gap={{ xs: 1.5, sm: 2 }} flex={1} minWidth={0}>
                    <Box sx={{
                        width: { xs: 32, sm: 36 },
                        height: { xs: 32, sm: 36 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        "& svg": {
                            width: "100%",
                            height: "100%",
                        }
                    }}>
                        {config.icon}
                    </Box>

                    <Box flex={1} minWidth={0}>
                        <Typography
                            fontWeight={800}
                            sx={{
                                fontSize: { xs: 14, sm: 15 },
                                color: "#000000"
                            }}
                        >
                            {config.label}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: "#666666",
                                fontWeight: 600,
                                fontSize: { xs: 11, sm: 12 }
                            }}
                        >
                            {config.assets.length} tokens
                        </Typography>
                    </Box>
                </Box>

                <ListItemSecondaryAction
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: { xs: 0.5, sm: 1 },
                        pr: { xs: 1, sm: 2 },
                        right: { xs: 8, sm: 16 },
                    }}
                >
                    <Typography
                        fontWeight={800}
                        sx={{
                            fontSize: { xs: 13, sm: 15 },
                            color: "#000000",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {formattedTotalBalance}
                    </Typography>

                    <Chip
                        label={config.chipLabel}
                        size="small"
                        sx={{
                            backgroundColor: config.chipColor,
                            border: "2px solid #000000",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: { xs: 10, sm: 11 },
                            height: { xs: 22, sm: 24 },
                            "& .MuiChip-label": {
                                px: { xs: 1, sm: 1.5 },
                            }
                        }}
                    />

                    {open ? (
                        <ExpandMoreIcon
                            sx={{
                                fontSize: { xs: 18, sm: 20 },
                                color: "#000000"
                            }}
                        />
                    ) : (
                        <ChevronRightIcon
                            sx={{
                                fontSize: { xs: 18, sm: 20 },
                                color: "#000000"
                            }}
                        />
                    )}
                </ListItemSecondaryAction>
            </ListItemButton>

            {/* Dropdown tokens */}
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{ px: { xs: 2, sm: 4 }, py: 1.5, backgroundColor: "#f5f5f5" }}>
                    <List disablePadding>
                        {sortedItems.map(({ asset, balance, price }) => (
                            <TokenItem
                                key={asset.name}
                                asset={asset}
                                balance={balance}
                                price={price}
                            />
                        ))}
                    </List>
                </Box>
            </Collapse>
        </>
    );
}
