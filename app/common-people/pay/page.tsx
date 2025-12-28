"use client";

import { Box, Typography, Container, Avatar } from "@mui/material";
import { Send, Link as LinkIcon, Handshake, QrCode, AccountBalance, AccountBalanceWallet, Smartphone, CurrencyRupee, LocalTaxi } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { BottomNavigation } from "../components/BottomNavigation";
import { useLanguageStore } from "@/app/store/useLanguageStore";

import { useState } from "react";
import { PayActionModal, PayMethod } from "./components/PayActionModal";

export default function PayPage() {
    const router = useRouter();
    const { language } = useLanguageStore();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<PayMethod | null>(null);

    const handleMethodClick = (method: PayMethod) => {
        if (method.status === "active") {
            setSelectedMethod(method);
            setModalOpen(true);
        }
    };

    const paymentSections: { title: string; countries: { name: string; flag: string; methods: PayMethod[] }[] }[] = [
        {
            title: language === "es" ? "Métodos locales" : "Local methods",
            countries: [
                {
                    name: "Argentina",
                    flag: "🇦🇷",
                    methods: [
                        {
                            title: "Mercado Pago",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <Handshake sx={{ color: "white" }} />,
                            color: "#009ee3",
                            status: "coming_soon",
                            type: "mercadopago"
                        }
                    ]
                }
            ]
        },
        {
            title: language === "es" ? "Otros métodos" : "Other methods",
            countries: [
                {
                    name: "Brazil",
                    flag: "🇧🇷",
                    methods: [
                        {
                            title: "PIX",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <QrCode sx={{ color: "white" }} />,
                            color: "#32bcad",
                            status: "coming_soon",
                            type: "pix"
                        }
                    ]
                },
                {
                    name: "Colombia",
                    flag: "🇨🇴",
                    methods: [
                        {
                            title: "Movii",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <AccountBalanceWallet sx={{ color: "white" }} />,
                            color: "#ff00bf",
                            status: "coming_soon"
                        }
                    ]
                },
                {
                    name: "Ghana",
                    flag: "🇬🇭",
                    methods: [
                        {
                            title: "AirtelTigo",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <Smartphone sx={{ color: "white" }} />,
                            color: "#0033a1",
                            status: "coming_soon"
                        },
                        {
                            title: "MTN",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <Smartphone sx={{ color: "white" }} />,
                            color: "#ffcc00",
                            status: "coming_soon"
                        },
                        {
                            title: "Vodafone",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <Smartphone sx={{ color: "white" }} />,
                            color: "#e60000",
                            status: "coming_soon"
                        }
                    ]
                },
                {
                    name: "India",
                    flag: "🇮🇳",
                    methods: [
                        {
                            title: "UPI",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <CurrencyRupee sx={{ color: "white" }} />,
                            color: "#1c2b5a",
                            status: "coming_soon"
                        }
                    ]
                },
                {
                    name: "Indonesia",
                    flag: "🇮🇩",
                    methods: [
                        {
                            title: "ShopeePay",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <AccountBalanceWallet sx={{ color: "white" }} />,
                            color: "#ee4d2d",
                            status: "coming_soon"
                        },
                        {
                            title: "GoPay",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <AccountBalanceWallet sx={{ color: "white" }} />,
                            color: "#00a5cf",
                            status: "coming_soon"
                        }
                    ]
                },
                {
                    name: "Kenya",
                    flag: "🇰🇪",
                    methods: [
                        {
                            title: "Airtel Money",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <Smartphone sx={{ color: "white" }} />,
                            color: "#ff0000",
                            status: "coming_soon"
                        },
                        {
                            title: "M-Pesa",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <Smartphone sx={{ color: "white" }} />,
                            color: "#4f9234",
                            status: "coming_soon"
                        }
                    ]
                },
                {
                    name: "Malawi",
                    flag: "🇲🇼",
                    methods: [
                        {
                            title: "Airtel Money",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <Smartphone sx={{ color: "white" }} />,
                            color: "#ff0000",
                            status: "coming_soon"
                        }
                    ]
                },
                {
                    name: "Nigeria",
                    flag: "🇳🇬",
                    methods: [
                        {
                            title: "Bank Transfer",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <AccountBalance sx={{ color: "white" }} />,
                            color: "#008751",
                            status: "coming_soon",
                            type: "bank"
                        }
                    ]
                },
                {
                    name: "Philippines",
                    flag: "🇵🇭",
                    methods: [
                        {
                            title: "GCash",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <Smartphone sx={{ color: "white" }} />,
                            color: "#007bff",
                            status: "coming_soon"
                        }
                    ]
                },
                {
                    name: "Singapore",
                    flag: "🇸🇬",
                    methods: [
                        {
                            title: "GrabPay",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <LocalTaxi sx={{ color: "white" }} />,
                            color: "#00b140",
                            status: "coming_soon"
                        },
                        {
                            title: "GCash",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <Smartphone sx={{ color: "white" }} />,
                            color: "#007bff",
                            status: "coming_soon"
                        }
                    ]
                },
                {
                    name: "South Africa",
                    flag: "🇿🇦",
                    methods: [
                        {
                            title: "Bank Transfer",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <AccountBalance sx={{ color: "white" }} />,
                            color: "#6b7280",
                            status: "coming_soon"
                        }
                    ]
                },
                {
                    name: "Thailand",
                    flag: "🇹🇭",
                    methods: [
                        {
                            title: "Prompt Pay",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <QrCode sx={{ color: "white" }} />,
                            color: "#003d7c",
                            status: "coming_soon"
                        }
                    ]
                },
                {
                    name: "Zambia",
                    flag: "🇿🇲",
                    methods: [
                        {
                            title: "Airtel Money",
                            subtitle: language === "es" ? "Próximamente" : "Coming soon",
                            icon: <Smartphone sx={{ color: "white" }} />,
                            color: "#ff0000",
                            status: "coming_soon"
                        }
                    ]
                }
            ]
        }
    ];

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
                        onClick={() => handleMethodClick({
                            title: language === "es" ? "Número de teléfono" : "Phone Number",
                            status: "coming_soon",
                            type: "phone",
                            color: "#00c853"
                        })}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 2,
                            cursor: "pointer",
                            transition: "background 0.2s",
                            "&:hover": { backgroundColor: "#3a3f55" },
                            borderBottom: "1px solid #3f4357",
                            opacity: 0.7
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
                                {language === "es" ? "Próximamente" : "Coming soon"}
                            </Typography>
                        </Box>
                    </Box>

                    <Box
                        onClick={() => handleMethodClick({
                            title: language === "es" ? "Link de pago" : "Shareable Cash Link",
                            status: "coming_soon",
                            type: "link",
                            color: "#00c853"
                        })}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 2,
                            cursor: "pointer",
                            transition: "background 0.2s",
                            "&:hover": { backgroundColor: "#3a3f55" },
                            opacity: 0.7
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
                                {language === "es" ? "Próximamente" : "Coming soon"}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Render Payment Sections */}
                {paymentSections.map((section, index) => (
                    <Box key={index}>
                        <SectionDivider label={section.title} />
                        {section.countries.map((country, cIndex) => (
                            <Box key={cIndex} mb={2}>
                                <CountryHeader flag={country.flag} name={country.name} />
                                {country.methods.map((method, mIndex) => (
                                    <Box key={mIndex} sx={{ opacity: method.status === "coming_soon" ? 0.7 : 1 }}>
                                        <ActionCard
                                            icon={method.icon}
                                            title={method.title}
                                            subtitle={method.subtitle}
                                            color={method.color}
                                            onClick={() => handleMethodClick(method)}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </Box>
                ))}

            </Container>
            <BottomNavigation />
            <PayActionModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                method={selectedMethod}
            />
        </Box>
    );
}
