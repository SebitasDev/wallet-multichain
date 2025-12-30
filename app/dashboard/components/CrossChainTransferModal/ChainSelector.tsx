import { Box, Typography, TextField, MenuItem, Stack, SxProps, useTheme, useMediaQuery } from "@mui/material";
import { Controller, Control } from "react-hook-form";
import { FormValues, STELLAR_CHAIN_KEY } from "@/app/dashboard/hooks/transfer/useCrossChainTransfer";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { StellarIcon } from "@/app/components/atoms/StellarIcon";
import { FacilitatorChainKey } from "@/app/facilitator";

type ChainSelectorProps = {
    label: string;
    name: "sourceChain" | "destChain";
    control: Control<FormValues>;
    options: (FacilitatorChainKey | typeof STELLAR_CHAIN_KEY)[];
    hideLabel?: boolean;
    inputSx?: SxProps;
};

export const ChainSelector = ({ label, name, control, options, hideLabel, inputSx }: ChainSelectorProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
                render={({ field }) => (
                    <TextField
                        select
                        fullWidth
                        {...field}
                        SelectProps={{
                            renderValue: (selected: unknown) => {
                                const chain = selected as FacilitatorChainKey | typeof STELLAR_CHAIN_KEY;
                                let label = "";
                                let icon = null;

                                if (chain === STELLAR_CHAIN_KEY) {
                                    label = "Stellar";
                                    icon = <StellarIcon />;
                                } else {
                                    const config = NETWORKS[chain as keyof typeof NETWORKS];
                                    if (config) {
                                        label = config.label;
                                        icon = config.icon;
                                    }
                                }

                                const displayName = (isMobile && label.length > 5) ? `${label.substring(0, 5)}...` : label;

                                return (
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
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
                                            {icon}
                                        </Box>
                                        <Typography fontWeight={600}>
                                            {displayName}
                                        </Typography>
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
                        {options.map((chain) => {
                            // Handle Stellar manually
                            if (chain === STELLAR_CHAIN_KEY) {
                                return (
                                    <MenuItem key={chain} value={chain}>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
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
                                                <StellarIcon />
                                            </Box>
                                            <Typography fontWeight={600}>
                                                Stellar
                                            </Typography>
                                        </Stack>
                                    </MenuItem>
                                );
                            }

                            const chainConfig = NETWORKS[chain as keyof typeof NETWORKS];
                            if (!chainConfig) return null;

                            return (
                                <MenuItem key={chain} value={chain}>
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
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
                                            {chainConfig.icon}
                                        </Box>
                                        <Typography fontWeight={600}>
                                            {chainConfig.label}
                                        </Typography>
                                    </Stack>
                                </MenuItem>
                            );
                        })}
                    </TextField>
                )}
            />
        </Box>
    );
};
