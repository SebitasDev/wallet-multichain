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
import { LocalizedString, translate, useDashboardLang } from "@/app/dashboard/lang";

const copy = {
    toastIncomplete: { es: "Fill in name, password, and all 12 words.", en: "Fill in name, password, and all 12 words." },
    toastIncorrect: { es: "Incorrect password.", en: "Incorrect password." },
    toastSuccess: { es: 'Wallet "{{name}}" added successfully.', en: 'Wallet "{{name}}" added successfully.' },
    toastError: { es: "Error adding wallet", en: "Error adding wallet" },
    header: { es: "Add seed phrase", en: "Add seed phrase" },
    subheader: { es: "Paste the 12 words of your seed to link your wallet.", en: "Paste the 12 words of your seed to link your wallet." },
    labelName: { es: "Wallet name", en: "Wallet name" },
    placeholderName: { es: "e.g., My main wallet", en: "e.g., My main wallet" },
    labelSeed: { es: "Seed phrase (12 words)", en: "Seed phrase (12 words)" },
    placeholderSeed: { es: "word1 word2 ... word12", en: "word1 word2 ... word12" },
    helperSeed: { es: "Must be exactly 12 words.", en: "Must be exactly 12 words." },
    labelPassword: { es: "Password", en: "Password" },
    suffixUnlock: { es: " (to unlock)", en: " (to unlock)" },
    suffixEncrypt: { es: " (to encrypt)", en: " (to encrypt)" },
    placeholderPassword: { es: "••••••••", en: "••••••••" },
    cancel: { es: "Cancel", en: "Cancel" },
    add: { es: "Add", en: "Add" },
} satisfies Record<string, LocalizedString>;

type Props = {
    open: boolean;
    onClose: () => void;
};

export function AddSecretModal({ open, onClose }: Props) {
    const { addWallet } = useWalletStore();
    const lang = useDashboardLang();

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
            toast.error(translate(copy.toastIncomplete, lang));
            return;
        }

        try {
            // Si YA existe password almacenada, validar
            if (encryptedPassword) {
                const ok = await verifyPassword(password);

                if (!ok) {
                    toast.error(translate(copy.toastIncorrect, lang));
                    return;
                }
            }

            // Si NO existe password almacenada:
            // La password ingresada será la que se guarda como password maestra
            await addWallet(phrase, password, walletName);

            toast.success(translate(copy.toastSuccess, lang).replace("{{name}}", walletName));
            onClose();
            setWalletName("");
            setPhrase("");
            setPassword("");
        } catch (err) {
            console.error(err);
            toast.error((err as Error).message || translate(copy.toastError, lang));
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
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
                    background: "#000000",
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    color: "#fff",
                    borderBottom: "3px solid #000000",
                }}
            >
                <Box
                    sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 2.5,
                        background: "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid rgba(255,255,255,0.2)",
                    }}
                >
                    <AccountBalanceWalletOutlined />
                </Box>

                <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={800} fontSize={18} sx={{ lineHeight: 1.2 }}>
                        {translate(copy.header, lang)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, fontSize: 13 }}>
                        {translate(copy.subheader, lang)}
                    </Typography>
                </Box>

                <IconButton
                    size="small"
                    onClick={onClose}
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
                            {translate(copy.labelName, lang)}
                        </Typography>

                        <TextField
                            fullWidth
                            size="medium"
                            value={walletName}
                            onChange={({ target }) => setWalletName(target.value)}
                            placeholder={translate(copy.placeholderName, lang)}
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
                                },
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
                            {translate(copy.labelSeed, lang)}
                        </Typography>

                        <TextField
                            fullWidth
                            size="medium"
                            value={phrase}
                            onChange={({ target }) => setPhrase(target.value)}
                            placeholder={translate(copy.placeholderSeed, lang)}
                            InputProps={{
                                sx: {
                                    borderRadius: 2,
                                    background: "#f5f5f5",
                                    border: "2px solid #000000",
                                    fontWeight: 600,
                                    fontFamily: "monospace",
                                    fontSize: 13,
                                    "&:hover": {
                                        background: "#ffffff",
                                    },
                                    "&.Mui-focused": {
                                        background: "#ffffff",
                                    }
                                },
                            }}
                            multiline
                            minRows={3}
                            helperText={
                                <Box
                                    component="span"
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: 12,
                                        color: has12Words ? "#00DC8C" : "#666666"
                                    }}
                                >
                                     {phrase ? `${words.length}/12 words` : translate(copy.helperSeed, lang)}
                                </Box>
                            }
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
                            {translate(copy.labelPassword, lang)}
                            {encryptedPassword ? translate(copy.suffixUnlock, lang) : translate(copy.suffixEncrypt, lang)}
                        </Typography>

                        <TextField
                            fullWidth
                            size="medium"
                            type="password"
                            value={password}
                            onChange={({ target }) => setPassword(target.value)}
                            placeholder={translate(copy.placeholderPassword, lang)}
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
                                },
                            }}
                        />
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    pb: 3,
                    pt: 1,
                    gap: 2,
                    background: "#ffffff",
                }}
            >
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={onClose}
                    sx={{
                        flex: 1,
                        textTransform: "none",
                        borderRadius: 3,
                        py: 1.4,
                        fontWeight: 800,
                        fontSize: 15,
                        background: "#ffffff",
                        color: "#000000",
                        border: "3px solid #000000",
                        boxShadow: "4px 4px 0px #000000",
                        transition: "all 0.2s",
                        "&:hover": {
                            background: "#f5f5f5",
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000",
                        },
                    }}
                >
                    {translate(copy.cancel, lang)}
                </Button>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAdd}
                    disabled={!canConfirm}
                    sx={{
                        flex: 1,
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
                        "&:hover": {
                            background: "#00CC7C",
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000",
                        },
                        "&:disabled": {
                            opacity: 0.4,
                            background: "#cccccc",
                            transform: "none",
                        },
                    }}
                >
                    {translate(copy.add, lang)}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
