
import { Box, MenuItem, Stack, TextField, Typography, SxProps } from "@mui/material";
import { Controller, Control } from "react-hook-form";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";

type UnifiedTokenSelectorProps = {
    label: string;
    control: Control<any>;
    setValue: (name: string, value: any, config?: any) => void;
    size?: "small" | "medium";
    currentChain?: string;
    currentToken?: string;
};

// Helper: Get all available tokens across all EVM chains
// Returns: Array of { chainKey, chainLabel, chainIcon, tokenName, tokenIcon, balance }
const getUnifiedAssets = (chainsWithBalances: any[]) => {
    const assets: any[] = [];

    // Prioritize major tokens/chains or just flat list?
    // Let's do flat list of all configured assets in NETWORKS
    Object.entries(NETWORKS).forEach(([chainKey, config]) => {
        if (!config.evm || !config.assets) return;

        // Try to find balance for this chain
        const chainBalData = chainsWithBalances.find(c => c.chainId === config.evm?.chain.id.toString());
        const tokenBalances = chainBalData?.tokens || {};

        config.assets.forEach(asset => {
            const balance = tokenBalances[asset.name] || 0;

            assets.push({
                id: `${chainKey}-${asset.name}`, // Unique ID
                chainKey: chainKey,
                chainLabel: config.label,
                chainIcon: config.icon,
                tokenName: asset.name,
                tokenIcon: asset.icon,
                balance: balance
            });
        });
    });

    // Sort by Balance (DESC) then Alphabetical
    return assets.sort((a, b) => {
        if (b.balance !== a.balance) return b.balance - a.balance;
        return a.tokenName.localeCompare(b.tokenName);
    });
};

export const UnifiedTokenSelector = ({ label, control, setValue, size, currentChain, currentToken }: UnifiedTokenSelectorProps) => {
    const chainsWithBalances = useXOWalletStore(s => s.mainWallet.chains);
    const allAssets = getUnifiedAssets(chainsWithBalances);

    // Sync form state (external) to dropdown state (internal ID)
    const computedValue = (currentChain && currentToken) ? `${currentChain}-${currentToken}` : "";

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
                                    setValue("sourceChain", asset.chainKey, { shouldValidate: true });
                                    setValue("sourceToken", asset.tokenName, { shouldValidate: true });
                                    // Default Dest Token to match Source
                                    setValue("destToken", asset.tokenName, { shouldValidate: true });
                                    // Default Dest Chain to Source Chain (safest default)
                                    setValue("destChain", asset.chainKey, { shouldValidate: true });
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
                                            <Box sx={{ position: 'relative', width: 32, height: 32 }}>
                                                <Box sx={{ width: '100%', height: '100%', '& svg': { width: '100%', height: '100%' } }}>
                                                    {asset.tokenIcon}
                                                </Box>
                                                <Box sx={{
                                                    position: 'absolute',
                                                    bottom: -2,
                                                    right: -2,
                                                    width: 14,
                                                    height: 14,
                                                    borderRadius: '50%',
                                                    bgcolor: '#fff',
                                                    zIndex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '1px solid #f0f0f0',
                                                    '& svg': { width: '100%', height: '100%' }
                                                }}>
                                                    {asset.chainIcon}
                                                </Box>
                                            </Box>

                                            <Box>
                                                <Typography fontWeight={700} lineHeight={1.1}>
                                                    {asset.tokenName}
                                                </Typography>
                                                <Typography fontSize={10} color="text.secondary" fontWeight={600}>
                                                    en {asset.chainLabel}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Typography fontSize={12} fontWeight={700} color={asset.balance > 0 ? "text.primary" : "text.secondary"}>
                                            {asset.balance > 0 ? asset.balance.toLocaleString('en-US', { maximumFractionDigits: 6 }) : "0"}
                                        </Typography>
                                    </Stack>
                                </MenuItem>
                            ))}
                        </TextField>
                    );
                }}
            />
        </Box>
    );
};
