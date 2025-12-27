
"use client";

import { Box, Typography, Modal, IconButton, Avatar, Stack, TextField, InputAdornment } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import { useLanguageStore } from "@/app/store/useLanguageStore";
import { useState } from "react";
import { toast } from "react-toastify";

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%', // Full screen on mobile typically, or large modal
    bgcolor: '#18181b', // Dark background as per image
    color: 'white',
    p: 0,
    display: 'flex',
    flexDirection: 'column'
};

interface SupportModalProps {
    open: boolean;
    onClose: () => void;
}

export function SupportModal({ open, onClose }: SupportModalProps) {
    const { language } = useLanguageStore();
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (!email || !message) {
            toast.error(language === "es" ? "Por favor completa todos los campos" : "Please fill in all fields");
            return;
        }
        toast.success(language === "es" ? "Mensaje enviado a soporte" : "Message sent to support");
        setEmail("");
        setMessage("");
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="support-modal-title"
        >
            <Box sx={style}>
                {/* Header */}
                <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <IconButton onClick={onClose} sx={{ color: "white" }}>
                        <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" fontWeight={700}>
                        {language === "es" ? "Contactar con soporte..." : "Contact Support..."}
                    </Typography>
                    <Box sx={{ width: 40 }} /> {/* Spacer for centering */}
                </Box>

                {/* Chat Header Card */}
                <Box sx={{ bgcolor: "#27272a", mx: 2, p: 2, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <ArrowBackIcon sx={{ color: "#a1a1aa", fontSize: 20 }} />
                        <Stack direction="row" spacing={-1}>
                            <Avatar sx={{ width: 32, height: 32, border: "2px solid #27272a" }}>🐶</Avatar>
                            <Avatar sx={{ width: 32, height: 32, border: "2px solid #27272a", bgcolor: "#f472b6" }}>👩‍💻</Avatar>
                        </Stack>
                        <Stack>
                            <Typography fontWeight={700} fontSize={14}>Support Center</Typography>
                        </Stack>
                    </Stack>
                    <IconButton onClick={onClose} size="small" sx={{ color: "#a1a1aa" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Content Area (Empty in image, spacer here) */}
                <Box sx={{ flex: 1 }} />

                {/* Input Area */}
                <Box sx={{ p: 2, pb: 4 }}>
                    <Box sx={{ bgcolor: "#27272a", borderRadius: "16px", p: 1, border: "1px solid #3f3f46" }}>
                        <TextField
                            fullWidth
                            placeholder="email@example.com"
                            variant="standard"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            InputProps={{
                                disableUnderline: true,
                                sx: { color: "white", px: 1, fontSize: 14 }
                            }}
                            sx={{ mb: 1, borderBottom: "1px solid #3f3f46" }}
                        />
                        <Stack direction="row" alignItems="flex-end" spacing={1}>
                            <TextField
                                fullWidth
                                multiline
                                maxRows={4}
                                placeholder={language === "es" ? "Escribe un mensaje..." : "Write a message..."}
                                variant="standard"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                InputProps={{
                                    disableUnderline: true,
                                    sx: { color: "white", px: 1 }
                                }}
                            />
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1, px: 1 }}>
                            <SentimentSatisfiedAltIcon sx={{ color: "#71717a" }} />
                            <IconButton
                                onClick={handleSend}
                                sx={{
                                    bgcolor: "#3f3f46",
                                    color: "white",
                                    width: 32,
                                    height: 32,
                                    "&:hover": { bgcolor: "#52525b" }
                                }}
                            >
                                <SendIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
}
