"use client";

import { Box, Typography, Container, Avatar } from "@mui/material";
import { Send, Link as LinkIcon, Handshake, QrCode } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { useLanguageStore } from "@/app/store/useLanguageStore";

export default function PayPage() {
    const router = useRouter();
    const { language } = useLanguageStore();

    const ActionCard = ({ icon, title, subtitle, color, onClick }: any) => (
        <Box
            onClick={onClick}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                backgroundColor: "#2e3246", // Dark card bg
                borderRadius: "16px",
                cursor: "pointer",
                transition: "background 0.2s",
                "&:hover": {
                    backgroundColor: "#3a3f55",
                },
                mb: 1.5,
            }}
        >
            <Avatar sx={{ bgcolor: color, width: 40, height: 40 }}>
                {icon}
            </Avatar>
            <Box>
                <Typography sx={{ color: "white", fontWeight: 700, fontSize: 16 }}>
                    {title}
                </Typography>
                <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>
                    {subtitle}
                </Typography>
            </Box>
        </Box>
    );

    const SectionDivider = ({ label }: { label: string }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 3 }}>
            <Box sx={{ flex: 1, height: "1px", backgroundColor: "#3f4357" }} />
            <Typography sx={{ color: "#9ca3af", fontSize: 13, fontWeight: 700 }}>
                {label}
            </Typography>
            <Box sx={{ flex: 1, height: "1px", backgroundColor: "#3f4357" }} />
        </Box>
    );

    const CountryHeader = ({ flag, name }: { flag: string, name: string }) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, px: 1 }}>
            <Typography sx={{ color: "white", fontWeight: 800, fontSize: 15 }}>
                {name}
            </Typography>
            <Typography sx={{ fontSize: 18 }}>{flag}</Typography>
        </Box>
    );

    return (
        <Box sx={{
            minHeight: "100vh",
            backgroundColor: "#18181b", // Dark background
            color: "white",
            overflowY: "auto",
            pb: 12, // Space for bottom nav
            pt: 4,
            px: 2,
            pl: { xs: 2, md: "280px" } // Sidebar offset + padding
        }}>
            <Container maxWidth="sm">
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 4 }}>
                    {language === "es" ? "Pagar a" : "Pay to"}
                </Typography>

                {/* Top Section */}
                <Box sx={{ backgroundColor: "#2e3246", borderRadius: "16px", overflow: "hidden", mb: 3 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 2,
                            cursor: "pointer",
                            transition: "background 0.2s",
                            "&:hover": { backgroundColor: "#3a3f55" },
                            borderBottom: "1px solid #3f4357"
                        }}
                    >
                        <Avatar sx={{ bgcolor: "#00c853", width: 40, height: 40 }}>
                            <Send sx={{ fontSize: 20, color: "white" }} />
                        </Avatar>
                        <Box>
                            <Typography sx={{ color: "white", fontWeight: 700, fontSize: 16 }}>
                                {language === "es" ? "Número de teléfono" : "Phone Number"}
                            </Typography>
                            <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>
                                {language === "es" ? "Instantáneo y Gratis" : "Instant & Free"}
                            </Typography>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 2,
                            cursor: "pointer",
                            transition: "background 0.2s",
                            "&:hover": { backgroundColor: "#3a3f55" }
                        }}
                    >
                        <Avatar sx={{ bgcolor: "#00c853", width: 40, height: 40 }}>
                            <LinkIcon sx={{ fontSize: 20, color: "white" }} />
                        </Avatar>
                        <Box>
                            <Typography sx={{ color: "white", fontWeight: 700, fontSize: 16 }}>
                                {language === "es" ? "Link de pago" : "Shareable Cash Link"}
                            </Typography>
                            <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>
                                {language === "es" ? "Para cualquiera sin 1llet" : "To anyone not on 1llet yet"}
                            </Typography>
                        </Box>
                    </Box>


                </Box>
                <SectionDivider label={language === "es" ? "Métodos locales" : "Local methods"} />

                {/* Argentina */}
                <CountryHeader flag="🇦🇷" name="Argentina" />
                <ActionCard
                    icon={<Handshake sx={{ color: "white" }} />} // Placeholder for Mercado Pago handshake alike
                    title="Mercado Pago"
                    subtitle={language === "es" ? "Usando QR - Instantáneo y sin fees" : "Using QR - Instant & Zero fees"}
                    color="#009ee3"
                />

                <SectionDivider label={language === "es" ? "Otros métodos" : "Other methods"} />

                {/* Brazil */}
                <CountryHeader flag="🇧🇷" name="Brazil" />
                <ActionCard
                    icon={<QrCode sx={{ color: "white" }} />} // PIX symbol
                    title="PIX"
                    subtitle={language === "es" ? "Usando QR - Instantáneo" : "Using QR - Instant"}
                    color="#32bcad"
                />

                {/* Colombia */}
                <CountryHeader flag="🇨🇴" name="Colombia" />
                {/* No items shown in screenshot, leaving placeholder or empty */}
                <Box sx={{ opacity: 0.5, p: 2, border: "1px dashed #3f4357", borderRadius: 2, textAlign: "center" }}>
                    <Typography fontSize={12} color="#9ca3af">{language === "es" ? "Próximamente" : "Coming soon"}</Typography>
                </Box>

            </Container>
            <BottomNavigation />
        </Box>
    );
}
