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
import { ChainKey } from "@/app/types/chain";
import { TokenSelector } from "../CrossChainTransferModal/TokenSelector";
import { SendForm } from "@/app/lib/zod/sendSchema";
import { useLanguageStore } from "@/app/store/useLanguageStore";

type Props = {
    control: Control<SendForm>;
    errors: FieldErrors<SendForm>;
    sendLoading: boolean;
    setValue: UseFormSetValue<SendForm>;
    watch: UseFormWatch<SendForm>;
    maxSendAmount: number;
    isExceedingMax: boolean;
};

// Re-using TokenSelector requires matching props or adapter. 
// TokenSelector expects `chain` and `control`. 
// We will adapt it here.

export const SendMoneyModalForm = ({ control, errors, sendLoading, setValue, watch, maxSendAmount, isExceedingMax }: Props) => {
    const { language } = useLanguageStore();
    const selectedChain = watch("sendChain");

    return (
        <Stack spacing={2.5}>
            {/* CHAIN DESTINO */}
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
                    {language === "es" ? "Red de destino" : "Destination Network"}
                </Typography>
                <Controller
                    control={control}
                    name="sendChain"
                    render={({ field }) => (
                        <TextField
                            select
                            fullWidth
                            size="medium"
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

            {/* TOKEN ORIGEN */}
            <Box>
                <TokenSelector
                    label={language === "es" ? "Token a enviar" : "Token to send"}
                    name="sourceToken"
                    control={control as any} // Cast compatible control
                    chain={selectedChain as any}
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
                    {language === "es" ? "Dirección de destino" : "Destination Address"}
                </Typography>
                <Controller
                    control={control}
                    name="toAddress"
                    render={({ field }) => (
                        <TextField
                            fullWidth
                            size="medium"
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
                        {language === "es" ? "Monto (USDC)" : "Amount (USDC)"}
                    </Typography>
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
                            cursor: "pointer"
                        }}
                        onClick={() => {
                            setValue("sendAmount", maxSendAmount.toString(), { shouldValidate: true });
                        }}
                    >
                        {language === "es" ? "Máx" : "Max"}: {maxSendAmount} USDC
                    </Typography>
                </Stack>
                <Controller
                    control={control}
                    name="sendAmount"
                    render={({ field }) => (
                        <TextField
                            fullWidth
                            size="medium"
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
            <Box
                sx={{
                    background: "#f5f5f5",
                    border: "2px solid #000000",
                    borderRadius: 3,
                    p: 2,
                    mt: 1,
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
                                    <Typography fontWeight={800} fontSize={14} color="#000000">
                                        {language === "es" ? "Optimizar ruta" : "Optimize Route"}
                                    </Typography>
                                    <Typography variant="caption" color="#666666" fontWeight={600} fontSize={12}>
                                        {language === "es" ? "Encuentra la ruta más eficiente para tu transacción" : "Find the most efficient route for your transaction"}
                                    </Typography>
                                </Box>
                            }
                        />
                    )}
                />
            </Box>
        </Stack>
    );
};