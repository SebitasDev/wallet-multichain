
import { Box, MenuItem, Stack, TextField, Typography, SxProps } from "@mui/material";
import { Controller, Control } from "react-hook-form";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { pricesApi } from "@/app/services/api"; // [NEW]
import { useLocalCurrency } from "@/app/hooks/useLocalCurrency"; // [NEW]
import { useEffect, useState, useMemo } from "react"; // [NEW]

type UnifiedTokenSelectorProps = {
    label: string;
    control: Control<any>;
    setValue: (name: string, value: any, config?: any) => void;
    size?: "small" | "medium";
    currentChain?: string;
    currentToken?: string;
    tokenPrice?: number | null; // [NEW]
};

// Helper: Get aggregated tokens across all EVM chains
// Returns: Array of { id, tokenName, tokenIcon, totalBalance, bestChain, coingeckoId }
const getUnifiedAssets = (chainsWithBalances: any[]) => {
    const assetMap = new Map<string, any>();

    Object.entries(NETWORKS).forEach(([chainKey, config]) => {
        if (!config.evm || !config.assets) return;

        // Try to find balance for this chain
        const chainBalData = chainsWithBalances.find(c => c.chainId === config.evm?.chain.id.toString());
        const tokenBalances = chainBalData?.tokens || {};

        config.assets.forEach(asset => {
            const balance = tokenBalances[asset.name] || 0;

            if (!assetMap.has(asset.name)) {
                assetMap.set(asset.name, {
                    id: asset.name, // Use symbol as ID for aggregation
                    tokenName: asset.name,
                    tokenIcon: asset.icon,
                    coingeckoId: asset.coingeckoId,
                    totalBalance: 0,
                    bestChain: chainKey,
                    bestChainLabel: config.label, // [NEW] Store initial label
                    maxChainBalance: -1
                });
            }

            const current = assetMap.get(asset.name);
            current.totalBalance += balance;

            // Determine best chain (highest balance)
            if (balance > current.maxChainBalance) {
                current.maxChainBalance = balance;
                current.bestChain = chainKey;
                current.bestChainLabel = config.label; // [NEW] Update label
            }
        });
    });

    const assets = Array.from(assetMap.values());

    // Sort by Total Balance (DESC) then Alphabetical
    return assets.sort((a, b) => {
        if (b.totalBalance !== a.totalBalance) return b.totalBalance - a.totalBalance;
        return a.tokenName.localeCompare(b.tokenName);
    });
};

