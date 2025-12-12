"use client";

import { FormEvent, useMemo, useState } from "react";
import {
    Box,
    Modal,
    Typography,
    Button,
    TextField,
    Stack,
    InputAdornment,
    IconButton,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";

type PasswordModalProps = {
    open: boolean;
    mode: "create" | "unlock";
    onSuccess: () => void;
};

export const PasswordModal = ({ open, mode, onSuccess }: PasswordModalProps) => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const setPasswordStore = useWalletPasswordStore((s) => s.setPassword);
    const verifyPassword = useWalletPasswordStore((s) => s.verifyPassword);
    const setCurrentPassword = useWalletPasswordStore((s) => s.setCurrentPassword);

    const isEmpty = useMemo(() => password.trim().length === 0, [password]);
    const errorId = "password-error";

    const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
        evt.preventDefault();
        if (isEmpty) {
            setError("La contraseña no puede estar vacía");
            return;
        }

        setError("");
        setIsSubmitting(true);

        try {
            if (mode === "create") {
                await setPasswordStore(password);
                onSuccess();
                return;
            }

            const ok = await verifyPassword(password);
            if (!ok) {
                setError("Contraseña incorrecta");
                return;
            }

            setCurrentPassword(password);
            onSuccess();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal open={open}>
            <Box
                sx={{
                    position: "fixed",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    background: "rgba(0,0,0,0.4)",
                }}
            >
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        width: "100%",
                        maxWidth: 460,
                        background: "#ffffff",
                        border: "4px solid #000000",
                        boxShadow: "12px 12px 0px #000000",
                        borderRadius: 4,
                        p: { xs: 3, md: 4 },
                        position: "relative",
                        animation: "modalSlideIn 0.3s ease-out",
                        "@keyframes modalSlideIn": {
                            from: {
                                opacity: 0,
                                transform: "translateY(-20px) scale(0.95)",
                            },
                            to: {
                                opacity: 1,
                                transform: "translateY(0) scale(1)",
                            },
                        },
                    }}
                >
                    {/* HEADER CON ICONO */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 3,
                            pb: 2.5,
                            borderBottom: "3px solid #000000",
                        }}
                    >
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                                background: mode === "create" ? "#00DC8C" : "#7852FF",
                                border: "3px solid #000000",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <LockOutlinedIcon sx={{ fontSize: 28, color: "#ffffff" }} />
                        </Box>

                        <Box flex={1}>
                            <Typography
                                component="h2"
                                sx={{
                                    fontWeight: 900,
                                    fontSize: { xs: 20, md: 24 },
                                    color: "#000000",
                                    lineHeight: 1.2,
                                    mb: 0.5
                                }}
                            >
                                {mode === "create" ? "Crea tu contraseña" : "Ingresa tu contraseña"}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "#666666",
                                    fontWeight: 600,
                                    fontSize: { xs: 12, md: 13 }
                                }}
                            >
                                {mode === "create"
                                    ? "Protege tus wallets con una contraseña segura"
                                    : "Desbloquea tu sesión para continuar"
                                }
                            </Typography>
                        </Box>
                    </Box>

                    <Stack spacing={2.5}>
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

                        {/* BOTÓN DE SUBMIT */}
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isEmpty || isSubmitting}
                            sx={{
                                textTransform: "uppercase",
                                fontWeight: 900,
                                letterSpacing: 1,
                                fontSize: 15,
                                py: 1.8,
                                borderRadius: 3,
                                background: mode === "create" ? "#00DC8C" : "#7852FF",
                                color: mode === "create" ? "#000000" : "#ffffff",
                                border: "3px solid #000000",
                                boxShadow: "6px 6px 0px #000000",
                                transition: "all 0.2s",
                                "&:hover": {
                                    background: mode === "create" ? "#00CC7C" : "#6342E6",
                                    transform: "translate(2px, 2px)",
                                    boxShadow: "4px 4px 0px #000000",
                                },
                                "&:active": {
                                    transform: "translate(4px, 4px)",
                                    boxShadow: "2px 2px 0px #000000",
                                },
                                "&:disabled": {
                                    background: "#cccccc",
                                    color: "#666666",
                                    border: "3px solid #999999",
                                    boxShadow: "none",
                                    transform: "none",
                                },
                            }}
                        >
                            {isSubmitting
                                ? "Procesando..."
                                : mode === "create"
                                    ? "Crear contraseña"
                                    : "Desbloquear"}
                        </Button>

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
                    </Stack>
                </Box>
            </Box>
        </Modal>
    );
};