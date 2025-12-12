"use client";

import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Grid,
    Stack,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ShieldIcon from "@mui/icons-material/Shield";
import SpeedIcon from "@mui/icons-material/Speed";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupsIcon from "@mui/icons-material/Groups";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import LockIcon from "@mui/icons-material/Lock";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Link from "next/link";
import { BaseIcon } from "@/app/components/atoms/BaseIcon";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import PolygonIcon from "@/app/components/atoms/PolygonIcon";
import { UnichainIcon } from "@/app/components/atoms/UnichainIcon";
import { AvalancheIcon } from "@/app/components/atoms/AvalancheIcon";

const features = [
    {
        title: "Multi-chain sin fricción",
        desc: "Gestiona direcciones, tokens y balances en 6+ chains desde un solo panel unificado.",
        icon: <RocketLaunchIcon />,
        color: "#7852FF",
    },
    {
        title: "Cross-chain transfers",
        desc: "Envía USDC entre chains usando CCTP de Circle con fees mínimas y sin bridges tradicionales.",
        icon: <CompareArrowsIcon />,
        color: "#FF007A",
    },
    {
        title: "Onboarding instantáneo",
        desc: "Genera nuevas wallets o importa tu seed en segundos. También soporta addresses watch-only.",
        icon: <SpeedIcon />,
        color: "#3CD2FF",
    },
    {
        title: "Optimización de rutas",
        desc: "Sistema inteligente que encuentra la mejor ruta para tus transfers considerando balances y fees.",
        icon: <AutoGraphIcon />,
        color: "#FFD700",
    },
    {
        title: "Seguridad máxima",
        desc: "Cifrado AES-256 local de seeds, sin exponer llaves. Tus fondos siempre bajo tu control.",
        icon: <ShieldIcon />,
        color: "#00DC8C",
    },
    {
        title: "Facilitador gasless",
        desc: "Transfers gasless usando tu propio facilitador. El usuario solo firma, el facilitador ejecuta.",
        icon: <AttachMoneyIcon />,
        color: "#FF0420",
    },
];

const chains = [
    { name: "Base", icon: <BaseIcon />, color: "#0052FF" },
    { name: "Arbitrum", icon: <ArbIcon />, color: "#28A0F0" },
    { name: "Optimism", icon: <OPIcon />, color: "#FF0420" },
    { name: "Polygon", icon: <PolygonIcon />, color: "#8247E5" },
    { name: "Unichain", icon: <UnichainIcon />, color: "#FF007A" },
    { name: "Avalanche", icon: <AvalancheIcon />, color: "#E84142" },
];

const mainFeatures = [
    {
        title: "Gestión unificada de wallets",
        desc: "Visualiza todos tus balances en un solo lugar. Cada wallet muestra su valor total en USD y los balances individuales por chain. Copia addresses, genera QR codes y accede a exploradores con un click.",
        icon: <AccountBalanceWalletIcon />,
        color: "#7852FF",
    },
    {
        title: "Envíos optimizados automáticos",
        desc: "Nuestro algoritmo analiza tus balances en múltiples wallets y chains para encontrar la ruta más eficiente. Si necesitas enviar más de lo que tienes en una sola wallet, el sistema combina fondos automáticamente.",
        icon: <AutoGraphIcon />,
        color: "#00DC8C",
    },
    {
        title: "CCTP de Circle integrado",
        desc: "Transfiere USDC nativamente entre chains sin bridges de terceros. Usando CCTP (Cross-Chain Transfer Protocol), tus fondos viajan de forma segura y con fees mínimas del 0.01%.",
        icon: <SwapHorizIcon />,
        color: "#3CD2FF",
    },
    {
        title: "Recepción simplificada",
        desc: "Genera QR codes instantáneamente para cualquier wallet y chain. Comparte tu address de forma segura y recibe fondos sin complicaciones. Todo con visualización clara de la chain seleccionada.",
        icon: <QrCode2Icon />,
        color: "#FF007A",
    },
];

