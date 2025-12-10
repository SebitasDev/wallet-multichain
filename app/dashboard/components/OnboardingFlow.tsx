"use client";

import { Box, Button, Typography, Stack, TextField, IconButton, InputAdornment } from "@mui/material";
import { useState } from "react";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShieldIcon from "@mui/icons-material/Shield";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type Props = {
    onComplete: (password: string) => void;
    mode?: "create" | "unlock";
};

const steps = [
    { title: "Welcome", subtitle: "to Multichain Wallet" },
    { title: "Secure", subtitle: "Your Wallet" },
];

export function OnboardingFlow({ onComplete, mode = "create" }: Props) {
    const [step, setStep] = useState(mode === "unlock" ? 1 : 0);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleNext = () => {
        if (step === 0) {
            setStep(1);
        } else if (step === 1) {
            if (mode === "create") {
                if (password.length < 8) {
                    setError("Password must be at least 8 characters");
                    return;
                }
                if (password !== confirmPassword) {
                    setError("Passwords do not match");
                    return;
                }
            }
            if (!password) {
                setError("Please enter your password");
                return;
            }
            onComplete(password);
        }
    };

    const handleBack = () => {
        if (step > 0 && mode === "create") {
            setStep(step - 1);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #0a0e17 0%, #0f1729 100%)",
                p: 3,
            }}
        >
            {/* Background decoration */}
            <Box
                sx={{
                    position: "fixed",
                    top: "20%",
                    left: "10%",
                    width: "40%",
                    height: "60%",
                    background: "radial-gradient(circle, rgba(14, 165, 233, 0.06) 0%, transparent 60%)",
                    pointerEvents: "none",
                }}
            />
            <Box
                sx={{
                    position: "fixed",
                    bottom: "10%",
                    right: "10%",
                    width: "40%",
                    height: "60%",
                    background: "radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 60%)",
                    pointerEvents: "none",
                }}
            />

            <Box
                sx={{
                    width: "100%",
                    maxWidth: 440,
                    position: "relative",
                }}
            >
                {/* Step 0: Welcome */}
                {step === 0 && mode === "create" && (
                    <Box sx={{ textAlign: "center" }}>
                        <Box
                            sx={{
                                width: 100,
                                height: 100,
                                borderRadius: "28px",
                                background: "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 4,
                                boxShadow: "0 16px 40px rgba(14, 165, 233, 0.3)",
                            }}
                        >
                            <AccountBalanceWalletIcon sx={{ fontSize: 48, color: "#fff" }} />
                        </Box>

                        <Typography
                            sx={{
                                fontSize: "32px",
                                fontWeight: 800,
                                color: "#f1f5f9",
                                mb: 1.5,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            Welcome to
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: "32px",
                                fontWeight: 800,
                                background: "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                mb: 2,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            Multichain Wallet
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: "15px",
                                color: "#94a3b8",
                                mb: 5,
                                maxWidth: 320,
                                mx: "auto",
                                lineHeight: 1.6,
                            }}
                        >
                            Manage all your crypto assets across multiple chains from one beautiful dashboard.
                        </Typography>

                        {/* Features */}
                        <Stack spacing={2} sx={{ mb: 5 }}>
                            {[
                                { icon: "🔗", text: "6 chains supported" },
                                { icon: "⚡", text: "Fast cross-chain transfers" },
                                { icon: "🔐", text: "Local encryption" },
                            ].map((feature) => (
                                <Stack
                                    key={feature.text}
                                    direction="row"
                                    alignItems="center"
                                    spacing={2}
                                    sx={{
                                        p: 2,
                                        borderRadius: "12px",
                                        background: "rgba(255, 255, 255, 0.04)",
                                        border: "1px solid rgba(255, 255, 255, 0.08)",
                                    }}
                                >
                                    <Typography sx={{ fontSize: "24px" }}>{feature.icon}</Typography>
                                    <Typography sx={{ color: "#f1f5f9", fontWeight: 500 }}>
                                        {feature.text}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>

                        <Button
                            fullWidth
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            onClick={handleNext}
                            sx={{
                                textTransform: "none",
                                py: 1.5,
                                borderRadius: "12px",
                                fontWeight: 700,
                                fontSize: "16px",
                                background: "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
                                boxShadow: "0 8px 24px rgba(14, 165, 233, 0.35)",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)",
                                },
                            }}
                        >
                            Get Started
                        </Button>
                    </Box>
                )}

                {/* Step 1: Password Setup / Unlock */}
                {(step === 1 || mode === "unlock") && (
                    <Box
                        sx={{
                            p: 4,
                            borderRadius: "24px",
                            background: "linear-gradient(145deg, #0f1729 0%, #131c2d 100%)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.4)",
                        }}
                    >
                        {mode === "create" && (
                            <IconButton
                                onClick={handleBack}
                                sx={{
                                    position: "absolute",
                                    top: 16,
                                    left: 16,
                                    color: "#64748b",
                                    "&:hover": { color: "#f1f5f9" },
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                        )}

                        <Box sx={{ textAlign: "center", mb: 4 }}>
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: "18px",
                                    background: mode === "unlock"
                                        ? "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)"
                                        : "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mx: "auto",
                                    mb: 2.5,
                                }}
                            >
                                {mode === "unlock" ? (
                                    <LockOutlinedIcon sx={{ fontSize: 32, color: "#fff" }} />
                                ) : (
                                    <ShieldIcon sx={{ fontSize: 32, color: "#10b981" }} />
                                )}
                            </Box>
                            <Typography
                                sx={{
                                    fontSize: "24px",
                                    fontWeight: 800,
                                    color: "#f1f5f9",
                                    mb: 0.5,
                                }}
                            >
                                {mode === "unlock" ? "Welcome Back" : "Secure Your Wallet"}
                            </Typography>
                            <Typography sx={{ fontSize: "14px", color: "#64748b" }}>
                                {mode === "unlock"
                                    ? "Enter your password to continue"
                                    : "Create a strong password to encrypt your wallets"}
                            </Typography>
                        </Box>

                        <Stack spacing={2.5}>
                            <TextField
                                fullWidth
                                type={showPassword ? "text" : "password"}
                                label={mode === "unlock" ? "Password" : "Create Password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError("");
                                }}
                                error={!!error}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockOutlinedIcon sx={{ color: "#64748b", fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                sx={{ color: "#64748b" }}
                                            >
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "12px",
                                        background: "rgba(255, 255, 255, 0.04)",
                                        color: "#f1f5f9",
                                        "& fieldset": { borderColor: "rgba(255, 255, 255, 0.1)" },
                                        "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                                        "&.Mui-focused fieldset": { borderColor: "#0ea5e9" },
                                        "&.Mui-error fieldset": { borderColor: "#ef4444" },
                                    },
                                    "& .MuiInputLabel-root": {
                                        color: "#64748b",
                                        "&.Mui-focused": { color: "#0ea5e9" },
                                    },
                                }}
                            />

                            {mode === "create" && (
                                <TextField
                                    fullWidth
                                    type={showPassword ? "text" : "password"}
                                    label="Confirm Password"
                                    placeholder="Re-enter your password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setError("");
                                    }}
                                    error={!!error && error.includes("match")}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CheckCircleIcon
                                                    sx={{
                                                        fontSize: 20,
                                                        color:
                                                            confirmPassword && confirmPassword === password
                                                                ? "#10b981"
                                                                : "#64748b",
                                                    }}
                                                />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "12px",
                                            background: "rgba(255, 255, 255, 0.04)",
                                            color: "#f1f5f9",
                                            "& fieldset": { borderColor: "rgba(255, 255, 255, 0.1)" },
                                            "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                                            "&.Mui-focused fieldset": { borderColor: "#0ea5e9" },
                                            "&.Mui-error fieldset": { borderColor: "#ef4444" },
                                        },
                                        "& .MuiInputLabel-root": {
                                            color: "#64748b",
                                            "&.Mui-focused": { color: "#0ea5e9" },
                                        },
                                    }}
                                />
                            )}

                            {error && (
                                <Typography sx={{ color: "#ef4444", fontSize: "13px" }}>{error}</Typography>
                            )}

                            {mode === "create" && (
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: "10px",
                                        background: "rgba(245, 158, 11, 0.1)",
                                        border: "1px solid rgba(245, 158, 11, 0.2)",
                                    }}
                                >
                                    <Typography sx={{ fontSize: "13px", color: "#f59e0b" }}>
                                        This password encrypts your wallets locally. If you forget it, you&apos;ll need to re-import your wallets using your seed phrases.
                                    </Typography>
                                </Box>
                            )}

                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleNext}
                                disabled={!password || (mode === "create" && !confirmPassword)}
                                sx={{
                                    textTransform: "none",
                                    py: 1.5,
                                    borderRadius: "12px",
                                    fontWeight: 700,
                                    fontSize: "15px",
                                    mt: 1,
                                    background: "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
                                    boxShadow: "0 8px 24px rgba(14, 165, 233, 0.35)",
                                    "&:hover": {
                                        background: "linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)",
                                    },
                                    "&:disabled": {
                                        background: "rgba(255, 255, 255, 0.1)",
                                        color: "rgba(255, 255, 255, 0.4)",
                                    },
                                }}
                            >
                                {mode === "unlock" ? "Unlock Wallet" : "Create Password"}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
