"use client";

import { useState } from "react";
import {
    Box,
    Modal,
    Typography,
    Button,
    TextField,
    Stack,
} from "@mui/material";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";

export const PasswordModal = ({
                                  open,
                                  mode,
                                  onSuccess,
                              }: {
    open: boolean;
    mode: "create" | "unlock";
    onSuccess: () => void;
}) => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const setPasswordStore = useWalletPasswordStore(s => s.setPassword);
    const verifyPassword = useWalletPasswordStore(s => s.verifyPassword);
    const setCurrentPassword = useWalletPasswordStore(s => s.setCurrentPassword);

    const handleSubmit = async () => {
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
    };

    return (
        <Modal open={open}>
            <Box
                sx={{
                    background: "#1c1c1c",
                    p: 4,
                    borderRadius: 3,
                    width: "90%",
                    maxWidth: 400,
                    mx: "auto",
                    mt: "20vh",
                    color: "#fff",
                }}
            >
                <Typography variant="h6" sx={{ mb: 2 }}>
                    {mode === "create"
                        ? "Crea una contraseña para proteger tu wallet"
                        : "Ingresa tu contraseña"}
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        type="password"
                        label="Contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        fullWidth
                        error={Boolean(error)}
                        helperText={error}
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleSubmit}
                    >
                        {mode === "create" ? "Crear contraseña" : "Desbloquear"}
                    </Button>
                </Stack>
            </Box>
        </Modal>
    );
};
