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
                    borderRadius: 3,
                    px: 3.4,
                    py: 1.5,
                    minHeight: 50,
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    background: "#4f46ff",
                    color: "#ffffff",
                    border: "3px solid #000000",
                    boxShadow: "4px 4px 0px #000000",
                    whiteSpace: "nowrap",
                    width: "100%",
                    minWidth: 0,
                    maxWidth: 240,
                    transition: "all 0.2s",
                    "&:hover": {
                        background: "#5b55ff",
                        transform: "translate(2px, 2px)",
                        boxShadow: "2px 2px 0px #000000",
                    },
                }}
            >
                Generar address
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
                        border: "3px solid #000000",
                        boxShadow: "8px 8px 0px #000000",
                        background: "#ffffff",
                    },
                }}
            >
                {/* HEADER */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        px: 3,
                        py: 2.5,
                        background: "#000000",
                        color: "#fff",
                        borderBottom: "3px solid #000000",
                    }}
                >
                    <Typography sx={{ flex: 1 }} fontSize={18} fontWeight={800}>
                        Crear nueva wallet
                    </Typography>

                    <IconButton
                        onClick={closeModal}
                        sx={{
                            color: "white",
                            background: "rgba(255,255,255,0.1)",
                            borderRadius: 2,
                            "&:hover": {
                                background: "rgba(255,255,255,0.2)",
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* CONTENT */}
                <DialogContent sx={{ px: 3, py: 3, background: "#ffffff" }}>
                    <Stack spacing={2.5}>
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
                                Nombre de la wallet
                            </Typography>
                            <TextField
                                fullWidth
                                value={walletName}
                                onChange={(e) => setWalletName(e.target.value)}
                                placeholder="Ej: Mi Wallet"
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
                                        }
                                    }
                                }}
                            />
                        </Box>

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
                                Contraseña
                            </Typography>
                            <TextField
                                fullWidth
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
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
                                        }
                                    }
                                }}
                            />
                        </Box>

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
                                Frase secreta (generada automáticamente)
                            </Typography>
                            <TextField
                                fullWidth
                                value={mnemonic}
                                multiline
                                disabled
                                minRows={3}
                                InputProps={{
                                    sx: {
                                        borderRadius: 2,
                                        background: "#f5f5f5",
                                        border: "2px solid #000000",
                                        fontFamily: "monospace",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#000000",
                                    }
                                }}
                            />
                        </Box>
                    </Stack>
                </DialogContent>

                {/* ACTIONS */}
                <DialogActions sx={{ px: 3, pb: 3, background: "#ffffff" }}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleCreate}
                        sx={{
                            textTransform: "none",
                            borderRadius: 3,
                            py: 1.4,
                            fontWeight: 800,
                            fontSize: 15,
                            background: "#00DC8C",
                            color: "#000000",
                            border: "3px solid #000000",
                            boxShadow: "4px 4px 0px #000000",
                            transition: "all 0.2s",
                            "&:disabled": {
                                opacity: 0.4,
                                background: "#cccccc",
                            },
                            "&:hover": {
                                background: "#00CC7C",
                                transform: "translate(2px, 2px)",
                                boxShadow: "2px 2px 0px #000000",
                            },
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