const useCases = [
    {
        title: "Para traders activos",
        desc: "Gestiona tu portfolio multi-chain desde un solo lugar. Ve tus balances totales, mueve fondos entre chains rápidamente y optimiza tus posiciones.",
        emoji: "📈",
    },
    {
        title: "Para equipos y DAOs",
        desc: "Administra wallets de tesorería en múltiples chains. Visualiza fondos consolidados y ejecuta pagos con aprobaciones claras y trazables.",
        emoji: "🏛️",
    },
    {
        title: "Para desarrolladores",
        desc: "Testea aplicaciones multi-chain sin saltar entre wallets y exploradores. Genera wallets de prueba instantáneamente y gestiona seeds de forma segura.",
        emoji: "👨‍💻",
    },
    {
        title: "Para usuarios nuevos",
        desc: "Empieza en cripto sin complicaciones. Interfaz clara que explica cada paso, sin términos técnicos confusos. Seguridad por defecto.",
        emoji: "🌱",
    },
];

const comparison = [
    {
        feature: "Wallets multi-chain",
        us: true,
        others: "Limitado",
    },
    {
        feature: "Optimización de rutas",
        us: true,
        others: false,
    },
    {
        feature: "CCTP nativo",
        us: true,
        others: "Requiere bridges",
    },
    {
        feature: "Facilitador gasless",
        us: true,
        others: false,
    },
    {
        feature: "Open source",
        us: true,
        others: "Varía",
    },
    {
        feature: "Sin fees ocultas",
        us: true,
        others: "Comisiones altas",
    },
];

const faqs = [
    {
        q: "¿Qué chains soporta la plataforma?",
        a: "Actualmente soportamos 6 chains: Base, Arbitrum, Optimism, Polygon, Unichain y Avalanche. Todas integradas con balances en tiempo real y transfers USDC nativos.",
    },
    {
        q: "¿Cómo funciona el sistema de optimización de rutas?",
        a: "Cuando envías fondos, nuestro algoritmo analiza tus balances en todas tus wallets y chains. Si no tienes suficiente en una sola wallet, combina automáticamente fondos de múltiples fuentes para completar el envío con las menores fees posibles.",
    },
    {
        q: "¿Es seguro guardar mi seed phrase aquí?",
        a: "Tu seed nunca sale de tu dispositivo. Usamos cifrado AES-256 con tu contraseña como llave. Los seeds cifrados se guardan en localStorage del navegador. También puedes usar wallets watch-only sin ingresar ninguna clave privada.",
    },
    {
        q: "¿Qué es CCTP y por qué es mejor que un bridge tradicional?",
        a: "CCTP (Cross-Chain Transfer Protocol) de Circle permite quemar USDC en una chain y mintear nativamente en otra, sin pasar por bridges de terceros. Es más seguro, más rápido y con fees mínimas (0.01%).",
    },
    {
        q: "¿Cobra comisiones la plataforma?",
        a: "Solo cobramos el costo del gas y una pequeña comisión del 0.01% en transfers cross-chain para cubrir costos del facilitador. No hay fees ocultas ni sorpresas.",
    },
    {
        q: "¿Puedo usar la plataforma en mobile?",
        a: "Sí, la plataforma está completamente optimizada para mobile. Todos los componentes son responsive y la interfaz se adapta perfectamente a pantallas pequeñas.",
    },
];

export default function Home() {
    return (
        <Box sx={{ backgroundColor: "#ffffff", color: "#000000", minHeight: "100vh" }}>
            <Hero />
            <Stats />
            <Chains />
            <Features />
            <MainFeatures />
            <UseCases />
            <Comparison />
            <FAQ />
            <CTA />
            <Footer />
        </Box>
    );
}

