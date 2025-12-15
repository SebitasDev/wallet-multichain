import { Box, Stack, Typography, TextField } from "@mui/material";
import { Controller, Control } from "react-hook-form";
import { FormValues } from "@/app/dashboard/hooks/useCrossChainTransfer";

type AmountInputProps = {
    control: Control<FormValues>;
    isCrossChain: boolean;
    minAmount: number;
    watchAmount: string;
    isAmountValid: boolean;
};

export const AmountInput = ({
    control,
    isCrossChain,
    minAmount,
    watchAmount,
    isAmountValid
}: AmountInputProps) => (
    <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography
                fontWeight={700}
                fontSize={13}
                sx={{
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: "#666666"
                }}
            >
                Monto USDC
            </Typography>
            {isCrossChain && (
                <Typography
                    fontSize={11}
                    fontWeight={700}
                    sx={{
                        color: "#00DC8C",
                        bgcolor: "rgba(0, 220, 140, 0.1)",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        border: "1px solid #00DC8C",
                    }}
                >
                    Mínimo: {minAmount} USDC
                </Typography>
            )}
        </Stack>
        <Controller
            control={control}
            name="amount"
            render={({ field }) => (
                <TextField
                    type="number"
                    placeholder={isCrossChain ? `Mín. ${minAmount}` : "0.00"}
                    fullWidth
                    inputProps={{
                        min: isCrossChain ? minAmount : 0,
                        step: "0.0001"
                    }}
                    {...field}
                    error={!isAmountValid && !!watchAmount}
                    helperText={
                        !isAmountValid && watchAmount
                            ? `El monto debe ser al menos ${minAmount} USDC`
                            : ""
                    }
                    InputProps={{
                        sx: {
                            borderRadius: 2,
                            background: "#f5f5f5",
                            border: !isAmountValid && watchAmount
                                ? "2px solid #ff4444"
                                : "2px solid #000000",
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
                    FormHelperTextProps={{
                        sx: {
                            fontWeight: 600,
                            fontSize: 12,
                            ml: 0.5,
                        }
                    }}
                />
            )}
        />
    </Box>
);
