"use client";

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";

import { useWalletStore } from "@/app/store/useWalletsStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";

type Props = {
    open: boolean;
    onClose: () => void;
};

export function AddSecretModal({ open, onClose }: Props) {
    const { addWallet } = useWalletStore();

    const encryptedPassword = useWalletPasswordStore(s => s.encryptedPassword);
    const verifyPassword = useWalletPasswordStore(s => s.verifyPassword);

    const [walletName, setWalletName] = useState("");
    const [phrase, setPhrase] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (!open) {
            setWalletName("");
            setPhrase("");
            setPassword("");
        }
    }, [open]);

    const words = useMemo(
        () => (phrase.trim() ? phrase.trim().split(/\s+/).filter(Boolean) : []),
        [phrase]
    );

    const has12Words = words.length === 12;

    const canConfirm =
        walletName.trim().length > 0 &&
        password.trim().length > 0 &&
        has12Words;

    const handleAdd = async () => {
        if (!canConfirm) {
            toast.error("Completa nombre, password y las 12 palabras.");
            return;
        }

        try {
            // Si YA existe password almacenada, validar
            if (encryptedPassword) {
                const ok = await verifyPassword(password);

                if (!ok) {
                    toast.error("Password incorrecta.");
                    return;
                }
            }

            // Si NO existe password almacenada:
            // La password ingresada será la que se guarda como password maestra
            await addWallet(phrase, password, walletName);

            toast.success(`Wallet "${walletName}" agregada correctamente.`);
            onClose();
            setWalletName("");
            setPhrase("");
            setPassword("");
        } catch (err) {
            console.error(err);
            toast.error((err as Error).message || "Error al agregar wallet");
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            slotProps={{
                backdrop: {
                    sx: {
                        backdropFilter: "blur(25px) brightness(0.7)",
                        backgroundColor: "rgba(255,255,255,0.05)", // glass suave
                    },
                },
            }}
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    p: 1,
                    overflow: "hidden",
                },
            }}
        >
            <Box
                sx={{
                    background: "linear-gradient(135deg, #1f50ff 0%, #19a3b7 50%, #16a34a 100%)",
                    px: 3,
                    py: 2.2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    color: "#fff",
                }}
            >
                <Box
                    sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 2.5,
                        background: "rgba(255,255,255,0.14)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backdropFilter: "blur(6px)",
                    }}
                >
                    <AccountBalanceWalletOutlined />
                </Box>

                <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={900} fontSize={18.5} sx={{ lineHeight: 1.2 }}>
                        Agregar Frase Secreta (12 palabras)
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Pega las 12 palabras de tu seed para vincular tu wallet.
                    </Typography>
                </Box>

                <IconButton size="small" onClick={onClose} sx={{ color: "#fff" }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: 3, pb: 1.5, pt: 2.5 }}>
                <Stack spacing={2.2}>
                    <Box>
                        <Typography
                            fontWeight={700}
                            fontSize={13}
                            sx={{ mb: 0.6, color: "#111827" }}
                        >
                            Nombre de la Wallet
                        </Typography>

                        <TextField
                            fullWidth
                            size="medium"
                            value={walletName}
                            onChange={({ target }) => setWalletName(target.value)}
                            placeholder="Ej: Mi Wallet Principal"
                            InputProps={{
                                sx: { borderRadius: 2, background: "#f8fafc" },
                            }}
                        />
                    </Box>

                    <Box>
                        <Typography
                            fontWeight={700}
                            fontSize={13}
                            sx={{ mb: 0.6, color: "#111827" }}
                        >
                            Frase secreta (12 palabras)
                        </Typography>

                        <TextField
                            fullWidth
                            size="medium"
                            value={phrase}
                            onChange={({ target }) => setPhrase(target.value)}
                            placeholder="palabra1 palabra2 ... palabra12"
                            InputProps={{
                                sx: { borderRadius: 2, background: "#f8fafc" },
                            }}
                            helperText={
                                phrase ? `${words.length}/12 palabras` : "Debe tener 12 palabras exactas."
                            }
                            multiline
                            minRows={3}
                        />
                    </Box>

                    <Box>
                        <Typography
                            fontWeight={700}
                            fontSize={13}
                            sx={{ mb: 0.6, color: "#111827" }}
                        >
                            Password
                            {encryptedPassword ? " (para desbloquear)" : " (para cifrar)"}
                        </Typography>

                        <TextField
                            fullWidth
                            size="medium"
                            type="password"
                            value={password}
                            onChange={({ target }) => setPassword(target.value)}
                            placeholder="••••••••"
                            InputProps={{
                                sx: { borderRadius: 2, background: "#f8fafc" },
                            }}
                        />
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    pb: 2.8,
                    pt: 1.2,
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    rowGap: 1.2,
                    alignItems: "stretch",
                    width: "100%",
                    "& .MuiButton-root": {
                        width: "100%",
                        justifyContent: "center",
                        margin: 0,
                    },
                }}
            >
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={onClose}
                    sx={{
                        width: "100%",
                        textTransform: "none",
                        borderRadius: 1.5,
                        fontWeight: 700,
                        borderColor: "#e2e8f0",
                        color: "#0f172a",
                        backgroundColor: "#fff",
                        "&:hover": {
                            borderColor: "#cbd5e1",
                            backgroundColor: "#f8fafc",
                        },
                    }}
                >
                    Cancelar
                </Button>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAdd}
                    disabled={!canConfirm}
                    sx={{
                        width: "100%",
                        textTransform: "none",
                        borderRadius: 1.5,
                        fontWeight: 800,
                        letterSpacing: 0.2,
                        boxShadow: "0 14px 35px rgba(26,146,255,0.35)",
                        background: "linear-gradient(135deg, #0f7bff 0%, #0ac5a8 100%)",
                        "&:hover": {
                            background: "linear-gradient(135deg, #0d6bdc 0%, #09ad93 100%)",
                        },
                    }}
                >
                    Agregar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
