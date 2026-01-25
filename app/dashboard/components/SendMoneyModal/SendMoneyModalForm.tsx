import { Control, Controller, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import {
    MenuItem,
    Stack,
    TextField,
    Typography,
    Switch,
    FormControlLabel,
    Box
} from "@mui/material";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { TokenSelector } from "../CrossChainTransferModal/TokenSelector";
import { SendForm } from "@/app/lib/zod/sendSchema";
import { useLanguageStore } from "@/app/store/useLanguageStore";
// ... imports
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore"; // [NEW]

type Props = {
    control: Control<SendForm>;
    errors: FieldErrors<SendForm>;
    sendLoading: boolean;
    setValue: UseFormSetValue<SendForm>;
    watch: UseFormWatch<SendForm>;
    maxSendAmount: number;
    isExceedingMax: boolean;
    variant: "default" | "simplified";
    sourceToken: string; // [NEW]
};

// Re-using TokenSelector requires matching props or adapter. 
// TokenSelector expects `chain` and `control`. 
// We will adapt it here.

export const SendMoneyModalForm = ({ control, errors, sendLoading, setValue, watch, maxSendAmount, isExceedingMax, variant, sourceToken }: Props) => {
    const { language } = useLanguageStore();
    const selectedChain = watch("sendChain");
    const { initialChain } = useSendMoneyStore(); // [NEW] Check for prefill

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
                        control={control}
                        name="sendChain"
                        render={({ field }) => (
                            <TextField
                                select
                                fullWidth
                                size={isSimple ? "small" : "medium"}
                                disabled={sendLoading}
                                {...field}
                                error={!!errors.sendChain}
                                helperText={errors.sendChain?.message}
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
                    control={control}
                    name="toAddress"
                    render={({ field }) => (
                        <TextField
                            fullWidth
                            size={isSimple ? "small" : "medium"}
                            placeholder="0x..."
                            disabled={sendLoading}
                            {...field}
                            error={!!errors.toAddress}
                            helperText={errors.toAddress?.message}
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
                    <Typography
                        fontWeight={700}
                        fontSize={isSimple ? 12 : 13}
                        sx={{
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "#666666"
                        }}
                    >
                        {language === "es" ? `Monto (${sourceToken})` : `Amount (${sourceToken})`}
                    </Typography>
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
                            cursor: "pointer"
                        }}
                        onClick={() => {
                            setValue("sendAmount", maxSendAmount.toString(), { shouldValidate: true });
                        }}
                    >
                        {language === "es" ? "Máx" : "Max"}: {maxSendAmount} {sourceToken}
                    </Typography>
                </Stack>
                <Controller
                    control={control}
                    name="sendAmount"
                    render={({ field }) => (
                        <TextField
                            fullWidth
                            size={isSimple ? "small" : "medium"}
                            placeholder="0.00"
                            // type="number"  <-- Removed to fix "0." snapping issues
                            // inputProps={{ min: 0, step: "0.0001" }}
                            disabled={sendLoading}
                            {...field}
                            error={!!errors.sendAmount || isExceedingMax}
                            helperText={errors.sendAmount?.message || (isExceedingMax ? (language === "es" ? "Monto excede el máximo disponible" : "Amount exceeds available balance") : "")}
                            InputProps={{
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
            </Box>



            {/* OPTIMIZE TOGGLE */}
            {(!initialChain && !isSimple) && ( // [NEW] Hide if prefilled OR simple
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
            )}
        </Stack>
    );
};