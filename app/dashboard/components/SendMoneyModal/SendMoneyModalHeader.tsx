import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { useLanguageStore } from "@/app/store/useLanguageStore";

interface SendMoneyModalHeaderProps {
    onClose: () => void;
    disabled: boolean;
}

export const SendMoneyModalHeader = ({ onClose, disabled }: SendMoneyModalHeaderProps) => {
    const { language } = useLanguageStore();

    return (
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
                <SendIcon />
            </Box>

            <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800} fontSize={18} sx={{ lineHeight: 1.2 }}>
                    {language === "es" ? "Enviar fondos" : "Send Funds"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, fontSize: 13 }}>
                    {language === "es"
                        ? "Elige la red de destino e ingresa dirección, monto y contraseña."
                        : "Choose the destination network and enter address, amount, and password."}
                </Typography>
            </Box>

            <IconButton
                size="small"
                onClick={onClose}
                disabled={disabled}
                sx={{
                    color: "white",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 2,
                    "&:hover": {
                        background: "rgba(255,255,255,0.2)",
                    },
                    "&:disabled": {
                        color: "rgba(255,255,255,0.3)",
                    }
                }}
            >
                <CloseIcon />
            </IconButton>
        </Box>
    );
};
