
"use client";

import { Box, Typography, Avatar, Stack, Switch, IconButton } from "@mui/material";
import { BottomNavigation } from "../components/BottomNavigation";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import InfoIcon from '@mui/icons-material/Info';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LogoutIcon from '@mui/icons-material/Logout';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import { FlagIcon } from "./FlagIcon";
import { FAQModal } from "../components/FAQModal";
import { LogoutModal } from "../components/LogoutModal";
import { SupportModal } from "../components/SupportModal";

// Functional Imports
import { useCurrencyStore } from "@/app/store/useCurrencyStore";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { ExportWalletModal } from "@/app/dashboard/components/ExportWalletModal";
import { decryptSeed } from "@/app/utils/cripto";
import { useLanguageStore } from "@/app/store/useLanguageStore";

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

                cursor: onClick ? "pointer" : "default",
                transition: "all 0.1s",
                "&:active": onClick ? {
                    transform: "translate(2px, 2px)",
                    boxShadow: "2px 2px 0px #000000",
                } : {}
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
                        onChange={onClick} // Switch requires onChange
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

function ProfileView() {
    const router = useRouter();
    const { language } = useLanguageStore();

    // UI State



    // Backup State
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [faqOpen, setFaqOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [supportModalOpen, setSupportModalOpen] = useState(false);
    const [seedPhrase, setSeedPhrase] = useState("");

    // Stores
    const { useLocal, toggleCurrency } = useCurrencyStore();
    const { wallets, clearAll: clearWallets } = useWalletStore();
    const { currentPassword } = useWalletPasswordStore();

    // Handlers
    const handleBackup = () => {
        if (!wallets.length) return toast.error(language === "es" ? "No hay wallet para respaldar" : "No wallet to backup");
        if (!currentPassword) return toast.error(language === "es" ? "Sesión no válida, vuelve a ingresar" : "Invalid session, please login again");

        const wallet = wallets[0]; // Backup primary wallet
        const decrypted = decryptSeed(wallet.encryptedSeed, currentPassword);

        if (decrypted) {
            setSeedPhrase(decrypted);
            setExportModalOpen(true);
        } else {
            toast.error(language === "es" ? "Error al desencriptar la frase semilla" : "Error decrypting seed phrase");
        }
    };

    const handleLogout = () => {
        setLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        clearWallets();
        router.push("/");
        toast.success(language === "es" ? "Desconectado correctamente" : "Disconnected successfully");
    };

    const notImplemented = (feature: string) => {
        toast.info(language === "es" ? `La función de ${feature} estará disponible pronto.` : `The ${feature} feature will be available soon.`);
    };

    return (
        <Box>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <IconButton onClick={() => router.back()} sx={{ border: "2px solid #000", color: "#000", borderRadius: "8px" }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                    {language === "es" ? "Perfil" : "Profile"}
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


                <Box
                    onClick={handleBackup}
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
                        border: "1px solid #000",
                        transition: "transform 0.1s",
                        "&:active": { transform: "scale(0.95)" }
                    }}
                >
                    <SecurityIcon fontSize="small" />
                    {language === "es" ? "Copia de seguridad" : "Backup"}
                    <KeyboardArrowRightIcon fontSize="small" />
                </Box>
            </Box>

            {/* Settings Group */}
            <Box sx={{ mb: 4 }}>
                <ProfileOption
                    icon={<FlagIcon countryCode={useLocal ? "ar" : "us"} />}
                    label={language === "es" ? "Moneda local" : "Local Currency"}
                    value={useLocal ? "ARS" : "USD"}
                />




            </Box>

            {/* Menu Group */}
            <Box>
                <Link href="/common-people/profile/invite" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <ProfileOption
                        icon={<PersonAddIcon />}
                        label={language === "es" ? "Invitar amigos" : "Invite Friends"}
                        onClick={() => { }} // dummy for cursor style
                    />
                </Link>
                <ProfileOption
                    icon={<HelpOutlineIcon />}
                    label={language === "es" ? "Preguntas frecuentes" : "FAQ"}
                    onClick={() => setFaqOpen(true)}
                />

                <ProfileOption
                    icon={<SupportAgentIcon />}
                    label={language === "es" ? "Contactar con soporte técnico" : "Contact Support"}
                    onClick={() => setSupportModalOpen(true)}
                />
                <ProfileOption
                    icon={<LogoutIcon />}
                    label={language === "es" ? "Desconectar" : "Disconnect"}
                    onClick={handleLogout}
                />
            </Box>

            <ExportWalletModal
                open={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                data={seedPhrase}
                type="mnemonic"
            />

            <FAQModal
                open={faqOpen}
                onClose={() => setFaqOpen(false)}
            />

            <LogoutModal
                open={logoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={confirmLogout}
            />

            <SupportModal
                open={supportModalOpen}
                onClose={() => setSupportModalOpen(false)}
            />
        </Box>
    );
}

export default function CommonProfilePage() {
    return (
        <Box sx={{
            minHeight: "100vh",
            backgroundColor: "white",
            py: 4,
            pb: { xs: 12, md: 4 },
            pl: { xs: 0, md: "260px" }
        }}>
            <Box sx={{ maxWidth: 600, mx: "auto", p: 2 }}>
                <ProfileView />
            </Box>
            <BottomNavigation />
        </Box>
    );
}
