
import { Box, Button, Modal, TextField, Typography, CircularProgress } from "@mui/material";
import { useState } from "react";
import { toast } from "react-toastify";
import { useXOContracts } from "../hooks/wallet/useXOConnect";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import CloseIcon from "@mui/icons-material/Close";

interface LoadWalletModalProps {
    open: boolean;
    onClose: () => void;
}

export const LoadWalletModal = ({ open, onClose }: LoadWalletModalProps) => {
    const { loadWallet } = useXOContracts();
    const [mnemonic, setMnemonic] = useState("");
    const [password, setPassword] = useState("");
    const [currentPasswordInput, setCurrentPasswordInput] = useState("");
    const [loading, setLoading] = useState(false);

    const hasEncryptedPassword = useWalletPasswordStore(s => !!s.encryptedPassword);
    const verifyPassword = useWalletPasswordStore(s => s.verifyPassword);

    const handleImport = async () => {
        // If password already exists, we only need mnemonic + currentPassword
        if (hasEncryptedPassword) {
            if (!mnemonic.trim() || !currentPasswordInput.trim()) {
                toast.error("Por favor completa todos los campos");
                return;
            }
        } else {
            // New wallet: we need mnemonic + new password
            if (!mnemonic.trim() || !password.trim()) {
                toast.error("Por favor completa todos los campos");
                return;
            }
        }

        const words = mnemonic.trim().split(/\s+/);
        if (words.length !== 12) {
            toast.error(`La frase debe tener 12 palabras (actualmente: ${words.length})`);
            return;
        }

        setLoading(true);
        try {
            // Security Check
            if (hasEncryptedPassword) {
                const isValid = await verifyPassword(currentPasswordInput);
                if (!isValid) {
                    throw new Error("La contraseña actual es incorrecta");
                }
            }

            // Decide which password to use for encryption
            const finalPassword = hasEncryptedPassword ? currentPasswordInput : password;
            await loadWallet(mnemonic, finalPassword);
            toast.success("Wallet importada exitosamente");
            onClose();
            // Reset fields
            setMnemonic("");
            setPassword("");
            setCurrentPasswordInput("");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al importar wallet");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={loading ? undefined : onClose}>
            <Box sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
                bgcolor: "background.paper",
                border: "3px solid #000",
                boxShadow: "10px 10px 0px #000",
                p: 4,
                outline: "none",
                borderRadius: 4
            }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                        CARGAR WALLET
                    </Typography>
                    <Button onClick={onClose} disabled={loading} sx={{ minWidth: "auto", color: "black" }}>
                        <CloseIcon />
                    </Button>
                </Box>

                <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                    Frase Semilla (12 Palabras)
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="palabra1 palabra2 palabra3 ..."
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    disabled={loading}
                    sx={{
                        mb: 3,
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            border: "2px solid #000",
                            "& fieldset": { border: "none" }
                        }
                    }}
                />

                {hasEncryptedPassword ? (
                    <>
                        <Typography sx={{ fontWeight: "bold", mb: 1, color: "#FF4444" }}>
                            Contraseña Actual (Seguridad)
                        </Typography>
                        <TextField
                            fullWidth
                            type="password"
                            placeholder="Ingresa tu contraseña para confirmar"
                            value={currentPasswordInput}
                            onChange={(e) => setCurrentPasswordInput(e.target.value)}
                            disabled={loading}
                            sx={{
                                mb: 4,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    border: "2px solid #FF4444",
                                    "& fieldset": { border: "none" }
                                }
                            }}
                        />
                    </>
                ) : (
                    <>
                        <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                            Contraseña Nueva
                        </Typography>
                        <TextField
                            fullWidth
                            type="password"
                            placeholder="******"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            sx={{
                                mb: 4,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    border: "2px solid #000",
                                    "& fieldset": { border: "none" }
                                }
                            }}
                        />
                    </>
                )}

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleImport}
                    disabled={loading}
                    sx={{
                        bgcolor: "#00DC8C",
                        color: "black",
                        fontWeight: 900,
                        fontSize: "1.1rem",
                        py: 1.5,
                        borderRadius: 3,
                        border: "2px solid #000",
                        boxShadow: "4px 4px 0px #000",
                        "&:hover": {
                            bgcolor: "#00C27A",
                            boxShadow: "2px 2px 0px #000",
                            transform: "translate(2px, 2px)"
                        },
                        "&:disabled": {
                            bgcolor: "#ccc",
                            color: "#666"
                        }
                    }}
                >
                    {loading ? <CircularProgress size={24} sx={{ color: "black" }} /> : "IMPORTAR WALLET"}
                </Button>
            </Box>
        </Modal>
    );
};
