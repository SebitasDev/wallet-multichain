import { Box, Typography, IconButton } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";

interface ReceiveModalHeaderProps {
    onClose: () => void;
}

export const ReceiveModalHeader = ({ onClose }: ReceiveModalHeaderProps) => {
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
                <DownloadIcon />
            </Box>

            <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800} fontSize={18} sx={{ lineHeight: 1.2 }}>
                    Recibir fondos
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, fontSize: 13 }}>
                    Elige la wallet y la red para recibir.
                </Typography>
            </Box>

            <IconButton
                size="small"
                onClick={onClose}
                sx={{
                    color: "white",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    p: 1,
                    transition: "all 0.2s",
                    "&:hover": {
                        background: "rgba(255,255,255,0.2)",
                        transform: "rotate(90deg)"
                    }
                }}
            >
                <CloseIcon />
            </IconButton>
        </Box>
    );
};
