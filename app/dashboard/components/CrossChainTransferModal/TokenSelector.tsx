import { Box, Typography, TextField, MenuItem, Stack } from "@mui/material";
import { Controller, Control } from "react-hook-form";
import { FormValues, STELLAR_CHAIN_KEY } from "@/app/dashboard/hooks/useCrossChainTransfer";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";
import { StellarIcon } from "@/app/components/atoms/StellarIcon";

type TokenSelectorProps = {
    control: Control<FormValues>;
    destChain: string;
};

export const TokenSelector = ({ control, destChain }: TokenSelectorProps) => {
    // Only show if destination is Stellar
    if (destChain !== STELLAR_CHAIN_KEY) return null;

    return (
        <Box>
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
                Token destino
            </Typography>
            <Controller
                control={control}
                name="destToken"
                defaultValue="USDC"
                render={({ field }) => (
                    <TextField
                        select
                        fullWidth
                        {...field}
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
                                }
                            }
                        }}
                    >
                        <MenuItem value="USDC">
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UsdcIcon size={24} />
                                </Box>
                                <Typography fontWeight={600}>USDC</Typography>
                            </Stack>
                        </MenuItem>
                        <MenuItem value="XLM">
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <StellarIcon />
                                </Box>
                                <Typography fontWeight={600}>XLM (Native)</Typography>
                            </Stack>
                        </MenuItem>
                    </TextField>
                )}
            />
        </Box>
    );
};
