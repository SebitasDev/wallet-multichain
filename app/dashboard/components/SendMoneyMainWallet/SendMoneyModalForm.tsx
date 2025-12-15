import { Box, Typography, TextField, MenuItem, Stack } from "@mui/material";
import { Control, Controller } from "react-hook-form";
import { FormValues, availableChains } from "@/app/dashboard/hooks/useSendMoneyMainWallet";
import { NETWORKS } from "@/app/constants/chainsInformation";

interface SendMoneyModalFormProps {
    control: Control<FormValues>;
}

export const SendMoneyModalForm = ({ control }: SendMoneyModalFormProps) => {
    return (
        <Stack spacing={2.5} mt={0.5}>
            {/* CHAIN */}
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
                    Chain destino
                </Typography>
                <Controller
                    control={control}
                    name="chain"
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
                            {availableChains.map((chainKey) => {
                                const chainConfig = NETWORKS[chainKey as keyof typeof NETWORKS];
                                return (
                                    <MenuItem key={chainKey} value={chainKey}>
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

            {/* ADDRESS DESTINO */}
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
                    Address destino
                </Typography>
                <Controller
                    control={control}
                    name="to"
                    render={({ field }) => (
                        <TextField
                            placeholder="0x..."
                            fullWidth
                            {...field}
                            InputProps={{
                                sx: {
                                    borderRadius: 2,
                                    background: "#f5f5f5",
                                    border: "2px solid #000000",
                                    fontWeight: 600,
                                    fontFamily: "monospace",
                                    "&:hover": {
                                        background: "#ffffff",
                                    },
                                    "&.Mui-focused": {
                                        background: "#ffffff",
                                    }
                                }
                            }}
                        />
                    )}
                />
            </Box>

            {/* MONTO */}
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
                    Monto (USD)
                </Typography>
                <Controller
                    control={control}
                    name="amount"
                    render={({ field }) => (
                        <TextField
                            type="number"
                            placeholder="0.00"
                            fullWidth
                            inputProps={{ min: 0, step: "0.0001" }}
                            {...field}
                            InputProps={{
                                sx: {
                                    borderRadius: 2,
                                    background: "#f5f5f5",
                                    border: "2px solid #000000",
                                    fontWeight: 700,
                                    fontSize: 16,
                                    "&:hover": {
                                        background: "#ffffff",
                                    },
                                    "&.Mui-focused": {
                                        background: "#ffffff",
                                    }
                                }
                            }}
                        />
                    )}
                />
            </Box>
        </Stack>
    );
};
