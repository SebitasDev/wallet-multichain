"use client";

import { Box, Typography, Modal, Button, TextField, Stack, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import { useLanguageStore } from "@/app/store/useLanguageStore";
import { toast } from "react-toastify";
import { ContentCopy } from "@mui/icons-material";

export interface PayMethod {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    color?: string;
    status: "active" | "coming_soon";
    type?: "phone" | "link" | "mercadopago" | "pix" | "bank";
}

interface PayActionModalProps {
    open: boolean;
    onClose: () => void;
    method: PayMethod | null;
}

export function PayActionModal({ open, onClose, method }: PayActionModalProps) {
    const { language } = useLanguageStore();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"input" | "success">("input");
    const [inputValue, setInputValue] = useState("");

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setStep("input");
            setInputValue("");
            setLoading(false);
        }
    }, [open]);

    if (!method) return null;

    const handleConfirm = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setStep("success");
            toast.success(language === "es" ? "¡Operación exitosa!" : "Operation successful!");
            setTimeout(onClose, 2000);
        }, 1500);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText("https://1llet.com/pay/USER_ID");
        toast.success(language === "es" ? "Link copiado" : "Link copied");
    };

    const renderContent = () => {
        if (method.type === "link") {
            return (
                <Box textAlign="center">
                    <Typography mb={2} color="#9ca3af">
                        {language === "es" ? "Comparte este link para recibir pagos." : "Share this link to receive payments."}
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            background: "#2e3246",
                            p: 2,
                            borderRadius: 2,
                            mb: 3,
                            cursor: "pointer"
                        }}
                        onClick={handleCopyLink}
                    >
                        <Typography sx={{ flex: 1, color: "white", fontFamily: "monospace" }}>
                            https://1llet.com/pay/USER_ID
                        </Typography>
                        <ContentCopy sx={{ color: "#9ca3af" }} />
                    </Box>
                    <Button
                        onClick={onClose}
                        fullWidth
                        sx={{
                            bgcolor: method.color || "#2dd4bf",
                            color: "black",
                            fontWeight: 800,
                            py: 1.5,
                            borderRadius: "12px",
                            "&:hover": { opacity: 0.9, bgcolor: method.color || "#2dd4bf" }
                        }}
                    >
                        {language === "es" ? "Cerrar" : "Close"}
                    </Button>
                </Box>
            );
        }

        return (
            <>
                <Typography mb={3} color="#9ca3af">
                    {method.type === "phone" && (language === "es" ? "Ingresa el número de teléfono" : "Enter phone number")}
                    {method.type === "mercadopago" && (language === "es" ? "Ingresa CVU, Alias o Teléfono" : "Enter CVU, Alias, or Phone")}
                    {method.type === "pix" && (language === "es" ? "Ingresa la clave PIX" : "Enter PIX Key")}
                    {method.type === "bank" && (language === "es" ? "Ingresa el número de cuenta" : "Enter account number")}
                </Typography>

                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={
                        method.type === "phone" ? "+54 9 11..." :
                            method.type === "mercadopago" ? "alias.mp" :
                                method.type === "pix" ? "CPF / Phone / Email" :
                                    "0000000000"
                    }
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    sx={{
                        mb: 3,
                        input: { color: "white" },
                        "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "#3f4357" },
                            "&:hover fieldset": { borderColor: "#9ca3af" },
                            "&.Mui-focused fieldset": { borderColor: method.color || "#2dd4bf" },
                        }
                    }}
                />

                <Button
                    onClick={handleConfirm}
                    fullWidth
                    disabled={loading || !inputValue}
                    sx={{
                        bgcolor: method.color || "#2dd4bf",
                        color: "black",
                        fontWeight: 800,
                        py: 1.5,
                        borderRadius: "12px",
                        "&:hover": { opacity: 0.9, bgcolor: method.color || "#2dd4bf" },
                        "&:disabled": { bgcolor: "#3f4357", color: "#6b7280" }
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : (language === "es" ? "Confirmar" : "Confirm")}
                </Button>
            </>
        );
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "90%",
                maxWidth: 400,
                bgcolor: "#18181b",
                border: "2px solid #3f4357",
                borderRadius: "24px",
                p: 4,
                boxShadow: 24,
                outline: "none"
            }}>
                <Typography variant="h5" color="white" fontWeight={800} mb={1}>
                    {method.title}
                </Typography>

                {renderContent()}
            </Box>
        </Modal>
    );
}
