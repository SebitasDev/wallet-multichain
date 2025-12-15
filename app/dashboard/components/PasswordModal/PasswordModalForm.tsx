import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    IconButton,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

interface PasswordModalFormProps {
    password: string;
    setPassword: (val: string) => void;
    error: string;
    setError: (val: string) => void;
    showPassword: boolean;
    setShowPassword: (val: boolean | ((prev: boolean) => boolean)) => void;
    errorId: string;
    mode: "create" | "unlock";
}

export const PasswordModalForm = ({
    password,
    setPassword,
    error,
    setError,
    showPassword,
    setShowPassword,
    errorId,
    mode
}: PasswordModalFormProps) => {
    return (
        <>
            {/* CAMPO DE CONTRASEÑA */}
            <Box>
                <Typography
                    component="label"
                    htmlFor="password-input"
                    sx={{
                        fontWeight: 800,
                        fontSize: 13,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: "#666666",
                        display: "block",
                        mb: 1
                    }}
                >
                    Contraseña
                </Typography>
                <TextField
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                    }}
                    placeholder="••••••••"
                    fullWidth
                    error={Boolean(error)}
                    inputProps={{
                        "aria-invalid": Boolean(error),
                        "aria-describedby": error ? errorId : undefined,
                    }}
                    InputProps={{
                        sx: {
                            background: "#f5f5f5",
                            border: error ? "3px solid #ff4444" : "3px solid #000000",
                            borderRadius: 3,
                            color: "#000000",
                            fontWeight: 700,
                            fontSize: 15,
                            transition: "all 0.2s",
                            "&:hover": {
                                background: "#ffffff",
                            },
                            "&.Mui-focused": {
                                background: "#ffffff",
                                border: error ? "3px solid #ff4444" : "3px solid #7852FF",
                            },
                            "& .MuiInputBase-input::placeholder": {
                                color: "#999999",
                                fontWeight: 600,
                            },
                            "& fieldset": {
                                border: "none",
                            },
                        },
                        startAdornment: (
                            <InputAdornment position="start">
                                <LockOutlinedIcon sx={{ color: "#666666", fontSize: 22 }} />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    edge="end"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    sx={{
                                        color: "#000000",
                                        background: "#ffffff",
                                        border: "2px solid #000000",
                                        borderRadius: 2,
                                        width: 36,
                                        height: 36,
                                        transition: "all 0.2s",
                                        "&:hover": {
                                            background: "#f5f5f5",
                                            transform: "scale(1.05)",
                                        }
                                    }}
                                >
                                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                {/* ERROR MESSAGE */}
                {error && (
                    <Box
                        id={errorId}
                        sx={{
                            mt: 1.5,
                            p: 1.5,
                            background: "rgba(255, 68, 68, 0.1)",
                            border: "2px solid #ff4444",
                            borderRadius: 2,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: "#ff4444",
                                fontWeight: 700,
                                fontSize: 13
                            }}
                            aria-live="polite"
                        >
                            ⚠️ {error}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* INFO ADICIONAL */}
            {mode === "create" && (
                <Box
                    sx={{
                        p: 2,
                        background: "#f5f5f5",
                        border: "2px solid #000000",
                        borderRadius: 3,
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: "#666666",
                            fontWeight: 600,
                            fontSize: 12,
                            lineHeight: 1.6,
                        }}
                    >
                        💡 <strong>Tip:</strong> Usa una contraseña fuerte que incluya letras, números y símbolos. Esta contraseña protegerá todas tus wallets.
                    </Typography>
                </Box>
            )}
        </>
    );
};
