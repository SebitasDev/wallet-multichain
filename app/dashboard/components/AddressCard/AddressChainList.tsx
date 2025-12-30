"use client";

import {
    CardContent,
    List,
    Divider,
    CardActions,
    Button,
} from "@mui/material";
import ChainItem from "@/app/components/molecules/ChainItem";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Address } from "abitype";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { pricesApi } from "@/app/services/api/prices";
import { useState, useEffect, useMemo } from "react";
import { ChainKey } from "@/app/types/chain";

interface AddressChainListProps {
    address: Address;
    showMore: boolean;
    toggleShowMore: () => void;
}

export const AddressChainList = ({
    address,
    showMore,
    toggleShowMore
}: AddressChainListProps) => {
    const wallets = useWalletStore((state) => state.wallets);
    const [chainBalances, setChainBalances] = useState<Record<string, number>>({});

    // 1. Calculate Balances for Sorting
    useEffect(() => {
        const fetchAllBalances = async () => {
            const allChainKeys = Object.keys(NETWORKS) as ChainKey[];
            // Collect all asset IDs to fetch prices once
            const allAssetIds = new Set<string>();
            allChainKeys.forEach(key => {
                NETWORKS[key].assets.forEach(asset => {
                    if (asset.coingeckoId) allAssetIds.add(asset.coingeckoId);
                });
            });

            try {
                const pricesData = await pricesApi.getPrices(Array.from(allAssetIds));
                const balances: Record<string, number> = {};

                const wallet = wallets.find(w => w.address.toLowerCase() === address.toLowerCase());

                allChainKeys.forEach(key => {
                    const config = NETWORKS[key];
                    const chainId = config.evm?.chain.id.toString() || "unknown"; // Determine Chain ID logic same as ChainItem
                    const chainInfo = wallet?.chains.find(c => c.chainId === chainId);
                    const tokens = (chainInfo?.tokens ?? {}) as Record<string, number>;

                    let total = 0;
                    config.assets.forEach(asset => {
                        const balance = tokens[asset.name] || 0;
                        const price = (asset.coingeckoId ? pricesData[asset.coingeckoId]?.usd : null) ?? (asset.name.includes("USD") ? 1 : 0);
                        total += balance * price;
                    });
                    balances[key] = total;
                });
                setChainBalances(balances);
            } catch (e) {
                console.error("Failed to fetch prices for sorting:", e);
            }
        };

        fetchAllBalances();
    }, [wallets, address]);

    // 2. Sort Chains & Filter by Address Type
    const sortedChains = useMemo(() => {
        const isEvmAddress = address.startsWith("0x");

        return (Object.keys(NETWORKS) as ChainKey[])
            .filter(key => {
                const config = NETWORKS[key];
                if (isEvmAddress) {
                    return !!config.evm; // Only show EVM chains
                } else {
                    return !!config.nonEvm; // Only show Non-EVM chains (Stellar)
                }
            })
            .sort((a, b) => {
                const balA = chainBalances[a] || 0;
                const balB = chainBalances[b] || 0;
                if (balA === balB) {
                    return 0;
                }
                return balB - balA; // Descending
            });
    }, [chainBalances, address]);

    // 3. Spilt Visible / Hidden
    // Initial visible count: 2 (Base, Optimism were default). Or 3? Let's do 3.
    const VISIBLE_COUNT = 3;
    const visibleChains = sortedChains.slice(0, VISIBLE_COUNT);
    const hiddenChains = sortedChains.slice(VISIBLE_COUNT);

    return (
        <>
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
                    <Divider />
                    {visibleChains.map((key) => (
                        <div key={key}>
                            <ChainItem address={address} chainKey={key} />
                            <Divider />
                        </div>
                    ))}

                    {/* Chains adicionales */}
                    {showMore && (
                        <>
                            {hiddenChains.map((key) => (
                                <div key={key}>
                                    <ChainItem address={address} chainKey={key} />
                                    <Divider />
                                </div>
                            ))}
                        </>
                    )}
                </List>
            </CardContent>

            {/* FOOTER / SHOW MORE BUTTON */}
            <Divider sx={{ borderColor: "#000000", borderWidth: "3px" }} />
            <CardActions
                sx={{
                    p: { xs: 1.5, sm: 2 },
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
                        fontSize: { xs: 13, sm: 14 },
                        py: { xs: 1, sm: 1.2 },
                        borderRadius: 3,
                        border: "2px solid #000000",
                        background: "#ffffff",
                        transition: "all 0.2s",
                        "&:hover": {
                            background: "#f5f5f5",
                            transform: "scale(1.01)",
                        },
                    }}
                    onClick={toggleShowMore}
                >
                    {showMore ? "Ocultar chains" : `Ver ${hiddenChains.length} chains más`}
                </Button>
            </CardActions>
        </>
    );
};
