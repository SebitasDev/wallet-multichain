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
          backdropFilter: "blur(3px)",
          background: "rgba(0,0,0,0.5)",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            maxWidth: 460,
            background: "linear-gradient(145deg, #0c1220, #0f1c33)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 28px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
            borderRadius: 22,
            p: { xs: 3.2, md: 3.8 },
            color: "#e5e7eb",
          }}
        >
          <Stack spacing={2.2}>
            <Box>
              <Typography
                component="h2"
                sx={{ fontWeight: 900, fontSize: 24, color: "#f9fafb", mb: 0.5 }}
              >
                {mode === "create" ? "Crea tu contraseña" : "Ingresa tu contraseña"}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(229,231,235,0.76)" }}>
                Desbloquea tu sesión para continuar operando con tus wallets.
              </Typography>
            </Box>

            <Stack spacing={1}>
              <Typography component="label" htmlFor="password-input" sx={{ fontWeight: 800 }}>
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
                placeholder="Ingresa tu contraseña segura"
                fullWidth
                error={Boolean(error)}
                inputProps={{
                  "aria-invalid": Boolean(error),
                  "aria-describedby": error ? errorId : undefined,
                }}
                InputProps={{
                  sx: {
                    color: "#e5e7eb",
                    "& .MuiInputBase-input::placeholder": {
                      color: "rgba(229,231,235,0.7)",
                    },
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "rgba(229,231,235,0.7)" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        sx={{ color: "rgba(229,231,235,0.8)" }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Typography
                id={errorId}
                variant="body2"
                sx={{ color: "#f87171", minHeight: 20 }}
                aria-live="polite"
              >
                {error}
              </Typography>
            </Stack>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isEmpty || isSubmitting}
              sx={{
                textTransform: "uppercase",
                fontWeight: 900,
                letterSpacing: 0.8,
                py: 1.25,
                borderRadius: 14,
                background: "linear-gradient(135deg, #2563eb 0%, #6366f1 50%, #8b5cf6 100%)",
                boxShadow: "0 18px 34px rgba(99,102,241,0.4)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1e40af 0%, #5b21b6 100%)",
                },
                "&:disabled": {
                  background: "rgba(255,255,255,0.14)",
                  color: "rgba(255,255,255,0.6)",
                  boxShadow: "none",
                },
              }}
            >
              {isSubmitting
                ? "Procesando..."
                : mode === "create"
                  ? "Crear contraseña"
                  : "Desbloquear"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};
