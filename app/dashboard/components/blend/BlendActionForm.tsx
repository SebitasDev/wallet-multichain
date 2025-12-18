import { useState } from "react";
import { Box, Button, Typography, TextField, CircularProgress, InputAdornment } from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface BlendActionFormProps {
    balance: number;
    invested: number;
    loadingTx: boolean;
    onAction: (amount: number, type: "deposit" | "withdraw") => Promise<void>;
}

export const BlendActionForm = ({ balance, invested, loadingTx, onAction }: BlendActionFormProps) => {
    const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    const handleMax = () => {
        const val = mode === "deposit" ? balance : invested;
        setAmount(val.toString());
    };

    const handleSubmit = async () => {
        setMessage(null);
        if (!amount || Number(amount) <= 0) return;

        try {
            await onAction(Number(amount), mode);
            setMessage({ type: "success", text: `${mode === "deposit" ? "Depósito" : "Retiro"} exitoso!` });
            setAmount("");
        } catch (error) {
            setMessage({ type: "error", text: "Error en la transacción" });
        }
    };

    return (
        <Box
            sx={{
                p: { xs: 3, md: 4 },
                border: "3px solid #000",
                borderRadius: 4,
                boxShadow: "6px 6px 0px #000",
                bgcolor: "#fff",
            }}
        >
            {/* Title */}
            <Typography
                sx={{
                    fontSize: { xs: 20, md: 24 },
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    mb: 3,
                }}
            >
                {mode === "deposit" ? "Depositar USDC" : "Retirar USDC"}
            </Typography>

            {/* Mode Toggle */}
            <Box display="flex" gap={2} mb={4}>
                <ActionButton
                    active={mode === "deposit"}
                    onClick={() => setMode("deposit")}
                    label="Depositar"
                    icon={<AddCircleIcon />}
                    activeColor="#00DC8C"
                />
                <ActionButton
                    active={mode === "withdraw"}
                    onClick={() => setMode("withdraw")}
                    label="Retirar"
                    icon={<RemoveCircleIcon />}
                    activeColor="#FF6B6B"
                />
            </Box>

            {/* Amount Input */}
            <Box mb={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography
                        sx={{
                            fontSize: 14,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                        }}
                    >
                        {mode === "deposit" ? "Monto a depositar" : "Monto a retirar"}
                    </Typography>
                    <Button
                        onClick={handleMax}
                        sx={{
                            px: 2,
                            py: 0.5,
                            bgcolor: "#f5f5f5",
                            border: "2px solid #000",
                            borderRadius: 2,
                            fontWeight: 800,
                            fontSize: 12,
                            color: "#000",
                            boxShadow: "2px 2px 0px #000",
                            "&:hover": {
                                bgcolor: "#e0e0e0",
                                boxShadow: "3px 3px 0px #000",
                            },
                        }}
                    >
                        MAX: {mode === "deposit" ? balance : invested}
                    </Button>
                </Box>
                <TextField
                    fullWidth
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Box
                                    sx={{
                                        px: 2,
                                        py: 1,
                                        bgcolor: "#000",
                                        borderRadius: 2,
                                        ml: 1,
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>
                                        USDC
                                    </Typography>
                                </Box>
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            border: "3px solid #000",
                            borderRadius: 3,
                            bgcolor: "#fff",
                            fontSize: { xs: 24, md: 32 },
                            fontWeight: 900,
                            "& fieldset": { border: "none" },
                            "&:hover": {
                                boxShadow: "4px 4px 0px #000",
                            },
                            "&.Mui-focused": {
                                boxShadow: "4px 4px 0px #7B61FF",
                            },
                        },
                        "& input": {
                            fontWeight: 900,
                            fontSize: { xs: 24, md: 32 },
                        },
                        "& input::placeholder": {
                            color: "#ccc",
                            opacity: 1,
                        },
                    }}
                />
            </Box>

            {/* Message */}
            {message && (
                <Box
                    sx={{
                        mb: 3,
                        p: 2,
                        border: "3px solid #000",
                        borderRadius: 3,
                        bgcolor: message.type === "success" ? "#00DC8C" : "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        boxShadow: "4px 4px 0px #000",
                    }}
                >
                    {message.type === "success" ? (
                        <CheckCircleIcon sx={{ color: "#000" }} />
                    ) : (
                        <ErrorIcon sx={{ color: "#000" }} />
                    )}
                    <Typography sx={{ fontWeight: 800, color: "#000" }}>
                        {message.text}
                    </Typography>
                </Box>
            )}

            {/* Submit Button */}
            <Button
                fullWidth
                variant="contained"
                disabled={loadingTx || !amount || Number(amount) <= 0}
                onClick={handleSubmit}
                sx={{
                    py: 2,
                    border: "3px solid #000",
                    borderRadius: 3,
                    bgcolor: mode === "deposit" ? "#00DC8C" : "#FF6B6B",
                    color: "#000",
                    fontWeight: 900,
                    fontSize: { xs: 16, md: 18 },
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    boxShadow: "5px 5px 0px #000",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        bgcolor: mode === "deposit" ? "#00C47C" : "#FF5252",
                        boxShadow: "6px 6px 0px #000",
                        transform: "translate(-1px, -1px)",
                    },
                    "&:active": {
                        boxShadow: "2px 2px 0px #000",
                        transform: "translate(2px, 2px)",
                    },
                    "&.Mui-disabled": {
                        bgcolor: "#e0e0e0",
                        color: "#999",
                        border: "3px solid #ccc",
                        boxShadow: "3px 3px 0px #ccc",
                    },
                }}
            >
                {loadingTx ? (
                    <CircularProgress size={28} sx={{ color: "#000" }} />
                ) : (
                    mode === "deposit" ? "Confirmar Depósito" : "Confirmar Retiro"
                )}
            </Button>
        </Box>
    );
};

interface ActionButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
    activeColor: string;
}

const ActionButton = ({ active, onClick, label, icon, activeColor }: ActionButtonProps) => (
    <Button
        fullWidth
        onClick={onClick}
        startIcon={icon}
        sx={{
            py: 1.5,
            border: "3px solid #000",
            borderRadius: 3,
            bgcolor: active ? activeColor : "#fff",
            color: "#000",
            fontWeight: 800,
            fontSize: { xs: 14, md: 16 },
            textTransform: "uppercase",
            boxShadow: active ? "4px 4px 0px #000" : "none",
            transition: "all 0.2s ease",
            "&:hover": {
                bgcolor: active ? activeColor : "#f5f5f5",
                boxShadow: "4px 4px 0px #000",
                transform: active ? "none" : "translate(-1px, -1px)",
            },
        }}
    >
        {label}
    </Button>
);
