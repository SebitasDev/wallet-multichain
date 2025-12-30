"use client";

import { Box, Typography, IconButton, Button } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import { useEffect, useState } from "react";
import { useUserStore } from "@/app/store/useUserStore";
import { ResetWalletModal } from "./ResetWalletModal";

interface PasswordModalFormProps {
    password: string;
    setPassword: (val: string) => void;
    error: string;
    setError: (val: string) => void;
    showPassword: boolean;
    setShowPassword: (val: boolean | ((prev: boolean) => boolean)) => void;
    errorId: string;
    mode: "create" | "unlock";
    onSubmit: () => void;
}

export const PasswordModalForm = ({
    password,
    setPassword,
    error,
    setError,
    showPassword,
    setShowPassword,
    onSubmit
}: PasswordModalFormProps) => {
    const { email } = useUserStore();
    const [showResetModal, setShowResetModal] = useState(false);
    const MAX_LENGTH = 6;

    const handleNumberClick = (num: string) => {
        if (password.length < MAX_LENGTH) {
            setPassword(password + num);
            if (error) setError("");
        }
    };

    const handleBackspace = () => {
        setPassword(password.slice(0, -1));
        if (error) setError("");
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= "0" && e.key <= "9") {
                handleNumberClick(e.key);
            } else if (e.key === "Backspace") {
                handleBackspace();
            } else if (e.key === "Enter") {
                onSubmit();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [password, error, onSubmit]);

    return (
        <Box display="flex" flexDirection="column" alignItems="center" width="100%">
            {/* DOTS DISPLAY */}
            <Box display="flex" gap={1.5} mb={1}>
                {[...Array(MAX_LENGTH)].map((_, i) => (
                    <Box
                        key={i}
                        sx={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            bgcolor: i < password.length ? (showPassword ? "transparent" : "#333333") : "#1a1a1a",
                            border: showPassword && i < password.length ? "none" : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: 14,
                            fontWeight: 700
                        }}
                    >
                        {showPassword && i < password.length ? password[i] : ""}
                    </Box>
                ))}
            </Box>

            {/* Visibility Toggle */}
            <IconButton
                onClick={() => setShowPassword((prev) => !prev)}
                sx={{
                    color: "#00DC8C",
                    mb: 1,
                    p: 0,
                    "& svg": { fontSize: 18 }
                }}
            >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>

            {/* Support Links */}
            <Box mb={2} textAlign="center">
                <Typography
                    variant="body2"

                    sx={{ color: "#00DC8C", fontWeight: 600, cursor: "pointer", fontSize: 12 }}
                    onClick={() => setShowResetModal(true)}
                >
                    Olvidé mi clave
                </Typography>
            </Box>

            {/* Custom Numpad */}
            <Box sx={{ width: "100%", maxWidth: 320 }}>
                {/* Row 1 */}
                <Box display="flex" justifyContent="space-between" mb={1.5}>
                    {[1, 2, 3].map((num) => (
                        <NumpadButton key={num} value={num.toString()} onClick={handleNumberClick} />
                    ))}
                </Box>
                {/* Row 2 */}
                <Box display="flex" justifyContent="space-between" mb={1.5}>
                    {[4, 5, 6].map((num) => (
                        <NumpadButton key={num} value={num.toString()} onClick={handleNumberClick} />
                    ))}
                </Box>
                {/* Row 3 */}
                <Box display="flex" justifyContent="space-between" mb={1.5}>
                    {[7, 8, 9].map((num) => (
                        <NumpadButton key={num} value={num.toString()} onClick={handleNumberClick} />
                    ))}
                </Box>
                {/* Row 4 */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    {/* Enter Button (Check) */}
                    <Button
                        onClick={() => onSubmit()}
                        disabled={password.length !== 6}
                        sx={{
                            color: "black",
                            bgcolor: "#00DC8C",
                            border: "2px solid #00DC8C",
                            fontSize: 28,
                            fontWeight: 900,
                            minWidth: 64, // Bigger size
                            height: 64,
                            borderRadius: "50%",
                            transition: "all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)",
                            boxShadow: "0px 4px 10px rgba(0, 220, 140, 0.3)",
                            "&:hover": {
                                bgcolor: "#00cc7d",
                                transform: "scale(1.1)",
                                boxShadow: "0px 6px 15px rgba(0, 220, 140, 0.5)"
                            },
                            "&:active": {
                                transform: "scale(0.95)"
                            },
                            "&:disabled": {
                                bgcolor: "#333",
                                color: "#666",
                                border: "2px solid #333",
                                boxShadow: "none",
                                transform: "none"
                            }
                        }}
                    >
                        ✓
                    </Button>

                    <NumpadButton value="0" onClick={handleNumberClick} />

                    <Button
                        onClick={handleBackspace}
                        sx={{
                            color: "white",
                            minWidth: 64,
                            height: 64,
                            borderRadius: "50%",
                            transition: "all 0.2s",
                            "&:hover": {
                                bgcolor: "rgba(255,68,68,0.1)",
                                color: "#ff4444"
                            },
                            "&:active": {
                                transform: "scale(0.9)"
                            }
                        }}
                    >
                        <BackspaceOutlinedIcon sx={{ fontSize: 28 }} />
                    </Button>
                </Box>
            </Box>

            {/* Hidden Submit Button */}
            <button type="submit" style={{ display: 'none' }} />

            {/* Error Message */}
            {error && (
                <Typography color="#ff4444" mt={1} fontWeight={700} fontSize={13}>
                    {error}
                </Typography>
            )}

            <ResetWalletModal
                open={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={() => {
                    window.localStorage.clear();
                    window.sessionStorage.clear();
                    window.location.reload();
                }}
            />
        </Box>
    );
};

// Helper Component for Numpad Buttons
const NumpadButton = ({ value, onClick }: { value: string, onClick: (v: string) => void }) => (
    <Button
        onClick={() => onClick(value)}
        sx={{
            color: "white",
            fontSize: 28, // Bigger font
            fontWeight: 500,
            minWidth: 64, // Bigger size
            height: 64,
            borderRadius: "50%",
            border: "2px solid transparent",
            transition: "all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)",
            "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
                border: "2px solid #00DC8C", // Brand Teal on hover
                transform: "scale(1.1)",
                color: "#00DC8C"
            },
            "&:active": {
                bgcolor: "#00DC8C",
                color: "black",
                transform: "scale(0.95)"
            }
        }}
    >
        {value}
    </Button>
);
