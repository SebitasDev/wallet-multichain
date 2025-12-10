"use client";

import { Box, Button, Stack, Typography, IconButton, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import DownloadIcon from "@mui/icons-material/Download";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import Link from "next/link";

type Props = {
    onAdd: () => void;
    onSend: () => void;
    onReceive: () => void;
};

export function TopBar({ onAdd, onSend, onReceive }: Props) {
    return (
        <Box
            component="header"
            sx={{
                position: "sticky",
                top: 0,
                zIndex: 100,
                width: "100%",
                backdropFilter: "blur(20px)",
                background: "rgba(10, 14, 23, 0.85)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            }}
        >
            <Box
                sx={{
                    maxWidth: 1400,
                    mx: "auto",
                    px: { xs: 2, md: 4 },
                    py: { xs: 1.5, md: 2 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: { xs: "wrap", md: "nowrap" },
                }}
            >
                {/* Logo & Brand */}
                <Link href="/" style={{ textDecoration: "none" }}>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{
                            cursor: "pointer",
                            "&:hover": {
                                "& .logo-box": {
                                    boxShadow: "0 0 24px rgba(14, 165, 233, 0.4)",
                                },
                            },
                        }}
                    >
                        <Box
                            className="logo-box"
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 8px 24px rgba(14, 165, 233, 0.3)",
                                transition: "box-shadow 0.25s ease",
                            }}
                        >
                            <AccountBalanceWalletIcon sx={{ color: "#fff", fontSize: 22 }} />
                        </Box>
                        <Box sx={{ display: { xs: "none", sm: "block" } }}>
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    fontSize: "17px",
                                    color: "#f1f5f9",
                                    letterSpacing: "-0.01em",
                                    lineHeight: 1.2,
                                }}
                            >
                                Multichain
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: "12px",
                                    color: "#64748b",
                                    fontWeight: 500,
                                }}
                            >
                                Wallet Manager
                            </Typography>
                        </Box>
                    </Stack>
                </Link>

                {/* Navigation Pills - Desktop */}
                <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{
                        display: { xs: "none", lg: "flex" },
                        background: "rgba(255, 255, 255, 0.04)",
                        borderRadius: "12px",
                        p: 0.5,
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                >
                    {[
                        { label: "Dashboard", active: true },
                        { label: "Activity", active: false },
                        { label: "Bridge", active: false },
                    ].map((item) => (
                        <Button
                            key={item.label}
                            sx={{
                                textTransform: "none",
                                px: 2.5,
                                py: 0.75,
                                borderRadius: "10px",
                                fontWeight: 600,
                                fontSize: "13px",
                                color: item.active ? "#f1f5f9" : "#64748b",
                                background: item.active
                                    ? "linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)"
                                    : "transparent",
                                border: item.active
                                    ? "1px solid rgba(14, 165, 233, 0.3)"
                                    : "1px solid transparent",
                                "&:hover": {
                                    background: item.active
                                        ? "linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)"
                                        : "rgba(255, 255, 255, 0.06)",
                                    color: "#f1f5f9",
                                },
                            }}
                        >
                            {item.label}
                        </Button>
                    ))}
                </Stack>

                {/* Action Buttons */}
                <Stack
                    direction="row"
                    spacing={{ xs: 1, sm: 1.5 }}
                    alignItems="center"
                    sx={{
                        width: { xs: "100%", md: "auto" },
                        justifyContent: { xs: "center", md: "flex-end" },
                        order: { xs: 3, md: 2 },
                    }}
                >
                    {/* Primary Actions */}
                    <Button
                        startIcon={<SendIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                        onClick={onSend}
                        sx={{
                            textTransform: "none",
                            px: { xs: 2, sm: 2.5 },
                            py: { xs: 0.875, sm: 1 },
                            borderRadius: "10px",
                            fontWeight: 700,
                            fontSize: { xs: "13px", sm: "14px" },
                            color: "#0a0e17",
                            background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
                            boxShadow: "0 4px 16px rgba(14, 165, 233, 0.35)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: "linear-gradient(135deg, #0284c7 0%, #0891b2 100%)",
                                boxShadow: "0 6px 24px rgba(14, 165, 233, 0.45)",
                                transform: "translateY(-1px)",
                            },
                            "&:active": {
                                transform: "translateY(0)",
                            },
                        }}
                    >
                        Send
                    </Button>

                    <Button
                        startIcon={<DownloadIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                        onClick={onReceive}
                        sx={{
                            textTransform: "none",
                            px: { xs: 2, sm: 2.5 },
                            py: { xs: 0.875, sm: 1 },
                            borderRadius: "10px",
                            fontWeight: 700,
                            fontSize: { xs: "13px", sm: "14px" },
                            color: "#f1f5f9",
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: "rgba(255, 255, 255, 0.12)",
                                border: "1px solid rgba(255, 255, 255, 0.18)",
                            },
                        }}
                    >
                        Receive
                    </Button>

                    <Button
                        startIcon={<AddIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                        onClick={onAdd}
                        sx={{
                            textTransform: "none",
                            px: { xs: 2, sm: 2.5 },
                            py: { xs: 0.875, sm: 1 },
                            borderRadius: "10px",
                            fontWeight: 700,
                            fontSize: { xs: "13px", sm: "14px" },
                            color: "#f1f5f9",
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: "rgba(255, 255, 255, 0.12)",
                                border: "1px solid rgba(255, 255, 255, 0.18)",
                            },
                            display: { xs: "none", sm: "inline-flex" },
                        }}
                    >
                        Add Wallet
                    </Button>

                    {/* Mobile Add Button */}
                    <IconButton
                        onClick={onAdd}
                        sx={{
                            display: { xs: "flex", sm: "none" },
                            width: 40,
                            height: 40,
                            borderRadius: "10px",
                            color: "#f1f5f9",
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            "&:hover": {
                                background: "rgba(255, 255, 255, 0.12)",
                            },
                        }}
                    >
                        <AddIcon fontSize="small" />
                    </IconButton>

                    {/* Settings */}
                    <IconButton
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "10px",
                            color: "#64748b",
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                color: "#f1f5f9",
                                background: "rgba(255, 255, 255, 0.08)",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                            },
                            display: { xs: "none", md: "flex" },
                        }}
                    >
                        <SettingsOutlinedIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Box>
        </Box>
    );
}
