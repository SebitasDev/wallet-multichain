import { Box, Stack, Typography, TextField, IconButton, InputAdornment } from "@mui/material";
import { Controller, Control, useWatch } from "react-hook-form";
import { FormValues } from "@/app/dashboard/hooks/transfer/usePrimaryTransfer";
import { SwapHoriz } from "@mui/icons-material";
import { useState, useEffect } from "react";

type AmountInputProps = {
    control: Control<FormValues>;
    isCrossChain: boolean;
    minAmount: number;
    watchAmount: string;
    isAmountValid: boolean;
    maxAmount: number;
    isExceedingMax?: boolean;
    token?: string;
    tokenPrice?: number | null;
    balance?: number;
    localCurrencyCode?: string;
    localCurrencyRate?: number;
};

export const AmountInput = ({
    control,
    isCrossChain,
    minAmount,
    watchAmount,
    isAmountValid,
    maxAmount,
    isExceedingMax,
    token = "USDC",
    balance = 0,
    tokenPrice = null,
    localCurrencyCode = "USD",
    localCurrencyRate = 1
}: AmountInputProps) => {
    const [isLocalMode, setIsLocalMode] = useState(false);
    const [localInputValue, setLocalInputValue] = useState("");

    // Sync local input when token amount changes externally (e.g. Max button)
    // Only if we are NOT currently typing (simple heuristic: if watchAmount changes drastically or we just switched)
    useEffect(() => {
        if (!watchAmount || !tokenPrice || !localCurrencyRate) {
            if (!watchAmount) setLocalInputValue("");
            return;
        }

        // If in token mode, we don't care about localInputValue except for switching
        // If in local mode, we want to ensure consistency, but avoid circular loop loops
        // Let's rely on calculation during render/toggle
    }, [watchAmount, tokenPrice, localCurrencyRate]);

    const handleToggle = () => {
        if (!tokenPrice) return;

        if (isLocalMode) {
            // Switching Local -> Token
            // The form already has the token amount, so just switch view
            setIsLocalMode(false);
        } else {
            // Switching Token -> Local
            // Calculate current local value from token amount
            const currentTokenAmount = parseFloat(watchAmount || "0");
            const valInUsd = currentTokenAmount * tokenPrice;
            const valInLocal = valInUsd * localCurrencyRate;
            setLocalInputValue(valInLocal > 0 ? valInLocal.toFixed(2) : "");
            setIsLocalMode(true);
        }
    };

    const onLocalChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (val: any) => void) => {
        const localVal = e.target.value;
        setLocalInputValue(localVal);

        if (!localVal || isNaN(parseFloat(localVal)) || !tokenPrice || tokenPrice === 0) {
            onChange("");
            return;
        }

        // Convert Local -> USD -> Token
        const valInUsd = parseFloat(localVal) / localCurrencyRate;
        const valInToken = valInUsd / tokenPrice;

        // Update form with Token Amount
        onChange(valInToken.toFixed(6)); // 6 decimals for token precision
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                        fontWeight={700}
                        fontSize={13}
                        sx={{
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "#666666"
                        }}
                    >
                        Monto {isLocalMode ? localCurrencyCode : token}
                    </Typography>
                    {tokenPrice && (
                        <IconButton
                            size="small"
                            onClick={handleToggle}
                            sx={{
                                padding: 0.5,
                                bgcolor: "rgba(0,0,0,0.05)",
                                "&:hover": { bgcolor: "rgba(0,0,0,0.1)" }
                            }}
                        >
                            <SwapHoriz fontSize="small" />
                        </IconButton>
                    )}
                </Stack>

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
                        Mín: {minAmount} {token}
                    </Typography>
                )}
                {!isLocalMode && (
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
                            if (isLocalMode) return; // Disable max in local mode for simplicity or calculate it
                            control.register("amount").onChange({ target: { value: maxAmount, name: "amount" } });
                        }}
                    >
                        Máx: {maxAmount} {token}
                    </Typography>
                )}
            </Stack>

            <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                        type="number"
                        placeholder={isLocalMode ? "0.00" : (isCrossChain ? `Mín. ${minAmount}` : "0.00")}
                        fullWidth
                        value={isLocalMode ? localInputValue : value}
                        onChange={(e) => {
                            if (isLocalMode) {
                                onLocalChange(e as React.ChangeEvent<HTMLInputElement>, onChange);
                            } else {
                                onChange(e);
                            }
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
                            startAdornment: isLocalMode ? (
                                <InputAdornment position="start">
                                    <Typography fontWeight={700} color="#000">{localCurrencyCode}</Typography>
                                </InputAdornment>
                            ) : undefined,
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
            <Stack direction="row" justifyContent="space-between" mt={0.5}>
                <Typography
                    sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#999999",
                    }}
                >
                    Balance: {balance.toFixed(6)} {token}
                </Typography>

                {/* Conversion Display */}
                {tokenPrice && watchAmount && !isNaN(parseFloat(watchAmount)) && (
                    <Typography
                        align="right"
                        sx={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#00DC8C",
                        }}
                    >
                        ≈ {isLocalMode
                            ? `${parseFloat(watchAmount).toFixed(6)} ${token}`
                            : (() => {
                                const valInUsd = parseFloat(watchAmount) * tokenPrice;
                                const valInLocal = valInUsd * localCurrencyRate;
                                return `$${valInLocal.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${localCurrencyCode}`;
                            })()
                        }
                    </Typography>
                )}
            </Stack>
        </Box >
    );
};
