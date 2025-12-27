
"use client";

import { Box, Typography } from "@mui/material";
import { AccountBalanceWallet, Send, GridView, Logout, Person } from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { useLanguageStore } from "@/app/store/useLanguageStore";

export const BottomNavigation = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { language } = useLanguageStore();

    const menuItems = [
        {
            id: "wallet",
            label: "Wallet",
            icon: AccountBalanceWallet,
            path: "/common-people/dashboard",
            isActive: true, // Hardcoded for now
        },
        {
            id: "pay",
            label: language === "es" ? "Pagar" : "Pay",
            icon: Send,
            path: "/common-people/pay",
            isActive: false,
        },
        {
            id: "exit",
            label: language === "es" ? "Salir" : "Exit",
            icon: Logout,
            path: "/",
            isActive: false,
        },
    ];

    return (
        <Box
            id="common-navigation"
            sx={{
                position: "fixed",
                zIndex: 1000,
                backgroundColor: { xs: "#1f2937", md: "#ffffff" }, // Dark mobile, White desktop

                // Mobile Styles
                bottom: { xs: 0, md: "auto" },
                right: { xs: 0, md: "auto" },
                width: { xs: "100%", md: 260 },
                height: { xs: "auto", md: "100vh" },
                borderTop: { xs: "3px solid #000000", md: "none" },

                // Desktop: Sidebar
                left: 0,
                top: { xs: "auto", md: 0 },
                borderRight: { xs: "none", md: "3px solid #000000" }, // Thick border

                display: "flex",
                flexDirection: { xs: "row", md: "column" },
                justifyContent: { xs: "space-around", md: "flex-start" },
                alignItems: { xs: "center", md: "stretch" },
                py: { xs: 2, md: 0 },
            }}
        >

            {/* Content Container for Desktop */}
            <Box sx={{
                display: { xs: "none", md: "flex" },
                flexDirection: "column",
                width: "100%",
                px: 3,
                py: 4,
                gap: 2
            }}>

                {/* Desktop: Wallet Button (Main) */}
                <Box
                    id="common-wallet-btn"
                    onClick={() => router.push("/common-people/dashboard")}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 1.5,
                        borderRadius: "12px",
                        cursor: "pointer",
                        backgroundColor: "#00DC8C", // Branding Green
                        color: "black",
                        border: "2px solid #000000",
                        boxShadow: "4px 4px 0px #000000",
                        transition: "all 0.1s",
                        "&:hover": {
                            transform: "translate(-2px, -2px)",
                            boxShadow: "6px 6px 0px #000000",
                        },
                        "&:active": {
                            transform: "translate(2px, 2px)",
                            boxShadow: "0px 0px 0px #000000",
                        }
                    }}
                >
                    <AccountBalanceWallet sx={{ fontSize: 24, strokeWidth: 1 }} />
                    <Typography fontWeight={900} fontSize={16}>WALLET</Typography>
                </Box>

                {/* Categories Wrapper */}

                <Typography fontSize={14} color="black" fontWeight={900} sx={{ mb: 0.5, mt: 2, textTransform: "uppercase", letterSpacing: "1px" }}>
                    {language === "es" ? "Cuenta" : "Account"}
                </Typography>

                {[
                    { label: language === "es" ? "Perfil" : "Profile", icon: Person, path: "/common-people/profile" },
                    // { label: language === "es" ? "Tu dinero" : "Your Money", icon: AccountBalanceWallet, path: "/common-people/dashboard" }, // Removed as requested
                    { label: language === "es" ? "Actividad" : "Activity", icon: GridView, path: "/common-people/history" },
                    // { label: language === "es" ? "Tarjetas" : "Cards", icon: Send, path: "/cards" } // Removed as requested
                ].map((link) => (
                    <Box key={link.label}
                        onClick={() => router.push(link.path)}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 1,
                            cursor: "pointer",
                            color: "black",
                            borderRadius: 1,
                            border: "1px solid transparent",
                            "&:hover": {
                                backgroundColor: "#fff059", // Yellow highlight
                                border: "2px solid #000000",
                                boxShadow: "2px 2px 0px #000000",
                                transform: "translate(-1px, -1px)"
                            }
                        }}>
                        <link.icon sx={{ fontSize: 20 }} />
                        <Typography fontWeight={700} fontSize={14}>{link.label}</Typography>
                    </Box>
                ))}

                {/* Servicios Header removed as requested */}
                {/* "Cuentas y servicios" and "Cobrar" removed */}

                {/* Exposing Salir separatedly since Services section is gone */}
                <Box sx={{ mt: 2, borderTop: "2px solid #000000", pt: 2 }}>
                    {[
                        { label: language === "es" ? "Salir" : "Exit", icon: Logout, path: "/" }
                    ].map((link) => (
                        <Box key={link.label}
                            onClick={() => router.push(link.path)}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                p: 1,
                                cursor: "pointer",
                                color: "black",
                                borderRadius: 1,
                                border: "1px solid transparent",
                                "&:hover": {
                                    backgroundColor: "#ff4d4d", // Red for exit
                                    border: "2px solid #000000",
                                    boxShadow: "2px 2px 0px #000000",
                                    transform: "translate(-1px, -1px)"
                                }
                            }}>
                            <link.icon sx={{ fontSize: 20 }} />
                            <Typography fontWeight={700} fontSize={14}>{link.label}</Typography>
                        </Box>
                    ))}
                </Box>

            </Box>

            {/* MOBILE ONLY LINKS */}
            <Box sx={{ display: { xs: "contents", md: "none" } }}>
                {menuItems.map((item) => (
                    <Box
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            cursor: "pointer",
                            position: "relative",
                            minWidth: 64,
                        }}
                    >
                        {/* Mobile Active Blob */}
                        {item.isActive && (
                            <Box sx={{ position: "absolute", top: "-20%", width: 50, height: 50, backgroundColor: "#0f766e", borderRadius: "40% 60% 70% 30%", opacity: 0.5, zIndex: 0 }} />
                        )}
                        <Box sx={{ zIndex: 1, color: item.isActive ? "white" : "#9ca3af" }}>
                            <item.icon sx={{ fontSize: 28 }} />
                        </Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: item.isActive ? "white" : "#9ca3af", mt: 0.5, zIndex: 1 }}>{item.label}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
