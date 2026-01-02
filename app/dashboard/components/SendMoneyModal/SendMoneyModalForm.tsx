import { Control, Controller, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import {
    MenuItem,
    Stack,
    TextField,
    Typography,
    Switch,
    FormControlLabel,
    Box,
    Button // [NEW] Added Button
} from "@mui/material";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { TokenSelector } from "../CrossChainTransferModal/TokenSelector";
import { SendForm } from "@/app/lib/zod/sendSchema";
import { useLanguageStore } from "@/app/store/useLanguageStore";
import { SwapHoriz } from "@mui/icons-material"; // [NEW]
import { useState, useEffect } from "react"; // [NEW]
import { InputAdornment, IconButton } from "@mui/material"; // [NEW]
// ... imports
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore"; // [NEW]
import { useLocalCurrency } from "@/app/hooks/useLocalCurrency"; // [NEW]

type Props = {
    control: Control<any>;
    errors: FieldErrors<any>;
    sendLoading: boolean;
    setValue: UseFormSetValue<any>;
    watch: UseFormWatch<any>;
    maxSendAmount: number;
    isExceedingMax: boolean;
    variant: "default" | "simplified"; // [NEW]
    tokenPrice?: number | null; // [NEW]
};

// Re-using TokenSelector requires matching props or adapter. 
// TokenSelector expects `chain` and `control`. 
// We will adapt it here.

export const SendMoneyModalForm = ({ control, errors, sendLoading, setValue, watch, maxSendAmount, isExceedingMax, variant, tokenPrice }: Props) => {
    const { language } = useLanguageStore();
    const selectedChain = watch("destChain" as any);
    const selectedToken = watch("sourceToken" as any); // [NEW] Watch token
    const { initialChain, lockChain } = useSendMoneyStore(); // [NEW] Check for prefill and lock

    const { code: localCode, rate: localRate } = useLocalCurrency(); // e.g. "ARS", 1200
    const watchAmount = watch("amount" as any);

    // [NEW] 3-Way Toggle State
    type CurrencyMode = 'TOKEN' | 'USD' | 'LOCAL';
    const availableModes: CurrencyMode[] = (localCode === "USD" || !localCode) ? ['TOKEN', 'USD'] : ['TOKEN', 'USD', 'LOCAL'];

    const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('TOKEN');
    const [displayAmount, setDisplayAmount] = useState("");

    const toggleCurrencyMode = () => {
        setCurrencyMode(prev => {
            const currentIndex = availableModes.indexOf(prev);
            const nextIndex = (currentIndex + 1) % availableModes.length;
            return availableModes[nextIndex];
        });
    };

    console.log("[SendMoneyForm] Render:", {
        tokenPrice,
        localRate,
        currencyMode,
        selectedToken: selectedToken || "USDC",
        disabled: currencyMode !== 'TOKEN' && (!tokenPrice || tokenPrice === 0)
    });

    // Sync display amount when mode changes or external update to amount
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
            // Token -> USD
            const usdVal = val * price;
            setDisplayAmount(
                (usdVal > 0 && usdVal < 0.01)
                    ? usdVal.toFixed(6).replace(/\.?0+$/, "")
                    : usdVal.toFixed(2)
            );
        } else {
            // Token -> Local
            const localVal = val * price * localRate;
            setDisplayAmount(
                (localVal > 0 && localVal < 0.01)
                    ? localVal.toFixed(6).replace(/\.?0+$/, "")
                    : localVal.toFixed(2)
            );
        }
    }, [currencyMode, tokenPrice, localRate]);

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
            // USD -> Token
            const tokenVal = numVal / price;
            setValue("amount", tokenVal.toFixed(18).replace(/\.?0+$/, ""));
        } else {
            if (price === 0 || !localRate) return;
            // Local -> Token
            const tokenVal = numVal / localRate / price;
            setValue("amount", tokenVal.toFixed(18).replace(/\.?0+$/, ""));
        }
    };

    const convertToDisplay = (tokenAmt: string) => {
        // Helper for display text below
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

    const isSimple = variant === "simplified";

    return (
        <Stack spacing={isSimple ? 1.5 : 2.5}>
            {/* CHAIN DESTINO */}
            {(!initialChain || isSimple) && ( // [NEW] Always show if simple, or if not prefilled
                <Box>
                    <Typography
                        fontWeight={700}
                        fontSize={isSimple ? 12 : 13}
                        sx={{
                            mb: isSimple ? 0.5 : 1,
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
                                size={isSimple ? "small" : "medium"}
                                disabled={sendLoading || lockChain}
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
            )}

            {/* TOKEN ORIGEN */}
            <Box>
                <TokenSelector
                    label={language === "es" ? "Token a enviar" : "Token to send"}
                    name="sourceToken"
                    control={control as any} // Cast compatible control
                    chain={selectedChain as any}
                    size={isSimple ? "small" : "medium"}
                />
            </Box>

            {/* ADDRESS DESTINO */}
            <Box>
                <Typography
                    fontWeight={700}
                    fontSize={isSimple ? 12 : 13}
                    sx={{
                        mb: isSimple ? 0.5 : 1,
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
                            size={isSimple ? "small" : "medium"}
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
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={isSimple ? 0.5 : 1}>
                    {/* LEFT: Label & Controls */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography
                            fontWeight={700}
                            fontSize={isSimple ? 12 : 13}
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

                    {/* RIGHT: Max Button */}
                    <Typography
                        fontSize={isSimple ? 10 : 11}
                        fontWeight={700}
                        sx={{
                            color: "#ff4444",
                            bgcolor: "rgba(255, 68, 68, 0.1)",
                            px: isSimple ? 1 : 1.5,
                            py: isSimple ? 0.2 : 0.5,
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
                        {language === "es" ? "Máx" : "Max"}: {
                            currencyMode === 'LOCAL' ? (tokenPrice ? `$${(maxSendAmount * tokenPrice * localRate).toLocaleString("es-AR", { maximumFractionDigits: 2 })} ${localCode}` : "---") :
                                currencyMode === 'USD' ? (tokenPrice ? `$${(maxSendAmount * tokenPrice).toFixed(2)} USD` : "---") :
                                    `${maxSendAmount} ${selectedToken || "USDC"}`
                        }
                    </Typography>
                </Stack>
                <Controller
                    control={control}
                    name="amount"
                    render={({ field }) => (
                        <TextField
                            fullWidth
                            size={isSimple ? "small" : "medium"}
                            placeholder="0.00"
                            disabled={sendLoading}
                            value={displayAmount || field.value} // Use local display state
                            onChange={handleAmountChange} // Check custom handler
                            // Override ref passing to avoid conflicts with custom onChange? field.ref should be fine.
                            onBlur={field.onBlur}
                            inputRef={field.ref}

                            error={!!errors.amount || isExceedingMax}
                            helperText={errors.amount?.message || (isExceedingMax ? (language === "es" ? "Monto excede el máximo disponible" : "Amount exceeds available balance") : convertToDisplay(watchAmount))}
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



            {/* OPTIMIZE TOGGLE */}
            {
                (!initialChain && !isSimple) && ( // [NEW] Hide if prefilled OR simple
                    <Box
                        sx={{
                            background: "#f5f5f5",
                            border: "2px solid #000000",
                            borderRadius: 3,
                            p: isSimple ? 1.5 : 2,
                            mt: 0.5,
                        }}
                    >
                        <Controller
                            control={control}
                            name="optimize"
                            defaultValue={false}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            {...field}
                                            checked={!!field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            disabled={sendLoading}
                                            size={isSimple ? "small" : "medium"}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: '#00DC8C',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(0, 220, 140, 0.08)',
                                                    },
                                                },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: '#00DC8C',
                                                },
                                                '& .MuiSwitch-track': {
                                                    backgroundColor: '#cccccc',
                                                    border: '2px solid #000000',
                                                },
                                                '& .MuiSwitch-thumb': {
                                                    border: '2px solid #000000',
                                                    boxShadow: 'none',
                                                },
                                            }}
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography fontWeight={800} fontSize={isSimple ? 13 : 14} color="#000000">
                                                {language === "es" ? "Optimizar ruta" : "Optimize Route"}
                                            </Typography>
                                            <Typography variant="caption" color="#666666" fontWeight={600} fontSize={isSimple ? 11 : 12}>
                                                {language === "es" ? "Encuentra la ruta más eficiente para tu transacción" : "Find the most efficient route for your transaction"}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            )}
                        />
                    </Box>
                )
            }
        </Stack >
    );
};