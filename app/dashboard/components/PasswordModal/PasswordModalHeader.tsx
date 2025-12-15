import { Box, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

interface PasswordModalHeaderProps {
    mode: "create" | "unlock";
}

export const PasswordModalHeader = ({ mode }: PasswordModalHeaderProps) => {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 3,
                pb: 2.5,
                borderBottom: "3px solid #000000",
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
                    {mode === "create" ? "Crea tu contraseña" : "Ingresa tu contraseña"}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: "#666666",
                        fontWeight: 600,
                        fontSize: { xs: 12, md: 13 }
                    }}
                >
                    {mode === "create"
                        ? "Protege tus wallets con una contraseña segura"
                        : "Desbloquea tu sesión para continuar"
                    }
                </Typography>
            </Box>
        </Box>
    );
};
