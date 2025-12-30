"use client";

import { Box, Typography, IconButton, Avatar } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useUserStore } from "@/app/store/useUserStore";

interface PasswordModalHeaderProps {
    mode: "create" | "unlock";
    title?: string;
    description?: string;
    onClose?: () => void;
}

export const PasswordModalHeader = ({ mode, title, description, onClose }: PasswordModalHeaderProps) => {
    const { name, email } = useUserStore();

    // Default values based on mode
    const defaultTitle = mode === "create" ? "Crea tu clave" : "Ingresá tu clave";

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
                width: "100%",
                position: "relative"
            }}
        >
            {/* Close Button */}
            {onClose && (
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: -10,
                        right: 0,
                        color: "white",
                        "&:hover": { color: "#ccc" }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            )}

            {/* Avatar */}
            <Avatar
                sx={{
                    width: 80, // Increased from 56
                    height: 80,
                    bgcolor: "#00DC8C",
                    border: "3px solid #00DC8C",
                    fontSize: 32,
                    fontWeight: 900,
                    color: "black"
                }}
            >
                {name.charAt(0).toUpperCase()}
            </Avatar>

            <Box textAlign="center">
                <Typography
                    component="h2"
                    sx={{
                        fontWeight: 700,
                        fontSize: 24, // Increased from 18
                        color: "white",
                        letterSpacing: 0.5,
                        mb: 0.5
                    }}
                >
                    {title || defaultTitle}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: "#999",
                        fontWeight: 500,
                        fontSize: 14 // Increased from 12
                    }}
                >
                    {description || "Necesitamos verificar que eres tú."}
                </Typography>
            </Box>
        </Box>
    );
};
