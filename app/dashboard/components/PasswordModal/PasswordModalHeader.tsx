import { Box, Typography, IconButton } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CloseIcon from "@mui/icons-material/Close";

interface PasswordModalHeaderProps {
    mode: "create" | "unlock";
    title?: string;
    description?: string;
    onClose?: () => void;
}

export const PasswordModalHeader = ({ mode, title, description, onClose }: PasswordModalHeaderProps) => {
    // Default values based on mode
    const defaultTitle = mode === "create" ? "Crea tu contraseña" : "Ingresa tu contraseña";
    const defaultDesc = mode === "create"
        ? "Protege tus wallets con una contraseña segura"
        : "Desbloquea tu sesión para continuar";

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 3,
                pb: 2.5,
                borderBottom: "3px solid #000000",
                position: "relative" // Ensure relative positioning for absolute children if needed, though flex handles it well
            }}
        >
            <Box
                sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    background: mode === "create" ? "#00DC8C" : "#7852FF",
                    border: "3px solid #000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <LockOutlinedIcon sx={{ fontSize: 28, color: "#ffffff" }} />
            </Box>

            <Box flex={1}>
                <Typography
                    component="h2"
                    sx={{
                        fontWeight: 900,
                        fontSize: { xs: 20, md: 24 },
                        color: "#000000",
                        lineHeight: 1.2,
                        mb: 0.5
                    }}
                >
                    {title || defaultTitle}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: "#666666",
                        fontWeight: 600,
                        fontSize: { xs: 12, md: 13 }
                    }}
                >
                    {description || defaultDesc}
                </Typography>
            </Box>

            {/* Close Button */}
            {onClose && (
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: -12,
                        right: -12,
                        color: "#999",
                        "&:hover": { color: "#000" }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            )}
        </Box>
    );
};
