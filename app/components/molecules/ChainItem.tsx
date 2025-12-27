"use client";

import { useState, useMemo } from "react";
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
import { ChainKey } from "@/app/types/chain";
import { getBalanceFromChain } from "@/app/hooks/useGetBalanceFromChain";
import { useEffect } from "react";

interface IChainItemProps {
    address: Address;
    chainKey: ChainKey;
}

export default function ChainItem({ address, chainKey }: IChainItemProps) {
    const [open, setOpen] = useState(false);

    const config = NETWORKS[chainKey];
    // This component seems to be built for EVM chains or needs adaptation for Stellar
    // For now assuming EVM or handling gracefully if evm missing?
    // But 'chainId' is required for finding wallet chain info.
    // If Stellar, chainId logic needs update (Stellar doesn't use number ID in same way?)
    // In useWalletsStore we used 'unknown' for non-evm.
    // If config.evm is missing, we might blank out or check nonEvm.
    const chainId = config.evm?.chain.id.toString() || "unknown"; // Handle non-EVM


    // Obtener todas las wallets y calcular el balance
    const wallets = useWalletStore((state) => state.wallets);

    const [assetsBalances, setAssetsBalances] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchBalances = async () => {
            if (!config.evm) return;

            const newBalances: Record<string, string> = {};

            await Promise.all(config.assets.map(async (asset) => {
                try {
                    const result = await getBalanceFromChain(
                        config.evm!.chain,
                        address,
                        asset.address as Address,
                        asset.decimals
                    );
                    newBalances[asset.name] = result.balance;
                } catch (e) {
                    console.error(`Error fetching balance for ${asset.name}`, e);
                    newBalances[asset.name] = "0";
                }
            }));

            setAssetsBalances(newBalances);
        };

        fetchBalances();
    }, [address, config, open]); // Re-fetch when opened or config changes


    // For the main display, we currently stick to the store's "amount" (which is primarily USDC)
    // or we could sum up USD values if we had prices. For now, keeping store value for the main row
    // to match the total balance logic of the app.
    const balance = useMemo(() => {
        const wallet = wallets.find(
            (w) => w.address.toLowerCase() === address.toLowerCase()
        );
        if (!wallet) return 0;
        const chainInfo = wallet.chains.find((c) => c.chainId === chainId);
        return chainInfo?.amount ?? 0;
    }, [wallets, address, chainId]);

    const formattedBalance = (Math.floor(Number(balance) * 100) / 100).toFixed(2);

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
                        ${formattedBalance}
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
                        {config.assets.map((asset) => {
                            const assetBal = assetsBalances[asset.name] || "0";
                            const assetDetailsBal = Number(assetBal).toFixed(6);
                            const assetFormattedBal = (Math.floor(Number(assetBal) * 100) / 100).toFixed(2);

                            return (
                                <ListItem
                                    key={asset.name}
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
                                            Balance: {assetDetailsBal}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flexShrink: 0 }}>
                                        {/* Usually we want USD price here, but assuming 1:1 for simplicity or raw amount if not stable? 
                                        The main UI shows $. If it's not stablecoin, this $ label is misleading if we don't multiply by price.
                                        But consistent with current app behavior which seems to treat "amount" mostly as USD or display generic?
                                        User said "no todos siempre tendran usdc". 
                                        For now, removing the '$' prefix for generic tokens to avoid confusion, or keeping it if we assume stable?
                                        Let's just show the raw balance in the main view for now or same formatted balance logic.
                                    */}
                                        <Typography
                                            fontWeight={800}
                                            sx={{
                                                fontSize: { xs: 13, sm: 14 },
                                                color: "#000000"
                                            }}
                                        >
                                            {assetFormattedBal}
                                        </Typography>
                                    </Box>
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>
            </Collapse>
        </>
    );
}
