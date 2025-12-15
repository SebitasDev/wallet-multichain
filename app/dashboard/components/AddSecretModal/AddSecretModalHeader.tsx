import {
    Box,
    Typography,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";

interface AddSecretModalHeaderProps {
    onClose: () => void;
}

export const AddSecretModalHeader = ({ onClose }: AddSecretModalHeaderProps) => {
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
                <AccountBalanceWalletOutlined />
            </Box>

            <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800} fontSize={18} sx={{ lineHeight: 1.2 }}>
                    Agregar Frase Secreta
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, fontSize: 13 }}>
                    Pega las 12 palabras de tu seed para vincular tu wallet.
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
    );
};
