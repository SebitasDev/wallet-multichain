import {Control, Controller, FieldErrors} from "react-hook-form";
import {
    MenuItem,
    Stack,
    TextField,
    Typography,
    Switch,
    FormControlLabel,
    Box
} from "@mui/material";
import {ChainKey, NETWORKS} from "@/app/constants/chainsInformation";

type FormValues = {
    toAddress: string;
    sendAmount: string;
    sendPassword: string;
    sendChain: ChainKey;
    optimize: boolean;
};

type Props = {
    control: Control<FormValues>;
    errors: FieldErrors<FormValues>;
    sendLoading: boolean;
};

export const FormSendMoney = ({ control, errors, sendLoading }: Props) => {
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
                    Chain destino
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
                            {Object.entries(NETWORKS).map(([key, cfg]) => (
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
                    Monto (USDC)
                </Typography>
                <Controller
                    control={control}
                    name="sendAmount"
                    render={({ field }) => (
                        <TextField
                            fullWidth
                            size="medium"
                            placeholder="0.00"
                            type="number"
                            inputProps={{ min: 0, step: "0.0001" }}
                            disabled={sendLoading}
                            {...field}
                            error={!!errors.sendAmount}
                            helperText={errors.sendAmount?.message}
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

            {/* PASSWORD */}
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
                    Password de la wallet
                </Typography>
                <Controller
                    control={control}
                    name="sendPassword"
                    render={({ field }) => (
                        <TextField
                            fullWidth
                            size="medium"
                            type="password"
                            placeholder="••••••••"
                            disabled={sendLoading}
                            {...field}
                            error={!!errors.sendPassword}
                            helperText={errors.sendPassword?.message}
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
                                        Optimizar ruta
                                    </Typography>
                                    <Typography variant="caption" color="#666666" fontWeight={600} fontSize={12}>
                                        Encuentra la ruta más eficiente para tu transacción
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