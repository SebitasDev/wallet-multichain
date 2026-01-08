
import { Control, Controller, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import {
    MenuItem,
    Stack,
    TextField,
    Typography,
    Box,
    Button,
    InputAdornment
} from "@mui/material";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { TokenSelector } from "@/app/dashboard/components/CrossChainTransferModal/TokenSelector";
import { UnifiedTokenSelector } from "./UnifiedTokenSelector"; // [NEW IMPORT]
import { useLanguageStore } from "@/app/store/useLanguageStore";
import { useState, useEffect } from "react";
import { useLocalCurrency } from "@/app/hooks/useLocalCurrency";

type Props = {
    control: Control<any>;
    errors: FieldErrors<any>;
    sendLoading: boolean;
    setValue: UseFormSetValue<any>;
    watch: UseFormWatch<any>;
    maxSendAmount: number;
    isExceedingMax: boolean;
    tokenPrice?: number | null;
};

export const CommonCrossChainModalForm = ({ control, errors, sendLoading, setValue, watch, maxSendAmount, isExceedingMax, tokenPrice }: Props) => {
    const { language } = useLanguageStore();
    const sourceChain = watch("sourceChain" as any);
    const { code: localCode, rate: localRate } = useLocalCurrency();
    const watchAmount = watch("amount" as any);
    const selectedToken = watch("sourceToken" as any);

    // 3-Way Toggle Logic (Token/USD/Local)
    type CurrencyMode = 'TOKEN' | 'USD' | 'LOCAL';
    const availableModes: CurrencyMode[] = (localCode === "USD" || !localCode) ? ['TOKEN', 'USD'] : ['TOKEN', 'USD', 'LOCAL'];

    const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('TOKEN');
    const [displayAmount, setDisplayAmount] = useState("");

    // Sync display amount
    useEffect(() => {
        if (!watchAmount) {
            setDisplayAmount("");
            return;
        }
        const val = parseFloat(watchAmount);
        if (isNaN(val)) return;
        const price = tokenPrice || 0;

        if (currencyMode === 'TOKEN') {
            setDisplayAmount(watchAmount);
        } else if (currencyMode === 'USD') {
            const usdVal = val * price;
            setDisplayAmount(
                (usdVal > 0 && usdVal < 0.01)
                    ? usdVal.toFixed(6).replace(/\.?0+$/, "")
                    : usdVal.toFixed(2)
            );
        } else {
            // Local
            const localVal = val * price * localRate;
            setDisplayAmount(
                (localVal > 0 && localVal < 0.01)
                    ? localVal.toFixed(6).replace(/\.?0+$/, "")
                    : localVal.toFixed(2)
            );
        }
    }, [currencyMode, tokenPrice, localRate, watchAmount]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.value;
        setDisplayAmount(val);

        if (!val) {
            setValue("amount", "");
            return;
        }

        const numVal = parseFloat(val);
        if (isNaN(numVal)) return;

        const price = tokenPrice || 0;

        if (currencyMode === 'TOKEN') {
            setValue("amount", val);
        } else if (currencyMode === 'USD') {
            if (price === 0) return;
            const tokenVal = numVal / price;
            setValue("amount", tokenVal.toFixed(18).replace(/\.?0+$/, ""));
        } else {
            if (price === 0 || !localRate) return;
            const tokenVal = numVal / localRate / price;
            setValue("amount", tokenVal.toFixed(18).replace(/\.?0+$/, ""));
        }
    };

    const convertToDisplay = (tokenAmt: string) => {
        if (!tokenAmt) return "";
        const val = parseFloat(tokenAmt);
        if (isNaN(val)) return "";

        const price = tokenPrice || 0;
        const localVal = val * price * localRate;
        const usdVal = val * price;

        const tokenStr = `≈ ${val.toFixed(6)} ${selectedToken || "USDC"}`;
        const usdStr = `≈ $${usdVal.toFixed(2)} USD`;
        const localStr = `≈ $${localVal.toLocaleString("es-AR", { maximumFractionDigits: 2 })} ${localCode}`;

        return (
            <Stack component="span" spacing={0}>
                {currencyMode === 'TOKEN' && (
                    <>
                        <Typography component="span" variant="caption" display="block" sx={{ fontWeight: 600 }}>
                            {localStr}
                        </Typography>
                        {localCode !== "USD" && (
                            <Typography component="span" variant="caption" display="block" color="text.secondary">
                                {usdStr}
                            </Typography>
                        )}
                    </>
                )}
                {currencyMode === 'USD' && (
                    <>
                        <Typography component="span" variant="caption" display="block" sx={{ fontWeight: 600 }}>
                            {localStr}
                        </Typography>
                        <Typography component="span" variant="caption" display="block" color="text.secondary">
                            {tokenStr}
                        </Typography>
                    </>
                )}
                {currencyMode === 'LOCAL' && (
                    <>
                        <Typography component="span" variant="caption" display="block" sx={{ fontWeight: 600 }}>
                            {usdStr}
                        </Typography>
                        <Typography component="span" variant="caption" display="block" color="text.secondary">
                            {tokenStr}
                        </Typography>
                    </>
                )}
            </Stack>
        );
    };

    return (
        <Stack spacing={1.5}>
            {/* TOKEN A ENVIAR (Unified Selector) */}
            <Box>
                <UnifiedTokenSelector
                    label={language === "es" ? "Token a enviar" : "Token to send"}
                    control={control}
                    setValue={setValue}
                    size="small"
                    currentChain={sourceChain}
                    currentToken={selectedToken}
                    tokenPrice={tokenPrice} // [NEW]
                />
            </Box>

            {/* CHAIN DESTINO (Restored) */}
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
                    {language === "es" ? "Red de destino" : "Destination Network"}
                </Typography>
                <Controller
                    control={control as any}
                    name="destChain"
                    render={({ field }) => (
                        <TextField
                            select
                            fullWidth
                            size="small"
                            disabled={sendLoading}
                            {...field}
                            error={!!errors.destChain}
                            helperText={(errors.destChain as any)?.message}
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
                                    "&.Mui-disabled": {
                                        background: "#e5e5e5",
                                    }
                                },
                            }}
                        >
                            {Object.entries(NETWORKS).filter(([k, cfg]) => !!cfg.evm).map(([key, cfg]) => (
                                <MenuItem key={key} value={key}>
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
                                            {cfg.icon}
                                        </Box>
                                        <Typography fontWeight={600}>{cfg.label}</Typography>
                                    </Stack>
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                />
            </Box>

            {/* ADDRESS DESTINO */}
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
                    {language === "es" ? "Dirección de destino" : "Destination Address"}
                </Typography>
                <Controller
                    control={control as any}
                    name="recipient"
                    render={({ field }) => (
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="0x..."
                            disabled={sendLoading}
                            {...field}
                            error={!!errors.recipient}
                            helperText={(errors.recipient as any)?.message}
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
                                    },
                                    "&.Mui-disabled": {
                                        background: "#e5e5e5",
                                    }
                                },
                            }}
                        />
                    )}
                />
            </Box>

            {/* MONTO */}
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                    {/* LEFT: Label & Controls */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography
                            fontWeight={700}
                            fontSize={12}
                            sx={{
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                color: "#666666"
                            }}
                        >
                            {language === "es" ? "Monto" : "Amount"}
                        </Typography>

                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <Button
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrencyMode('TOKEN');
                                }}
                                sx={{
                                    minWidth: "auto",
                                    height: 28,
                                    px: 1.5,
                                    fontSize: 11,
                                    fontWeight: 800,
                                    borderRadius: 2,
                                    textTransform: "none",
                                    backgroundColor: currencyMode === 'TOKEN' ? "#000" : "transparent",
                                    color: currencyMode === 'TOKEN' ? "#fff" : "#666",
                                    border: "1px solid",
                                    borderColor: currencyMode === 'TOKEN' ? "#000" : "#e0e0e0",
                                    "&:hover": {
                                        backgroundColor: currencyMode === 'TOKEN' ? "#333" : "#f5f5f5",
                                    }
                                }}
                            >
                                {selectedToken || "USDC"}
                            </Button>

                            <Button
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrencyMode('USD');
                                }}
                                sx={{
                                    minWidth: "auto",
                                    height: 28,
                                    px: 1.5,
                                    fontSize: 11,
                                    fontWeight: 800,
                                    borderRadius: 2,
                                    textTransform: "none",
                                    backgroundColor: currencyMode === 'USD' ? "#000" : "transparent",
                                    color: currencyMode === 'USD' ? "#fff" : "#666",
                                    border: "1px solid",
                                    borderColor: currencyMode === 'USD' ? "#000" : "#e0e0e0",
                                    "&:hover": {
                                        backgroundColor: currencyMode === 'USD' ? "#333" : "#f5f5f5",
                                    }
                                }}
                            >
                                USD
                            </Button>

                            {localCode !== 'USD' && (
                                <Button
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrencyMode('LOCAL');
                                    }}
                                    sx={{
                                        minWidth: "auto",
                                        height: 28,
                                        px: 1.5,
                                        fontSize: 11,
                                        fontWeight: 800,
                                        borderRadius: 2,
                                        textTransform: "none",
                                        backgroundColor: currencyMode === 'LOCAL' ? "#000" : "transparent",
                                        color: currencyMode === 'LOCAL' ? "#fff" : "#666",
                                        border: "1px solid",
                                        borderColor: currencyMode === 'LOCAL' ? "#000" : "#e0e0e0",
                                        "&:hover": {
                                            backgroundColor: currencyMode === 'LOCAL' ? "#333" : "#f5f5f5",
                                        }
                                    }}
                                >
                                    {localCode || "ARS"}
                                </Button>
                            )}
                        </Stack>
                    </Stack>

                    {/* RIGHT: Max Button - Updated to show value in selected currency */}
                    <Typography
                        fontSize={10}
                        fontWeight={700}
                        sx={{
                            color: "#ff4444",
                            bgcolor: "rgba(255, 68, 68, 0.1)",
                            px: 1,
                            py: 0.2,
                            borderRadius: 1,
                            border: "1px solid #ff4444",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                        }}
                        onClick={() => {
                            const price = tokenPrice || 0;
                            if (currencyMode === 'LOCAL') {
                                if (price > 0 && localRate) {
                                    const maxFiat = maxSendAmount * price * localRate;
                                    setDisplayAmount(maxFiat.toFixed(2));
                                    setValue("amount", maxSendAmount.toString(), { shouldValidate: true });
                                }
                            } else if (currencyMode === 'USD') {
                                if (price > 0) {
                                    const maxUsd = maxSendAmount * price;
                                    setDisplayAmount(maxUsd.toFixed(2));
                                    setValue("amount", maxSendAmount.toString(), { shouldValidate: true });
                                }
                            } else {
                                setDisplayAmount(maxSendAmount.toString());
                                setValue("amount", maxSendAmount.toString(), { shouldValidate: true });
                            }
                        }}
                    >
                        {(() => {
                            const price = tokenPrice || 0;
                            let label = "";
                            if (currencyMode === 'LOCAL' && price > 0 && localRate) {
                                const maxFiat = maxSendAmount * price * localRate;
                                label = `≈ $${maxFiat.toLocaleString("es-AR", { maximumFractionDigits: 2 })} ${localCode || "ARS"}`;
                            } else if (currencyMode === 'USD' && price > 0) {
                                const maxUsd = maxSendAmount * price;
                                label = `≈ $${maxUsd.toFixed(2)} USD`;
                            } else {
                                label = `${maxSendAmount.toFixed(4)} ${selectedToken || "USDC"}`;
                            }
                            return language === "es" ? `Máx: ${label}` : `Max: ${label}`;
                        })()}
                    </Typography>
                </Stack>
                <Controller
                    control={control}
                    name="amount"
                    render={({ field }) => (
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="0.00"
                            disabled={sendLoading}
                            value={displayAmount || field.value}
                            onChange={handleAmountChange}
                            onBlur={field.onBlur}
                            inputRef={field.ref}

                            error={!!errors.amount || isExceedingMax}
                            helperText={(errors.amount as any)?.message || (isExceedingMax ? (language === "es" ? "Monto excede el máximo disponible" : "Amount exceeds available balance") : convertToDisplay(watchAmount))}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Typography fontWeight={700} fontSize={14} color="#666">
                                            {currencyMode === 'TOKEN' ? (selectedToken || "USDC") : currencyMode === 'USD' ? "USD" : (localCode || "ARS")}
                                        </Typography>
                                    </InputAdornment>
                                ),
                                sx: {
                                    borderRadius: 2,
                                    background: "#f5f5f5",
                                    border: isExceedingMax ? "2px solid #ff4444" : "2px solid #000000",
                                    fontWeight: 700,
                                    fontSize: 16,
                                    "&:hover": {
                                        background: "#ffffff",
                                    },
                                    "&.Mui-focused": {
                                        background: "#ffffff",
                                    },
                                    "&.Mui-disabled": {
                                        background: "#e5e5e5",
                                    }
                                },
                            }}
                        />
                    )}
                />
            </Box >
        </Stack >
    );
};
