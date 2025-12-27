
"use client";

import { Box, Typography, Modal, Button, Stack } from "@mui/material";
import { useLanguageStore } from "@/app/store/useLanguageStore";

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 400,
    bgcolor: 'white',
    border: '3px solid #000',
    boxShadow: "8px 8px 0px #000",
    borderRadius: "16px",
    p: 4,
    textAlign: "center"
};

interface LogoutModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function LogoutModal({ open, onClose, onConfirm }: LogoutModalProps) {
    const { language } = useLanguageStore();

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="logout-modal-title"
        >
            <Box sx={style}>
                <Typography id="logout-modal-title" variant="h6" fontWeight={900} mb={2}>
                    {language === "es" ? "¿Desconectar?" : "Disconnect?"}
                </Typography>

                <Typography mb={4} fontWeight={500}>
                    {language === "es"
                        ? "¿Estás seguro de que quieres desconectarte? Esto borrará las wallets de este dispositivo."
                        : "Are you sure you want to disconnect? This will wipe wallets from this device."
                    }
                </Typography>

                <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                        onClick={onClose}
                        sx={{
                            flex: 1,
                            color: "black",
                            border: "2px solid #000",
                            borderRadius: "12px",
                            fontWeight: 700,
                            textTransform: "none",
                            "&:hover": { bgcolor: "#f4f4f5" }
                        }}
                    >
                        {language === "es" ? "Cancelar" : "Cancel"}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        sx={{
                            flex: 1,
                            bgcolor: "#ef4444",
                            color: "white",
                            border: "2px solid #000",
                            borderRadius: "12px",
                            fontWeight: 700,
                            boxShadow: "4px 4px 0px #000",
                            textTransform: "none",
                            "&:hover": {
                                bgcolor: "#dc2626",
                                transform: "translate(-1px, -1px)",
                                boxShadow: "5px 5px 0px #000"
                            },
                            "&:active": {
                                transform: "translate(2px, 2px)",
                                boxShadow: "1px 1px 0px #000"
                            }
                        }}
                    >
                        {language === "es" ? "Desconectar" : "Disconnect"}
                    </Button>
                </Stack>
            </Box>
        </Modal>
    );
}
