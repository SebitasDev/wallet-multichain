"use client";

import { useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    TextField,
    Typography,
    Stack,
    IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { generateMnemonic } from "viem/accounts";
import {useWalletStore} from "@/app/store/useWalletsStore";
import {wordlist} from "@scure/bip39/wordlists/english";
import {useWalletPasswordStore} from "@/app/store/useWalletPasswordStore";

export function GenerateWalletButton() {
    const { addWallet } = useWalletStore();
    const verifyPassword = useWalletPasswordStore(s => s.verifyPassword);

    const [open, setOpen] = useState(false);
    const [walletName, setWalletName] = useState("");
    const [password, setPassword] = useState("");
    const [mnemonic, setMnemonic] = useState("");

    const openModal = () => {
        const generatedMnemonic = generateMnemonic(wordlist);
        setMnemonic(generatedMnemonic);
        setOpen(true);
    };

    const closeModal = () => {
        setOpen(false);
        setWalletName("");
        setPassword("");
        setMnemonic("");
    };

    const handleCreate = async () => {
        if (!walletName.trim() || !password.trim()) {
            toast.error("Completa nombre y contraseña");
            return;
        }

        const isValid = await verifyPassword(password);
        if (!isValid) {
            toast.error("Contraseña incorrecta");
            return;
        }

        try {
            await addWallet(mnemonic, password, walletName);

            toast.success(`Wallet "${walletName}" creada correctamente`);
            closeModal();
        } catch (err) {
            console.error(err);
            toast.error((err as Error).message || "Error creando wallet");
        }
    };


    return (
        <>
            {/* BOTÓN */}
            <Button
                variant="contained"
                onClick={openModal}
                sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #0f7bff 0%, #0ac5a8 100%)",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
                }}
            >
                Generar nueva address
            </Button>

            {/* MODAL */}
            <Dialog
                open={open}
                onClose={closeModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: "hidden",
                        backdropFilter: "blur(15px)",
                    },
                }}
            >
                {/* HEADER */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        px: 3,
                        py: 2,
                        background: "linear-gradient(135deg, #1f50ff 0%, #19a3b7 50%, #16a34a 100%)",
                        color: "#fff",
                    }}
                >
                    <Typography sx={{ flex: 1 }} fontSize={18} fontWeight={800}>
                        Crear nueva wallet
                    </Typography>

                    <IconButton onClick={closeModal} sx={{ color: "white" }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* CONTENT */}
                <DialogContent sx={{ px: 3, py: 3 }}>
                    <Stack spacing={2.2}>
                        <Box>
                            <Typography fontWeight={700} fontSize={14} sx={{ mb: 0.5 }}>
                                Nombre de la wallet
                            </Typography>
                            <TextField
                                fullWidth
                                value={walletName}
                                onChange={(e) => setWalletName(e.target.value)}
                                placeholder="Ej: Mi Wallet"
                                InputProps={{ sx: { borderRadius: 2, background: "#f8fafc" } }}
                            />
                        </Box>

                        <Box>
                            <Typography fontWeight={700} fontSize={14} sx={{ mb: 0.5 }}>
                                Contraseña
                            </Typography>
                            <TextField
                                fullWidth
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                InputProps={{ sx: { borderRadius: 2, background: "#f8fafc" } }}
                            />
                        </Box>

                        <Box>
                            <Typography fontWeight={700} fontSize={14} sx={{ mb: 0.5 }}>
                                Frase secreta (generada automáticamente)
                            </Typography>
                            <TextField
                                fullWidth
                                value={mnemonic}
                                multiline
                                disabled
                                minRows={3}
                                InputProps={{ sx: { borderRadius: 2, background: "#e2e8f0" } }}
                            />
                        </Box>
                    </Stack>
                </DialogContent>

                {/* ACTIONS */}
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleCreate}
                        sx={{
                            textTransform: "none",
                            borderRadius: 2,
                            py: 1.4,
                            fontWeight: 800,
                            background: "linear-gradient(135deg, #0f7bff 0%, #0ac5a8 100%)",
                            "&:disabled": { opacity: 0.4 },
                        }}
                        disabled={!walletName || !password}
                    >
                        Crear Wallet
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
