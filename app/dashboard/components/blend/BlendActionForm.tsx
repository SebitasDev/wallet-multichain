import { useState } from "react";
import { Box, Card, CardContent, Button, Typography, TextField, Alert, CircularProgress } from "@mui/material";

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
        <Card elevation={0} sx={{ border: "1px solid #eee" }}>
            <CardContent>
                <Box display="flex" gap={2} mb={3}>
                    <ActionButton active={mode === "deposit"} onClick={() => setMode("deposit")} label="Depositar" />
                    <ActionButton active={mode === "withdraw"} onClick={() => setMode("withdraw")} label="Retirar" />
                </Box>

                <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="caption">
                            {mode === "deposit" ? "Monto a depositar" : "Monto a retirar"}
                        </Typography>
                        <Typography variant="caption" sx={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={handleMax}>
                            Max: {mode === "deposit" ? balance : invested} USDC
                        </Typography>
                    </Box>
                    <TextField
                        fullWidth
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        type="number"
                        InputProps={{
                            endAdornment: <Typography variant="body2" color="text.secondary">USDC</Typography>
                        }}
                    />
                </Box>

                {message && (
                    <Alert severity={message.type} sx={{ mb: 2 }}>
                        {message.text}
                    </Alert>
                )}

                <Button
                    fullWidth
                    variant="contained"
                    disabled={loadingTx || !amount || Number(amount) <= 0}
                    onClick={handleSubmit}
                    sx={{
                        bgcolor: "#00DC8C",
                        color: "#000",
                        py: 1.5,
                        fontWeight: "bold",
                        "&:hover": { bgcolor: "#00C47C" }
                    }}
                >
                    {loadingTx ? <CircularProgress size={24} color="inherit" /> : (mode === "deposit" ? "CONFIRMAR DEPÓSITO" : "CONFIRMAR RETIRO")}
                </Button>
            </CardContent>
        </Card>
    );
};

const ActionButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
    <Button
        fullWidth
        variant={active ? "contained" : "outlined"}
        onClick={onClick}
        sx={{
            bgcolor: active ? "#000" : "transparent",
            color: active ? "#fff" : "#000",
            borderColor: "#000",
            "&:hover": {
                bgcolor: active ? "#333" : "rgba(0,0,0,0.05)",
                borderColor: "#000"
            }
        }}
    >
        {label}
    </Button>
);
