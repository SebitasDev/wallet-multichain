import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface SendMoneyModalHeaderProps {
    onClose: () => void;
    disabled: boolean;
}

export const SendMoneyModalHeader = ({ onClose, disabled }: SendMoneyModalHeaderProps) => {
    return (
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
                Enviar dinero
            </Typography>

            <IconButton
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
