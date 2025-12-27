
"use client";

import { Box, Typography, Avatar, Stack, Card, CardContent, Switch, IconButton, Divider } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import { useRouter } from "next/navigation";
import { useState } from "react";

const ProfileOption = ({ icon, label, value, toggle, onClick }: { icon: React.ReactNode, label: string, value?: string, toggle?: boolean, onClick?: () => void }) => {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                mb: 1.5,
                bgcolor: "#FFFFFF",
                border: "3px solid #000000",
                borderRadius: "12px",
                boxShadow: "4px 4px 0px #000000",
                cursor: "pointer",
                transition: "all 0.1s",
                "&:active": {
                    transform: "translate(2px, 2px)",
                    boxShadow: "2px 2px 0px #000000",
                }
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ color: "#000000" }}>{icon}</Box>
                <Typography sx={{ fontWeight: 700, fontSize: "16px" }}>{label}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                {value && (
                    <Typography sx={{ color: "#666", fontWeight: 600, fontSize: "14px" }}>
                        {value}
                    </Typography>
                )}

                {toggle !== undefined ? (
                    <Switch
                        checked={toggle}
                        sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#00DC8C",
                            },
                            "& .MuiSwitch-track": {
                                backgroundColor: "#000 !important",
                            }
                        }}
                    />
                ) : (
                    onClick && <KeyboardArrowRightIcon />
                )}
            </Stack>
        </Box>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const [hiddenMode, setHiddenMode] = useState(false);
    const [showEmptyStart, setShowEmptyStart] = useState(true);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "600px", margin: "0 auto" }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <IconButton onClick={() => router.back()} sx={{ border: "2px solid #000", color: "#000", borderRadius: "8px" }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                    Perfil
                </Typography>
            </Stack>

            {/* User Info */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
                <Box sx={{ position: "relative", mb: 2 }}>
                    <Avatar
                        sx={{
                            width: 100,
                            height: 100,
                            bgcolor: "#008080",
                            fontSize: "40px",
                            border: "3px solid #000000",
                            fontWeight: 700
                        }}
                    >
                        T
                    </Avatar>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Tobias Insaurralde</Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                    <Typography sx={{ color: "#666", fontWeight: 600 }}>+54 9 11 1234-5678</Typography>
                    <EditIcon sx={{ fontSize: 16, color: "#666", cursor: "pointer" }} />
                </Stack>

                <Box
                    sx={{
                        mt: 2,
                        bgcolor: "#1E3A2F",
                        color: "#fff",
                        py: 1,
                        px: 2,
                        borderRadius: "99px",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "1px solid #000"
                    }}
                >
                    <SecurityIcon fontSize="small" />
                    Copia de seguridad
                    <KeyboardArrowRightIcon fontSize="small" />
                </Box>
            </Box>

            {/* Settings Group */}
            <Box sx={{ mb: 4 }}>
                <ProfileOption
                    icon={<span style={{ fontSize: "24px" }}>🇦🇷</span>}
                    label="Moneda local"
                    value="ARS"
                />

                <ProfileOption
                    icon={<span style={{ fontWeight: 800, fontSize: "20px" }}>👁️</span>}
                    label="Modo oculto"
                    toggle={hiddenMode}
                    onClick={() => setHiddenMode(!hiddenMode)}
                />

                <ProfileOption
                    icon={<span style={{ fontWeight: 800, fontSize: "20px" }}>👜</span>}
                    label="Mostrar pockets vacíos"
                    toggle={showEmptyStart}
                    onClick={() => setShowEmptyStart(!showEmptyStart)}
                />
            </Box>

            {/* Menu Group */}
            <Box>
                <ProfileOption
                    icon={<PersonAddIcon />}
                    label="Invitar amigos"
                    onClick={() => { }}
                />
                <ProfileOption
                    icon={<HelpOutlineIcon />}
                    label="Preguntas frecuentes"
                    onClick={() => { }}
                />
                <ProfileOption
                    icon={<SupportAgentIcon />}
                    label="Contactar con soporte técnico"
                    onClick={() => { }}
                />
                <ProfileOption
                    icon={<InfoIcon />}
                    label="Acerca de"
                    onClick={() => { }}
                />
                <ProfileOption
                    icon={<LogoutIcon />}
                    label="Desconectar"
                    onClick={() => router.push("/")}
                />
            </Box>

            <Box sx={{ textAlign: "center", mt: 4, mb: 2 }}>
                <Typography sx={{ fontSize: "12px", color: "#666", fontWeight: 600 }}>
                    MiniPay se basa en CELO
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#00DC8C", fontWeight: 700, cursor: "pointer" }}>
                    Más información
                </Typography>
            </Box>
        </Box>
    );
}
