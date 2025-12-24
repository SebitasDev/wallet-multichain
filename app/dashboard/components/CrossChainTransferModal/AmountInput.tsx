import { Box, Stack, Typography, TextField } from "@mui/material";
import { Controller, Control } from "react-hook-form";
import { FormValues } from "@/app/dashboard/hooks/useCrossChainTransfer";

type AmountInputProps = {
    control: Control<FormValues>;
    isCrossChain: boolean;
    minAmount: number;
    watchAmount: string;
    isAmountValid: boolean;
    maxAmount: number;
    isExceedingMax?: boolean;
    token?: string; // Add optional token prop
};

export const AmountInput = ({
    control,
    isCrossChain,
    minAmount,
    watchAmount,
    isAmountValid,
    maxAmount,
    isExceedingMax,
    token = "USDC", // Default to USDC if not provided
    balance = 0
}: AmountInputProps & { balance?: number }) => (
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
                Monto {token}
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
                    Mínimo: {minAmount} {token}
                </Typography>
            )}
            <Typography
                fontSize={11}
                fontWeight={700}
                sx={{
                    color: "#ff4444",
                    bgcolor: "rgba(255, 68, 68, 0.1)",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    border: "1px solid #ff4444",
                    ml: 1,
                    cursor: "pointer"
                }}
                onClick={() => {
                    control.register("amount").onChange({ target: { value: maxAmount, name: "amount" } });
                }}
            >
                Máx: {maxAmount} {token}
            </Typography>
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
                    error={(!isAmountValid || isExceedingMax) && !!watchAmount}
                    helperText={
                        watchAmount
                            ? isExceedingMax
                                ? `Excede tu balance disponible (${maxAmount} ${token})`
                                : !isAmountValid
                                    ? `El monto debe ser al menos ${minAmount} ${token}`
                                    : ""
                            : ""
                    }
                    InputProps={{
                        sx: {
                            borderRadius: 2,
                            background: "#f5f5f5",
                            border: (!isAmountValid || isExceedingMax) && watchAmount
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
                            color: "#ff4444"
                        }
                    }}
                />
            )}
        />
        {/* Balance Display */}
        <Typography
            align="right"
            sx={{
                fontSize: 11,
                fontWeight: 600,
                color: "#999999",
                mt: 0.5
            }}
        >
            Balance: {balance.toFixed(6)} {token}
        </Typography>
    </Box >
);
