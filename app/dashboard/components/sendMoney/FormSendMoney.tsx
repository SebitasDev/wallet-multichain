import { Control, Controller, FieldErrors } from "react-hook-form";
import {
    MenuItem,
    Stack,
    TextField,
    Typography,
    Switch,
    FormControlLabel,
    Box,
    InputAdornment,
} from "@mui/material";
import { ChainKey, NETWORKS } from "@/app/constants/chainsInformation";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

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

const textFieldStyles = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.04)",
        color: "#f1f5f9",
        "& fieldset": {
            borderColor: "rgba(255, 255, 255, 0.1)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(255, 255, 255, 0.2)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#0ea5e9",
            borderWidth: "1px",
        },
        "&.Mui-error fieldset": {
            borderColor: "#ef4444",
        },
    },
    "& .MuiInputLabel-root": {
        color: "#64748b",
        "&.Mui-focused": {
            color: "#0ea5e9",
        },
        "&.Mui-error": {
            color: "#ef4444",
        },
    },
    "& .MuiFormHelperText-root": {
        color: "#ef4444",
        marginLeft: 0,
    },
    "& .MuiSelect-icon": {
        color: "#64748b",
    },
    "& input::placeholder": {
        color: "#475569",
        opacity: 1,
    },
};

export const FormSendMoney = ({ control, errors, sendLoading }: Props) => {
    return (
        <Stack spacing={2.5}>
            {/* Destination Chain */}
            <Controller
                control={control}
                name="sendChain"
                render={({ field }) => (
                    <TextField
                        select
                        label="Destination Chain"
                        fullWidth
                        size="medium"
                        disabled={sendLoading}
                        {...field}
                        error={!!errors.sendChain}
                        helperText={errors.sendChain?.message}
                        sx={textFieldStyles}
                    >
                        {Object.entries(NETWORKS).map(([key, cfg]) => (
                            <MenuItem
                                key={key}
                                value={key}
                                sx={{
                                    color: "#f1f5f9",
                                    "&:hover": { background: "rgba(255,255,255,0.08)" },
                                    "&.Mui-selected": {
                                        background: "rgba(14, 165, 233, 0.15)",
                                        "&:hover": { background: "rgba(14, 165, 233, 0.2)" },
                                    },
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Box sx={{ display: "flex", "& svg": { width: 22, height: 22 } }}>
                                        {cfg.icon}
                                    </Box>
                                    <Typography sx={{ fontWeight: 500 }}>{cfg.label}</Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                    </TextField>
                )}
            />

            {/* Recipient Address */}
            <Controller
                control={control}
                name="toAddress"
                render={({ field }) => (
                    <TextField
                        label="Recipient Address"
                        fullWidth
                        size="medium"
                        placeholder="0x..."
                        disabled={sendLoading}
                        {...field}
                        error={!!errors.toAddress}
                        helperText={errors.toAddress?.message}
                        sx={{
                            ...textFieldStyles,
                            "& input": {
                                fontFamily: "var(--font-mono), monospace",
                                fontSize: "14px",
                            },
                        }}
                    />
                )}
            />

            {/* Amount */}
            <Controller
                control={control}
                name="sendAmount"
                render={({ field }) => (
                    <TextField
                        label="Amount"
                        fullWidth
                        size="medium"
                        placeholder="0.00"
                        type="number"
                        inputProps={{ min: 0, step: "0.01" }}
                        disabled={sendLoading}
                        {...field}
                        error={!!errors.sendAmount}
                        helperText={errors.sendAmount?.message}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Typography
                                        sx={{
                                            color: "#64748b",
                                            fontWeight: 600,
                                            fontSize: "14px",
                                        }}
                                    >
                                        USDC
                                    </Typography>
                                </InputAdornment>
                            ),
                        }}
                        sx={textFieldStyles}
                    />
                )}
            />

            {/* Password */}
            <Controller
                control={control}
                name="sendPassword"
                render={({ field }) => (
                    <TextField
                        label="Wallet Password"
                        fullWidth
                        size="medium"
                        type="password"
                        placeholder="Enter your password"
                        disabled={sendLoading}
                        {...field}
                        error={!!errors.sendPassword}
                        helperText={errors.sendPassword?.message}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockOutlinedIcon sx={{ color: "#64748b", fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={textFieldStyles}
                    />
                )}
            />

            {/* Optimize Toggle */}
            <Box
                sx={{
                    p: 2,
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
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
                                        "& .MuiSwitch-switchBase.Mui-checked": {
                                            color: "#0ea5e9",
                                        },
                                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                            backgroundColor: "#0ea5e9",
                                        },
                                        "& .MuiSwitch-track": {
                                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                                        },
                                    }}
                                />
                            }
                            label={
                                <Box>
                                    <Typography sx={{ fontWeight: 600, color: "#f1f5f9", fontSize: "14px" }}>
                                        Optimize route
                                    </Typography>
                                    <Typography sx={{ fontSize: "12px", color: "#64748b" }}>
                                        Find the most cost-effective path across chains
                                    </Typography>
                                </Box>
                            }
                            sx={{ m: 0, alignItems: "flex-start" }}
                        />
                    )}
                />
            </Box>
        </Stack>
    );
};