export const UnifiedTokenSelector = ({ label, control, setValue, size, currentChain, currentToken, tokenPrice }: UnifiedTokenSelectorProps) => {
    const chainsWithBalances = useXOWalletStore(s => s.mainWallet.chains);
    const allAssets = useMemo(() => getUnifiedAssets(chainsWithBalances), [chainsWithBalances]); // Memoize assets

    // [NEW] Currency Logic
    const { formatAmount } = useLocalCurrency();
    const [prices, setPrices] = useState<Record<string, { usd: number }>>({});

    useEffect(() => {
        const fetchPrices = async () => {
            const ids = new Set<string>();
            allAssets.forEach(a => {
                if (a.coingeckoId) ids.add(a.coingeckoId);
            });
            // Ensure USDC logic (sometimes manual) but API handles it
            if (ids.size === 0) return;

            try {
                const data = await pricesApi.getPrices(Array.from(ids));
                setPrices(data);
            } catch (error) {
                console.error("Failed to fetch prices for selector:", error);
            }
        };
        fetchPrices();
    }, [allAssets]);

    // Sync form state (external) to dropdown state (internal ID)
    // Now ID is just tokenName, so we look for matching asset by token name
    // If we have selectedToken, we find the asset and that's our value.
    const computedValue = currentToken || "";

    return (
        <Box>
            <Typography
                fontWeight={700}
                fontSize={12}
                sx={{
                    mb: 0.5,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: "#666666"
                }}
            >
                {label}
            </Typography>

            <Controller
                control={control}
                name="unifiedAssetId"
                render={({ field }) => {
                    const finalValue = computedValue || field.value || "";

                    return (
                        <TextField
                            select
                            fullWidth
                            size={size || "medium"}
                            value={finalValue}
                            onChange={(e) => {
                                const selectedId = e.target.value;
                                field.onChange(selectedId);

                                const asset = allAssets.find(a => a.id === selectedId);
                                if (asset) {
                                    // Use bestChain for source
                                    setValue("sourceChain", asset.bestChain, { shouldValidate: true });
                                    setValue("sourceToken", asset.tokenName, { shouldValidate: true });
                                    // Default Dest Token to match Source
                                    setValue("destToken", asset.tokenName, { shouldValidate: true });
                                    // Default Dest Chain to bestChain (can be changed later)
                                    setValue("destChain", asset.bestChain, { shouldValidate: true });
                                }
                            }}

                            SelectProps={{
                                renderValue: (selectedId) => {
                                    if (!selectedId || typeof selectedId !== 'string') return "";
                                    const asset = allAssets.find(a => a.id === selectedId);
                                    if (!asset) return selectedId;

                                    return (
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Box sx={{ width: 32, height: 32 }}>
                                                    <Box sx={{ width: '100%', height: '100%', '& svg': { width: '100%', height: '100%' } }}>
                                                        {asset.tokenIcon}
                                                    </Box>
                                                </Box>

                                                <Box>
                                                    <Typography fontWeight={700} lineHeight={1.1}>
                                                        {asset.tokenName}
                                                    </Typography>
                                                    <Typography fontSize={10} color="text.secondary" fontWeight={600}>
                                                        Available on {asset.bestChainLabel}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            <Box textAlign="right">
                                                <Typography fontSize={12} fontWeight={700} color={asset.maxChainBalance > 0 ? "text.primary" : "text.secondary"}>
                                                    {asset.maxChainBalance > 0 ? asset.maxChainBalance.toLocaleString('en-US', { maximumFractionDigits: 6 }) : "0"}
                                                </Typography>

                                                {asset.maxChainBalance > 0 && (
                                                    <Typography fontSize={10} color="text.secondary" fontWeight={600}>
                                                        {(() => {
                                                            // Use prop tokenPrice if available and matches selected token
                                                            const isSelected = computedValue === asset.tokenName;
                                                            const externalPrice = (isSelected && tokenPrice) ? tokenPrice : null;

                                                            const price = externalPrice || ((asset.coingeckoId && prices[asset.coingeckoId]?.usd)
                                                                ? prices[asset.coingeckoId].usd
                                                                : (asset.tokenName.includes("USD") ? 1 : 0));

                                                            if (price > 0) {
                                                                return formatAmount(asset.maxChainBalance * price);
                                                            }
                                                            return ""; // No price
                                                        })()}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                    );
                                }
                            }}
                            InputProps={{
                                sx: {
                                    borderRadius: 2,
                                    background: "#f5f5f5",
                                    border: "2px solid #000000",
                                    fontWeight: 600,
                                    "&:hover": { background: "#ffffff" },
                                    "&.Mui-focused": { background: "#ffffff" },
                                }
                            }}
                        >
                            {allAssets.map((asset) => (
                                <MenuItem key={asset.id} value={asset.id}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <Box sx={{ width: 32, height: 32 }}>
                                                <Box sx={{ width: '100%', height: '100%', '& svg': { width: '100%', height: '100%' } }}>
                                                    {asset.tokenIcon}
                                                </Box>
                                            </Box>

                                            <Box>
                                                <Typography fontWeight={700} lineHeight={1.1}>
                                                    {asset.tokenName}
                                                </Typography>
                                                <Typography fontSize={10} color="text.secondary" fontWeight={600}>
                                                    Total Balance
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Box textAlign="right">
                                            <Typography fontSize={12} fontWeight={700} color={asset.totalBalance > 0 ? "text.primary" : "text.secondary"}>
                                                {asset.totalBalance > 0 ? asset.totalBalance.toLocaleString('en-US', { maximumFractionDigits: 6 }) : "0"}
                                            </Typography>

                                            {asset.totalBalance > 0 && (
                                                <Typography fontSize={10} color="text.secondary" fontWeight={600}>
                                                    {(() => {
                                                        const price = (asset.coingeckoId && prices[asset.coingeckoId]?.usd)
                                                            ? prices[asset.coingeckoId].usd
                                                            : (asset.tokenName.includes("USD") ? 1 : 0);

                                                        if (price > 0) {
                                                            return formatAmount(asset.totalBalance * price);
                                                        }
                                                        return ""; // No price
                                                    })()}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Stack>
                                </MenuItem>
                            ))}
                        </TextField>
                    );
                }}
            />
        </Box >
    );
};