function Hero() {
    return (
        <Box
            component="section"
            sx={{
                background: "#ffffff",
                borderBottom: "3px solid #000000",
                position: "relative",
                overflow: "hidden",
                px: { xs: 2, md: 4 },
                py: { xs: 6, md: 10 },
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4} alignItems="center">
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Stack spacing={3}>
                            <Chip
                                label="🚀 Multichain Wallet"
                                sx={{
                                    alignSelf: "flex-start",
                                    background: "#7852FF",
                                    color: "#ffffff",
                                    fontWeight: 800,
                                    border: "2px solid #000000",
                                    fontSize: 13,
                                    height: 32,
                                }}
                            />
                            <Typography
                                sx={{
                                    fontSize: { xs: 36, md: 56 },
                                    fontWeight: 900,
                                    lineHeight: 1.1,
                                    color: "#000000",
                                }}
                            >
                                Tu hub multi-chain definitivo
                            </Typography>
                            <Typography sx={{ color: "#666666", fontWeight: 600, fontSize: 18, maxWidth: 620, lineHeight: 1.7 }}>
                                Gestiona todas tus wallets, envía USDC entre chains sin bridges, optimiza rutas automáticamente y mantén todo seguro con cifrado local.
                            </Typography>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
                                <Button
                                    component={Link}
                                    href="/dashboard"
                                    variant="contained"
                                    sx={{
                                        textTransform: "none",
                                        px: 4,
                                        py: 1.8,
                                        borderRadius: 3,
                                        fontWeight: 900,
                                        fontSize: 16,
                                        background: "#7852FF",
                                        color: "#ffffff",
                                        border: "3px solid #000000",
                                        boxShadow: "6px 6px 0px #000000",
                                        transition: "all 0.2s",
                                        "&:hover": {
                                            background: "#6342E6",
                                            transform: "translate(2px, 2px)",
                                            boxShadow: "4px 4px 0px #000000",
                                        },
                                    }}
                                >
                                    Empezar gratis →
                                </Button>
                                <Button
                                    component={Link}
                                    href="#features"
                                    variant="outlined"
                                    sx={{
                                        textTransform: "none",
                                        px: 4,
                                        py: 1.8,
                                        borderRadius: 3,
                                        fontWeight: 900,
                                        fontSize: 16,
                                        color: "#000000",
                                        background: "#ffffff",
                                        border: "3px solid #000000",
                                        boxShadow: "6px 6px 0px #000000",
                                        transition: "all 0.2s",
                                        "&:hover": {
                                            background: "#f5f5f5",
                                            transform: "translate(2px, 2px)",
                                            boxShadow: "4px 4px 0px #000000",
                                        },
                                    }}
                                >
                                    Ver características
                                </Button>
                            </Stack>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ pt: 2 }}>
                                <Box>
                                    <Typography fontWeight={900} color="#7852FF" fontSize={20}>
                                        6+ Chains
                                    </Typography>
                                    <Typography variant="body2" color="#666666" fontWeight={600}>
                                        Todas tus redes favoritas
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography fontWeight={900} color="#00DC8C" fontSize={20}>
                                        Fees 0.01%
                                    </Typography>
                                    <Typography variant="body2" color="#666666" fontWeight={600}>
                                        Las más bajas del mercado
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography fontWeight={900} color="#3CD2FF" fontSize={20}>
                                        100% Seguro
                                    </Typography>
                                    <Typography variant="body2" color="#666666" fontWeight={600}>
                                        Cifrado local AES-256
                                    </Typography>
                                </Box>
                            </Stack>
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card
                            sx={{
                                background: "#f5f5f5",
                                border: "3px solid #000000",
                                borderRadius: 4,
                                boxShadow: "8px 8px 0px #000000",
                                p: 3,
                            }}
                        >
                            <Typography fontWeight={900} sx={{ color: "#000000", mb: 2, fontSize: 18 }}>
                                ✨ Lo que puedes hacer
                            </Typography>
                            <Stack spacing={2}>
                                {[
                                    "Ver balances en 6+ chains unificados",
                                    "Enviar USDC cross-chain con CCTP",
                                    "Optimizar rutas automáticamente",
                                    "Generar wallets con un click",
                                    "QR codes para recibir fondos",
                                    "Cifrado local de seeds",
                                ].map((item) => (
                                    <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                                        <CheckCircleIcon sx={{ color: "#00DC8C", fontSize: 28 }} />
                                        <Typography fontWeight={700} color="#000000">
                                            {item}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>
                            <Box
                                sx={{
                                    mt: 3,
                                    borderRadius: 3,
                                    background: "#7852FF",
                                    border: "3px solid #000000",
                                    p: 3,
                                    color: "#ffffff",
                                    textAlign: "center",
                                }}
                            >
                                <Typography fontWeight={900} sx={{ fontSize: 24, lineHeight: 1.3 }}>
                                    Empieza en menos de 30 segundos
                                </Typography>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

function Stats() {
    const stats = [
        { value: "6+", label: "Chains soportadas", color: "#7852FF" },
        { value: "0.01%", label: "Fee por transfer", color: "#00DC8C" },
        { value: "< 30s", label: "Setup inicial", color: "#3CD2FF" },
        { value: "100%", label: "Open source", color: "#FF007A" },
    ];

    return (
        <Box sx={{ py: { xs: 4, md: 6 }, background: "#f5f5f5", borderBottom: "3px solid #000000" }}>
            <Container maxWidth="lg">
                <Grid container spacing={3}>
                    {stats.map((stat) => (
                        <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
                            <Box
                                sx={{
                                    textAlign: "center",
                                    p: 3,
                                    background: "#ffffff",
                                    border: "3px solid #000000",
                                    borderRadius: 3,
                                    boxShadow: "4px 4px 0px #000000",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: { xs: 32, md: 48 },
                                        fontWeight: 900,
                                        color: stat.color,
                                        lineHeight: 1,
                                    }}
                                >
                                    {stat.value}
                                </Typography>
                                <Typography
                                    sx={{
                                        mt: 1,
                                        fontSize: { xs: 13, md: 15 },
                                        fontWeight: 700,
                                        color: "#000000",
                                    }}
                                >
                                    {stat.label}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}

function Chains() {
    return (
        <Box sx={{ py: { xs: 6, md: 8 } }}>
            <Container maxWidth="lg">
                <Box sx={{ textAlign: "center", mb: 5 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: "#666666",
                            textTransform: "uppercase",
                            letterSpacing: 1.5,
                            fontWeight: 800,
                            fontSize: 12,
                            mb: 1,
                        }}
                    >
                        Chains soportadas
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: { xs: 26, md: 36 },
                            fontWeight: 900,
                            color: "#000000",
                        }}
                    >
                        Todas tus redes favoritas en un solo lugar
                    </Typography>
                </Box>
                <Grid container spacing={2} justifyContent="center">
                    {chains.map((chain) => (
                        <Grid size={{ xs: 6, sm: 4, md: 2 }} key={chain.name}>
                            <Box
                                sx={{
                                    p: 3,
                                    background: "#ffffff",
                                    border: "3px solid #000000",
                                    borderRadius: 3,
                                    boxShadow: "4px 4px 0px #000000",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 1.5,
                                    transition: "all 0.2s",
                                    "&:hover": {
                                        transform: "translate(2px, 2px)",
                                        boxShadow: "2px 2px 0px #000000",
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        "& svg": {
                                            width: "100%",
                                            height: "100%",
                                        },
                                    }}
                                >
                                    {chain.icon}
                                </Box>
                                <Typography fontWeight={800} fontSize={14} color="#000000">
                                    {chain.name}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}

function Features() {
    return (
        <Box id="features" sx={{ py: { xs: 6, md: 10 }, background: "#f5f5f5", borderTop: "3px solid #000000" }}>
            <Container maxWidth="lg">
                <SectionTitle label="Características principales" title="Todo lo que necesitas para gestionar tus fondos" />
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {features.map((f) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={f.title}>
                            <Card
                                sx={{
                                    height: "100%",
                                    background: "#ffffff",
                                    border: "3px solid #000000",
                                    borderRadius: 4,
                                    boxShadow: "6px 6px 0px #000000",
                                    transition: "all 0.2s",
                                    "&:hover": {
                                        transform: "translate(2px, 2px)",
                                        boxShadow: "4px 4px 0px #000000",
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 3,
                                            background: f.color,
                                            border: "3px solid #000000",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#ffffff",
                                            mb: 2,
                                        }}
                                    >
                                        {f.icon}
                                    </Box>
                                    <Typography fontWeight={800} sx={{ mb: 1.5, color: "#000000", fontSize: 18 }}>
                                        {f.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#666666", fontWeight: 600, lineHeight: 1.6 }}>
                                        {f.desc}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}

function MainFeatures() {
    return (
        <Box sx={{ py: { xs: 6, md: 10 } }}>
            <Container maxWidth="lg">
                <SectionTitle label="Profundiza más" title="Características que marcan la diferencia" />
                <Stack spacing={4} sx={{ mt: 4 }}>
                    {mainFeatures.map((feature, idx) => (
                        <Card
                            key={feature.title}
                            sx={{
                                background: "#ffffff",
                                border: "3px solid #000000",
                                borderRadius: 4,
                                boxShadow: "6px 6px 0px #000000",
                                overflow: "hidden",
                            }}
                        >
                            <Grid container>
                                <Grid size={{ xs: 12, md: 2 }}>
                                    <Box
                                        sx={{
                                            height: "100%",
                                            background: feature.color,
                                            border: { xs: "none", md: "none" },
                                            borderRight: { xs: "none", md: "3px solid #000000" },
                                            borderBottom: { xs: "3px solid #000000", md: "none" },
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            p: 3,
                                        }}
                                    >
                                        <Box sx={{ color: "#ffffff", "& svg": { fontSize: 48 } }}>{feature.icon}</Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 10 }}>
                                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                        <Typography fontWeight={900} fontSize={22} color="#000000" mb={1.5}>
                                            {feature.title}
                                        </Typography>
                                        <Typography color="#666666" fontWeight={600} lineHeight={1.7} fontSize={16}>
                                            {feature.desc}
                                        </Typography>
                                    </CardContent>
                                </Grid>
                            </Grid>
                        </Card>
                    ))}
                </Stack>
            </Container>
        </Box>
    );
}

function UseCases() {
    return (
        <Box sx={{ py: { xs: 6, md: 10 }, background: "#f5f5f5", borderTop: "3px solid #000000" }}>
            <Container maxWidth="lg">
                <SectionTitle label="Casos de uso" title="Diseñado para todos los usuarios cripto" />
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {useCases.map((useCase) => (
                        <Grid size={{ xs: 12, md: 6 }} key={useCase.title}>
                            <Card
                                sx={{
                                    height: "100%",
                                    background: "#ffffff",
                                    border: "3px solid #000000",
                                    borderRadius: 4,
                                    boxShadow: "6px 6px 0px #000000",
                                    transition: "all 0.2s",
                                    "&:hover": {
                                        transform: "translate(2px, 2px)",
                                        boxShadow: "4px 4px 0px #000000",
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Typography fontSize={48} mb={1}>
                                        {useCase.emoji}
                                    </Typography>
                                    <Typography fontWeight={900} fontSize={20} color="#000000" mb={1.5}>
                                        {useCase.title}
                                    </Typography>
                                    <Typography color="#666666" fontWeight={600} lineHeight={1.6} fontSize={15}>
                                        {useCase.desc}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}

function Comparison() {
    return (
        <Box sx={{ py: { xs: 6, md: 10 } }}>
            <Container maxWidth="md">
                <SectionTitle label="Comparación" title="Por qué elegirnos sobre otras opciones" />
                <Card
                    sx={{
                        mt: 4,
                        background: "#ffffff",
                        border: "3px solid #000000",
                        borderRadius: 4,
                        boxShadow: "6px 6px 0px #000000",
                        overflow: "hidden",
                    }}
                >
                    <Box sx={{ overflowX: "auto" }}>
                        <Box sx={{ minWidth: 500 }}>
                            {/* Header */}
                            <Grid
                                container
                                sx={{
                                    background: "#000000",
                                    color: "#ffffff",
                                    p: 2,
                                }}
                            >
                                <Grid size={6}>
                                    <Typography fontWeight={900} fontSize={16}>
                                        Característica
                                    </Typography>
                                </Grid>
                                <Grid size={3} sx={{ textAlign: "center" }}>
                                    <Typography fontWeight={900} fontSize={16}>
                                        MultiChain Wallet
                                    </Typography>
                                </Grid>
                                <Grid size={3} sx={{ textAlign: "center" }}>
                                    <Typography fontWeight={900} fontSize={16}>
                                        Otros
                                    </Typography>
                                </Grid>
                            </Grid>

                            {/* Rows */}
                            {comparison.map((item, idx) => (
                                <Grid
                                    container
                                    key={item.feature}
                                    sx={{
                                        p: 2,
                                        borderBottom: idx < comparison.length - 1 ? "2px solid #000000" : "none",
                                        "&:hover": {
                                            background: "#f5f5f5",
                                        },
                                    }}
                                >
                                    <Grid size={6}>
                                        <Typography fontWeight={700} color="#000000">
                                            {item.feature}
                                        </Typography>
                                    </Grid>
                                    <Grid size={3} sx={{ textAlign: "center" }}>
                                        {item.us === true ? (
                                            <CheckCircleIcon sx={{ color: "#00DC8C", fontSize: 28 }} />
                                        ) : (
                                            <Typography fontWeight={700} color="#000000">
                                                {item.us}
                                            </Typography>
                                        )}
                                    </Grid>
                                    <Grid size={3} sx={{ textAlign: "center" }}>
                                        {item.others === true ? (
                                            <CheckCircleIcon sx={{ color: "#00DC8C", fontSize: 28 }} />
                                        ) : item.others === false ? (
                                            <Typography fontSize={28}>❌</Typography>
                                        ) : (
                                            <Typography fontWeight={600} color="#666666" fontSize={14}>
                                                {item.others}
                                            </Typography>
                                        )}
                                    </Grid>
                                </Grid>
                            ))}
                        </Box>
                    </Box>
                </Card>
            </Container>
        </Box>
    );
}

function FAQ() {
    return (
        <Box sx={{ py: { xs: 6, md: 10 }, background: "#f5f5f5", borderTop: "3px solid #000000" }}>
            <Container maxWidth="md">
                <SectionTitle label="Preguntas frecuentes" title="Todo lo que necesitas saber" />
                <Stack spacing={2} sx={{ mt: 4 }}>
                    {faqs.map((faq) => (
                        <Accordion
                            key={faq.q}
                            sx={{
                                background: "#ffffff",
                                border: "3px solid #000000",
                                borderRadius: "12px !important",
                                boxShadow: "4px 4px 0px #000000",
                                "&:before": { display: "none" },
                                "&.Mui-expanded": {
                                    margin: "0 !important",
                                },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={{ color: "#000000" }} />}
                                sx={{
                                    "&.Mui-expanded": {
                                        borderBottom: "2px solid #000000",
                                    },
                                }}
                            >
                                <Typography fontWeight={800} fontSize={16} color="#000000">
                                    {faq.q}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, background: "#f5f5f5" }}>
                                <Typography color="#666666" fontWeight={600} lineHeight={1.7} fontSize={15}>
                                    {faq.a}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Stack>
            </Container>
        </Box>
    );
}

function CTA() {
    return (
        <Box
            component="section"
            sx={{
                background: "#000000",
                borderTop: "3px solid #000000",
            }}
        >
            <Container maxWidth="lg">
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={3}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ py: { xs: 6, md: 10 } }}
                >
                    <Stack spacing={2} flex={1}>
                        <Typography sx={{ color: "#ffffff", fontWeight: 900, fontSize: { xs: 32, md: 42 }, lineHeight: 1.2 }}>
                            Listo para tomar control de tus fondos multi-chain?
                        </Typography>
                        <Typography sx={{ color: "#cccccc", fontWeight: 600, fontSize: 18, lineHeight: 1.6 }}>
                            Únete a cientos de usuarios que ya gestionan sus wallets de forma más inteligente. Gratis, open source y sin sorpresas.
                        </Typography>
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flexShrink: 0 }}>
                        <Button
                            component={Link}
                            href="/dashboard"
                            variant="contained"
                            sx={{
                                textTransform: "none",
                                px: 5,
                                py: 2,
                                borderRadius: 3,
                                fontWeight: 900,
                                fontSize: 18,
                                background: "#00DC8C",
                                color: "#000000",
                                border: "3px solid #ffffff",
                                boxShadow: "6px 6px 0px #ffffff",
                                transition: "all 0.2s",
                                "&:hover": {
                                    background: "#00CC7C",
                                    transform: "translate(2px, 2px)",
                                    boxShadow: "4px 4px 0px #ffffff",
                                },
                            }}
                        >
                            Empezar ahora →
                        </Button>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}

function Footer() {
    return (
        <Box sx={{ background: "#000000", borderTop: "3px solid #ffffff", py: 6 }}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography fontWeight={900} fontSize={24} color="#ffffff" mb={2}>
                            MultiChain Wallet
                        </Typography>
                        <Typography color="#cccccc" fontWeight={600} fontSize={14} lineHeight={1.6}>
                            La forma más inteligente de gestionar tus fondos en múltiples blockchains. Open source, seguro y fácil de usar.
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Typography fontWeight={800} fontSize={14} color="#ffffff" mb={2} textTransform="uppercase">
                            Producto
                        </Typography>
                        <Stack spacing={1}>
                            {["Dashboard", "Características", "Chains", "Pricing"].map((item) => (
                                <Typography key={item} color="#cccccc" fontWeight={600} fontSize={14}>
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Typography fontWeight={800} fontSize={14} color="#ffffff" mb={2} textTransform="uppercase">
                            Recursos
                        </Typography>
                        <Stack spacing={1}>
                            {["Documentación", "API", "GitHub", "Blog"].map((item) => (
                                <Typography key={item} color="#cccccc" fontWeight={600} fontSize={14}>
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Typography fontWeight={800} fontSize={14} color="#ffffff" mb={2} textTransform="uppercase">
                            Compañía
                        </Typography>
                        <Stack spacing={1}>
                            {["Sobre nosotros", "Contacto", "Twitter", "Discord"].map((item) => (
                                <Typography key={item} color="#cccccc" fontWeight={600} fontSize={14}>
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Typography fontWeight={800} fontSize={14} color="#ffffff" mb={2} textTransform="uppercase">
                            Legal
                        </Typography>
                        <Stack spacing={1}>
                            {["Privacidad", "Términos", "Seguridad"].map((item) => (
                                <Typography key={item} color="#cccccc" fontWeight={600} fontSize={14}>
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Grid>
                </Grid>
                <Box sx={{ mt: 6, pt: 4, borderTop: "2px solid #333333" }}>
                    <Typography color="#cccccc" fontWeight={600} fontSize={14} textAlign="center">
                        © 2025 MultiChain Wallet. Hecho con 💜 para la comunidad cripto.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}

function SectionTitle({ label, title, compact = false }: { label: string; title: string; compact?: boolean }) {
    return (
        <Box sx={{ mb: compact ? 2 : 3, textAlign: "center" }}>
            <Typography
                variant="body2"
                sx={{
                    color: "#666666",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    fontWeight: 800,
                    fontSize: 12,
                    mb: 1,
                }}
            >
                {label}
            </Typography>
            <Typography
                sx={{
                    fontSize: { xs: 28, md: 38 },
                    fontWeight: 900,
                    color: "#000000",
                }}
            >
                {title}
            </Typography>
        </Box>
    );
}