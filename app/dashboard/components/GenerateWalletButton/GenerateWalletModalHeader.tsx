import {
    Box,
    Typography,
    IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface GenerateWalletModalHeaderProps {
    onClose: () => void;
}

export const GenerateWalletModalHeader = ({ onClose }: GenerateWalletModalHeaderProps) => {
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
                Crear nueva wallet
            </Typography>

            <IconButton
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
