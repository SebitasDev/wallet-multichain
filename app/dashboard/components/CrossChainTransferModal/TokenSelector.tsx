import { Box, Typography, TextField, MenuItem, Stack, SxProps } from "@mui/material";
import { Controller, Control } from "react-hook-form";
import { FormValues, STELLAR_CHAIN_KEY } from "@/app/dashboard/hooks/transfer/usePrimaryTransfer";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { FacilitatorChainKey } from "@/app/facilitator";

// Helper to get assets from config
const getAssetsForChain = (chainKey: FacilitatorChainKey | typeof STELLAR_CHAIN_KEY) => {
    // Stellar
    if (chainKey === STELLAR_CHAIN_KEY) {
        return NETWORKS.Stellar.assets || [];
    }

    // EVM
    const config = NETWORKS[chainKey as keyof typeof NETWORKS];
    return config?.assets || [];
};

type TokenSelectorProps = {
    label: string;
    name: "sourceToken" | "destToken";
    control: Control<FormValues>;
    chain: FacilitatorChainKey | typeof STELLAR_CHAIN_KEY;
    hideLabel?: boolean;
    onChange?: (value: string) => void;
    inputSx?: SxProps;
    allowedTokens?: string[];
    balances?: Record<string, number>;
    defaultValue?: string;
    value?: string;
    size?: "small" | "medium"; // [NEW]
};

export const TokenSelector = ({ label, name, control, chain, hideLabel, inputSx, onChange, allowedTokens, balances, defaultValue, value, size }: TokenSelectorProps) => {
    let assets = getAssetsForChain(chain);

    if (allowedTokens && allowedTokens.length > 0) {
        assets = assets.filter(a => allowedTokens.includes(a.name));
    }

    // ... (keep comments)

    if (!assets || assets.length === 0) return null;

    // Helper for formatting
    const formatBalance = (val: number) => {
        if (val === 0) return "0";
        if (val < 0.000001) return "<0.000001";
        return val.toLocaleString("en-US", { maximumFractionDigits: 6 });
    };

    return (
        <Box>
            {!hideLabel && (
                <Typography
                    fontWeight={700}
                    fontSize={13}
                    sx={{
                        mb: 1,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: "#666666"
                    }}
                >
                    {label}
                </Typography>
            )}
            <Controller
                control={control}
                name={name}
                defaultValue={defaultValue}
                render={({ field }) => {
                    const currentValue = value !== undefined ? value : field.value;
                    return (
                        <TextField
                            select
                            fullWidth
                            size={size || "medium"} // [NEW] Use prop or default
                            {...field}
                            onChange={(e) => {
                                field.onChange(e);
                                if (onChange) onChange(e.target.value);
                            }}
                            // Ensure the value matches an available asset, or default to first if mismatch
                            value={assets.some(a => a.name === currentValue) ? currentValue : assets[0]?.name || ""}
                            InputProps={{
                                sx: {
                                    borderRadius: 2,
                                    background: "#f5f5f5",
                                    border: "2px solid #000000",
                                    fontWeight: 600,
                                    "&:hover": {
                                        background: "#ffffff",
                                    },
                                    "&.Mui-focused": {
                                        background: "#ffffff",
                                    },
                                    ...inputSx
                                }
                            }}
                        >
                            {assets.map((asset) => (
                                <MenuItem key={asset.name} value={asset.name}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            {asset.icon && (
                                                <Box sx={{
                                                    width: 24,
                                                    height: 24,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    "& svg": {
                                                        width: "100%",
                                                        height: "100%",
                                                    }
                                                }}>
                                                    {asset.icon}
                                                </Box>
                                            )}
                                            <Typography fontWeight={600}>
                                                {asset.name}
                                            </Typography>
                                        </Stack>
                                        {balances && balances[asset.name] !== undefined && (
                                            <Typography fontSize={12} color="#666666" fontWeight={600}>
                                                {formatBalance(balances[asset.name])}
                                            </Typography>
                                        )}
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
