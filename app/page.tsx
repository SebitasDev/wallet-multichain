"use client";

import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Card, // ... existing imports
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
import TranslateIcon from "@mui/icons-material/Translate"; // New Import
import Link from "next/link";
import { BaseIcon } from "@/app/components/atoms/BaseIcon";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import PolygonIcon from "@/app/components/atoms/PolygonIcon";
import { UnichainIcon } from "@/app/components/atoms/UnichainIcon";
import { AvalancheIcon } from "@/app/components/atoms/AvalancheIcon";
import { WorldChainIcon } from "@/app/components/atoms/WorldChainIcon";
import { keyframes } from "@mui/material";

const marquee = keyframes`
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
`;

type Language = "es" | "en";

type LocalizedString = {
    en: string;
    es: string;
};

const translate = (value: LocalizedString, lang: Language) => (lang === "en" ? value.en : value.es);
const translateValue = (value: string | LocalizedString, lang: Language) => (typeof value === "string" ? value : translate(value, lang));

const features = [
    {
        title: { es: "Multi-chain sin fricción", en: "Frictionless multi-chain" },
        desc: { es: "Gestiona direcciones, tokens y balances en 6+ chains desde un solo panel unificado.", en: "Manage addresses, tokens, and balances on 6+ chains from one unified dashboard." },
        icon: <RocketLaunchIcon />,
        color: "#7852FF",
    },
    {
        title: { es: "Cross-chain transfers", en: "Cross-chain transfers" },
        desc: { es: "Envía USDC entre chains usando CCTP de Circle con fees mínimas y sin bridges tradicionales.", en: "Send USDC across chains using Circle's CCTP with minimal fees and no legacy bridges." },
        icon: <CompareArrowsIcon />,
        color: "#FF007A",
    },
    {
        title: { es: "Onboarding instantáneo", en: "Instant onboarding" },
        desc: { es: "Genera nuevas wallets o importa tu seed en segundos. También soporta addresses watch-only.", en: "Create new wallets or import your seed in seconds. Watch-only addresses supported too." },
        icon: <SpeedIcon />,
        color: "#3CD2FF",
    },
    {
        title: { es: "Optimización de rutas", en: "Smart route optimization" },
        desc: { es: "Sistema inteligente que encuentra la mejor ruta para tus transfers considerando balances y fees.", en: "Smart system finds the best route for your transfers, balancing holdings and fees." },
        icon: <AutoGraphIcon />,
        color: "#FFD700",
    },
    {
        title: { es: "Seguridad máxima", en: "Maximum security" },
        desc: { es: "Cifrado AES-256 local de seeds, sin exponer llaves. Tus fondos siempre bajo tu control.", en: "Local AES-256 seed encryption—keys never leave your device. Your funds stay under your control." },
        icon: <ShieldIcon />,
        color: "#00DC8C",
    },
    {
        title: { es: "Facilitador gasless", en: "Gasless facilitator" },
        desc: { es: "Transfers gasless usando tu propio facilitador. El usuario solo firma, el facilitador ejecuta.", en: "Gasless transfers using your own facilitator. Users sign, your facilitator executes." },
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
    { name: "World Chain", icon: <WorldChainIcon />, color: "#FBDA0F" },
];

const mainFeatures = [
    {
        title: { es: "Gestión unificada de wallets", en: "Unified wallet management" },
        desc: { es: "Visualiza todos tus balances en un solo lugar. Cada wallet muestra su valor total en USD y los balances individuales por chain. Copia addresses, genera QR codes y accede a exploradores con un click.", en: "See every balance in one place. Each wallet surfaces total USD value plus per-chain balances. Copy addresses, generate QR codes, and jump to explorers in one click." },
        icon: <AccountBalanceWalletIcon />,
        color: "#7852FF",
    },
    {
        title: { es: "Envíos optimizados automáticos", en: "Auto-optimized transfers" },
        desc: { es: "Nuestro algoritmo analiza tus balances en múltiples wallets y chains para encontrar la ruta más eficiente. Si necesitas enviar más de lo que tienes en una sola wallet, el sistema combina fondos automáticamente.", en: "Our algorithm scans balances across wallets and chains to find the most efficient route. If one wallet isn't enough, it automatically combines funds to complete the transfer." },
        icon: <AutoGraphIcon />,
        color: "#00DC8C",
    },
    {
        title: { es: "CCTP de Circle integrado", en: "Circle CCTP built-in" },
        desc: { es: "Transfiere USDC nativamente entre chains sin bridges de terceros. Usando CCTP (Cross-Chain Transfer Protocol), tus fondos viajan de forma segura y con fees mínimas del 0.01%.", en: "Move USDC natively across chains without third-party bridges. With CCTP, funds move securely with minimal 0.01% fees." },
        icon: <SwapHorizIcon />,
        color: "#3CD2FF",
    },
    {
        title: { es: "Recepción simplificada", en: "Streamlined receiving" },
        desc: { es: "Genera QR codes instantáneamente para cualquier wallet y chain. Comparte tu address de forma segura y recibe fondos sin complicaciones. Todo con visualización clara de la chain seleccionada.", en: "Instantly generate QR codes for any wallet and chain. Share addresses safely and receive funds without friction, always with clear chain context." },
        icon: <QrCode2Icon />,
        color: "#FF007A",
    },
];

const useCases = [
    {
        title: { es: "Para traders activos", en: "For active traders" },
        desc: { es: "Gestiona tu portfolio multi-chain desde un solo lugar. Ve tus balances totales, mueve fondos entre chains rápidamente y optimiza tus posiciones.", en: "Manage your multi-chain portfolio from one place. View totals, move funds quickly between chains, and optimize positions." },
        emoji: "📈",
    },
    {
        title: { es: "Para equipos y DAOs", en: "For teams and DAOs" },
        desc: { es: "Administra wallets de tesorería en múltiples chains. Visualiza fondos consolidados y ejecuta pagos con aprobaciones claras y trazables.", en: "Run treasury wallets across chains. See consolidated funds and execute payments with clear, traceable approvals." },
        emoji: "🏛️",
    },
    {
        title: { es: "Para desarrolladores", en: "For developers" },
        desc: { es: "Testea aplicaciones multi-chain sin saltar entre wallets y exploradores. Genera wallets de prueba instantáneamente y gestiona seeds de forma segura.", en: "Test multi-chain apps without bouncing between wallets and explorers. Spin up test wallets instantly and manage seeds securely." },
        emoji: "👨‍💻",
    },
    {
        title: { es: "Para usuarios nuevos", en: "For newcomers" },
        desc: { es: "Empieza en cripto sin complicaciones. Interfaz clara que explica cada paso, sin términos técnicos confusos. Seguridad por defecto.", en: "Start in crypto without confusion. A clear interface explains each step—no jargon, security by default." },
        emoji: "🌱",
    },
];

const comparison = [
    {
        feature: { es: "Wallets multi-chain", en: "Multi-chain wallets" },
        us: true,
        others: { es: "Limitado", en: "Limited" },
    },
    {
        feature: { es: "Optimización de rutas", en: "Route optimization" },
        us: true,
        others: false,
    },
    {
        feature: { es: "CCTP nativo", en: "Native CCTP" },
        us: true,
        others: { es: "Requiere bridges", en: "Requires bridges" },
    },
    {
        feature: { es: "Facilitador gasless", en: "Gasless facilitator" },
        us: true,
        others: false,
    },
    {
        feature: { es: "Open source", en: "Open source" },
        us: true,
        others: { es: "Varía", en: "Varies" },
    },
    {
        feature: { es: "Sin fees ocultas", en: "No hidden fees" },
        us: true,
        others: { es: "Comisiones altas", en: "High fees" },
    },
];

const faqs = [
    {
        q: { es: "¿Qué chains soporta la plataforma?", en: "Which chains does the platform support?" },
        a: { es: "Actualmente soportamos 6 chains: Base, Arbitrum, Optimism, Polygon, Unichain y Avalanche. Todas integradas con balances en tiempo real y transfers USDC nativos.", en: "We currently support 6 chains: Base, Arbitrum, Optimism, Polygon, Unichain, and Avalanche. All include real-time balances and native USDC transfers." },
    },
    {
        q: { es: "¿Cómo funciona el sistema de optimización de rutas?", en: "How does the route optimization system work?" },
        a: { es: "Cuando envías fondos, nuestro algoritmo analiza tus balances en todas tus wallets y chains. Si no tienes suficiente en una sola wallet, combina automáticamente fondos de múltiples fuentes para completar el envío con las menores fees posibles.", en: "When you send funds, our algorithm analyzes balances across all wallets and chains. If one wallet isn't enough, it automatically combines funds from multiple sources to complete the transfer with the lowest possible fees." },
    },
    {
        q: { es: "¿Es seguro guardar mi seed phrase aquí?", en: "Is it safe to store my seed phrase here?" },
        a: { es: "Tu seed nunca sale de tu dispositivo. Usamos cifrado AES-256 con tu contraseña como llave. Los seeds cifrados se guardan en localStorage del navegador. También puedes usar wallets watch-only sin ingresar ninguna clave privada.", en: "Your seed never leaves your device. We use AES-256 encryption with your password as the key. Encrypted seeds stay in browser localStorage. You can also use watch-only wallets without entering any private keys." },
    },
    {
        q: { es: "¿Qué es CCTP y por qué es mejor que un bridge tradicional?", en: "What is CCTP and why is it better than a traditional bridge?" },
        a: { es: "CCTP (Cross-Chain Transfer Protocol) de Circle permite quemar USDC en una chain y mintear nativamente en otra, sin pasar por bridges de terceros. Es más seguro, más rápido y con fees mínimas (0.01%).", en: "Circle's CCTP burns USDC on one chain and mints natively on another without third-party bridges. It's safer, faster, and keeps fees minimal (0.01%)." },
    },
    {
        q: { es: "¿Cobra comisiones la plataforma?", en: "Does the platform charge fees?" },
        a: { es: "Solo cobramos el costo del gas y una pequeña comisión del 0.01% en transfers cross-chain para cubrir costos del facilitador. No hay fees ocultas ni sorpresas.", en: "We only charge gas plus a tiny 0.01% fee on cross-chain transfers to cover the facilitator. No hidden fees or surprises." },
    },
    {
        q: { es: "¿Puedo usar la plataforma en mobile?", en: "Can I use the platform on mobile?" },
        a: { es: "Sí, la plataforma está completamente optimizada para mobile. Todos los componentes son responsive y la interfaz se adapta perfectamente a pantallas pequeñas.", en: "Yes, the platform is fully optimized for mobile. Every component is responsive and adapts smoothly to small screens." },
    },
];

const heroContent = {
    badge: { es: "🚀 Multichain Wallet", en: "🚀 Multichain Wallet" },
    title: { es: "Tu hub multi-chain definitivo", en: "Your ultimate multi-chain hub" },
    subtitle: {
        es: "Gestiona todas tus wallets, envía USDC entre chains sin bridges, optimiza rutas automáticamente y mantén todo seguro con cifrado local.",
        en: "Manage all your wallets, send USDC across chains without bridges, auto-optimize routes, and keep everything secure with local encryption.",
    },
    primaryCta: { es: "Empezar gratis →", en: "Start for free →" },
    secondaryCta: { es: "Ver características", en: "See features" },
    cardTitle: { es: "Lo que puedes hacer", en: "What you can do" },
    cardItems: [
        { es: "Ver balances en 6+ chains unificados", en: "View balances across 6+ chains in one place" },
        { es: "Enviar USDC cross-chain con CCTP", en: "Send USDC cross-chain with CCTP" },
        { es: "Optimizar rutas automáticamente", en: "Auto-optimize transfer routes" },
        { es: "Generar wallets con un click", en: "Generate wallets with one click" },
        { es: "QR codes para recibir fondos", en: "QR codes to receive funds" },
        { es: "Cifrado local de seeds", en: "Local seed encryption" },
    ],
    cardCta: { es: "Empieza en menos de 30 segundos", en: "Start in under 30 seconds" },
    highlights: [
        { title: { es: "6+ Chains", en: "6+ Chains" }, subtitle: { es: "Todas tus redes favoritas", en: "All your favorite networks" }, color: "#7852FF" },
        { title: { es: "Fees 0.01%", en: "0.01% fees" }, subtitle: { es: "Las más bajas del mercado", en: "Lowest in the market" }, color: "#00DC8C" },
        { title: { es: "100% Seguro", en: "100% Secure" }, subtitle: { es: "Cifrado local AES-256", en: "Local AES-256 encryption" }, color: "#3CD2FF" },
    ],
};

const stats = [
    { value: "6+", label: { es: "Chains soportadas", en: "Supported chains" }, color: "#7852FF" },
    { value: "0.01%", label: { es: "Fee por transfer", en: "Transfer fee" }, color: "#00DC8C" },
    { value: "< 30s", label: { es: "Setup inicial", en: "Initial setup" }, color: "#3CD2FF" },
    { value: "100%", label: { es: "100% Seguro", en: "100% Secure" }, color: "#FF007A" },
];

const sectionTitles = {
    chains: { label: { es: "Chains soportadas", en: "Supported chains" }, title: { es: "Todas tus redes favoritas en un solo lugar", en: "All your favorite networks in one place" } },
    features: { label: { es: "Características principales", en: "Core features" }, title: { es: "Todo lo que necesitas para gestionar tus fondos", en: "Everything you need to manage your funds" } },
    mainFeatures: { label: { es: "Profundiza más", en: "Go deeper" }, title: { es: "Características que marcan la diferencia", en: "Features that make the difference" } },
    useCases: { label: { es: "Casos de uso", en: "Use cases" }, title: { es: "Diseñado para todos los usuarios cripto", en: "Built for every crypto user" } },
    comparison: { label: { es: "Comparación", en: "Comparison" }, title: { es: "Por qué elegirnos sobre otras opciones", en: "Why choose us over others" } },
    faq: { label: { es: "Preguntas frecuentes", en: "Frequently asked questions" }, title: { es: "Todo lo que necesitas saber", en: "Everything you need to know" } },
};

const comparisonHeaders = {
    feature: { es: "Característica", en: "Feature" },
    us: "MultiChain Wallet",
    others: { es: "Otros", en: "Others" },
};

const ctaCopy = {
    title: { es: "¿Listo para tomar control de tus fondos multi-chain?", en: "Ready to take control of your multi-chain funds? " },
    subtitle: {
        es: "Únete a cientos de usuarios que ya gestionan sus wallets de forma más inteligente. Gratis, open source y sin sorpresas.",
        en: "Join hundreds of users already managing wallets smarter. Free, open source, and with no surprises.",
    },
    button: { es: "Empezar ahora →", en: "Get started now →" },
};

const footerCopy = {
    description: {
        es: "La forma más inteligente de gestionar tus fondos en múltiples blockchains. Open source, seguro y fácil de usar.",
        en: "The smartest way to manage funds across multiple blockchains. Open source, secure, and easy to use.",
    },
    sections: [
        {
            title: { es: "Producto", en: "Product" },
            links: [
                { es: "Dashboard", en: "Dashboard" },
                { es: "Características", en: "Features" },
                { es: "Chains", en: "Chains" },
                { es: "Pricing", en: "Pricing" },
            ],
        },
        {
            title: { es: "Recursos", en: "Resources" },
            links: [
                { es: "Documentación", en: "Docs" },
                { es: "API", en: "API" },
                { es: "GitHub", en: "GitHub" },
                { es: "Blog", en: "Blog" },
            ],
        },
        {
            title: { es: "Compañía", en: "Company" },
            links: [
                { es: "Sobre nosotros", en: "About us" },
                { es: "Contacto", en: "Contact" },
                { es: "Twitter", en: "Twitter" },
                { es: "Discord", en: "Discord" },
            ],
        },
        {
            title: { es: "Legal", en: "Legal" },
            links: [
                { es: "Privacidad", en: "Privacy" },
                { es: "Términos", en: "Terms" },
                { es: "Seguridad", en: "Security" },
            ],
        },
    ],
    copyright: {
        es: "© 2025 MultiChain Wallet. Hecho con 💜 para la comunidad cripto.",
        en: "© 2025 MultiChain Wallet. Built with 💜 for the crypto community.",
    },
};

const languageToggleLabel: LocalizedString = {
    es: "Ver en inglés",
    en: "View in Spanish",
};

export default function Home() {
    const [lang, setLang] = useState<Language>("es");

    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = window.localStorage.getItem("multichain_lang") as Language | null;
        if (saved === "en" || saved === "es") {
            setLang(saved);
        }
    }, []);

    const toggleLanguage = () =>
        setLang((current) => {
            const next = current === "es" ? "en" : "es";
            if (typeof window !== "undefined") {
                window.localStorage.setItem("multichain_lang", next);
            }
            return next;
        });

    return (
        <Box suppressHydrationWarning sx={{ backgroundColor: "#ffffff", color: "#000000", minHeight: "100vh" }}>
            <Hero lang={lang} onToggleLanguage={toggleLanguage} />
            <Stats lang={lang} />
            <Chains lang={lang} />
            <Features lang={lang} />
            <MainFeatures lang={lang} />
            <UseCases lang={lang} />
            <Comparison lang={lang} />
            <FAQ lang={lang} />
            <CTA lang={lang} />
            <Footer lang={lang} />
        </Box>
    );
}

function Hero({ lang, onToggleLanguage }: { lang: Language; onToggleLanguage: () => void }) {
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
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: { xs: 3, md: 4 } }}>
                    <Button
                        onClick={onToggleLanguage}
                        startIcon={<TranslateIcon />}
                        variant="outlined"
                        sx={{
                            textTransform: "none",
                            fontWeight: 800,
                            color: "#000000",
                            border: "2px solid #000000",
                            background: "#ffffff",
                            borderRadius: 999,
                            px: 2.5,
                            py: 1,
                            boxShadow: "4px 4px 0px #000000",
                            "&:hover": {
                                background: "#f5f5f5",
                                transform: "translate(1px, 1px)",
                                boxShadow: "3px 3px 0px #000000",
                            },
                        }}
                    >
                        {translate(languageToggleLabel, lang)}
                    </Button>
                </Box>
                <Grid container spacing={4} alignItems="center">
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Stack spacing={3}>
                            <Chip
                                label={translate(heroContent.badge, lang)}
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
                                {translate(heroContent.title, lang)}
                            </Typography>
                            <Typography sx={{ color: "#666666", fontWeight: 600, fontSize: 18, maxWidth: 620, lineHeight: 1.7 }}>
                                {translate(heroContent.subtitle, lang)}
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
                                    {translate(heroContent.primaryCta, lang)}
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
                                    {translate(heroContent.secondaryCta, lang)}
                                </Button>
                            </Stack>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ pt: 2 }}>
                                {heroContent.highlights.map((item) => (
                                    <Box key={item.title.es}>
                                        <Typography fontWeight={900} color={item.color} fontSize={20}>
                                            {translate(item.title, lang)}
                                        </Typography>
                                        <Typography variant="body2" color="#666666" fontWeight={600}>
                                            {translate(item.subtitle, lang)}
                                        </Typography>
                                    </Box>
                                ))}
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
                                ✨ {translate(heroContent.cardTitle, lang)}
                            </Typography>
                            <Stack spacing={2}>
                                {heroContent.cardItems.map((item) => (
                                    <Stack key={item.es} direction="row" spacing={1.5} alignItems="center">
                                        <CheckCircleIcon sx={{ color: "#00DC8C", fontSize: 28 }} />
                                        <Typography fontWeight={700} color="#000000">
                                            {translate(item, lang)}
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
                                    {translate(heroContent.cardCta, lang)}
                                </Typography>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

function Stats({ lang }: { lang: Language }) {
    return (
        <Box sx={{ py: { xs: 4, md: 6 }, background: "#f5f5f5", borderBottom: "3px solid #000000" }}>
            <Container maxWidth="lg">
                <Grid container spacing={3}>
                    {stats.map((stat) => (
                        <Grid size={{ xs: 6, md: 3 }} key={stat.label.es}>
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
                                    {translate(stat.label, lang)}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}

function Chains({ lang }: { lang: Language }) {
    return (
        <Box sx={{ py: { xs: 6, md: 8 }, overflow: "hidden" }}>
            <Container maxWidth="lg">
                <SectionTitle label={sectionTitles.chains.label} title={sectionTitles.chains.title} lang={lang} compact />
                <Box
                    sx={{
                        display: "flex",
                        width: "max-content",
                        gap: 3,
                        animation: `${marquee} 40s linear infinite`,
                        "&:hover": {
                            animationPlayState: "paused",
                        },
                    }}
                >
                    {[...chains, ...chains].map((chain, index) => (
                        <Box
                            key={`${chain.name}-${index}`}
                            sx={{
                                width: 200,
                                flexShrink: 0,
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
                                    transform: "translate(-2px, -2px)",
                                    boxShadow: "6px 6px 0px #000000",
                                },
                            }}
                        >
                            <Box sx={{ "& svg": { fontSize: 48, color: chain.color } }}>{chain.icon}</Box>
                            <Typography fontWeight={800} fontSize={18}>
                                {chain.name}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Container>
        </Box>
    );
}

function Features({ lang }: { lang: Language }) {
    return (
        <Box id="features" sx={{ py: { xs: 6, md: 10 }, background: "#f5f5f5", borderTop: "3px solid #000000" }}>
            <Container maxWidth="lg">
                <SectionTitle label={sectionTitles.features.label} title={sectionTitles.features.title} lang={lang} />
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {features.map((f) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={f.title.es}>
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
                                        {translate(f.title, lang)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#666666", fontWeight: 600, lineHeight: 1.6 }}>
                                        {translate(f.desc, lang)}
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

function MainFeatures({ lang }: { lang: Language }) {
    return (
        <Box sx={{ py: { xs: 6, md: 10 } }}>
            <Container maxWidth="lg">
                <SectionTitle label={sectionTitles.mainFeatures.label} title={sectionTitles.mainFeatures.title} lang={lang} />
                <Stack spacing={4} sx={{ mt: 4 }}>
                    {mainFeatures.map((feature, idx) => (
                        <Card
                            key={feature.title.es}
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
                                            {translate(feature.title, lang)}
                                        </Typography>
                                        <Typography color="#666666" fontWeight={600} lineHeight={1.7} fontSize={16}>
                                            {translate(feature.desc, lang)}
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

function UseCases({ lang }: { lang: Language }) {
    return (
        <Box sx={{ py: { xs: 6, md: 10 }, background: "#f5f5f5", borderTop: "3px solid #000000" }}>
            <Container maxWidth="lg">
                <SectionTitle label={sectionTitles.useCases.label} title={sectionTitles.useCases.title} lang={lang} />
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {useCases.map((useCase) => (
                        <Grid size={{ xs: 12, md: 6 }} key={useCase.title.es}>
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
                                        {translate(useCase.title, lang)}
                                    </Typography>
                                    <Typography color="#666666" fontWeight={600} lineHeight={1.6} fontSize={15}>
                                        {translate(useCase.desc, lang)}
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

function Comparison({ lang }: { lang: Language }) {
    return (
        <Box sx={{ py: { xs: 6, md: 10 } }}>
            <Container maxWidth="md">
                <SectionTitle label={sectionTitles.comparison.label} title={sectionTitles.comparison.title} lang={lang} />
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
                                        {translate(comparisonHeaders.feature, lang)}
                                    </Typography>
                                </Grid>
                                <Grid size={3} sx={{ textAlign: "center" }}>
                                    <Typography fontWeight={900} fontSize={16}>
                                        {comparisonHeaders.us}
                                    </Typography>
                                </Grid>
                                <Grid size={3} sx={{ textAlign: "center" }}>
                                    <Typography fontWeight={900} fontSize={16}>
                                        {translate(comparisonHeaders.others, lang)}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {/* Rows */}
                            {comparison.map((item, idx) => (
                                <Grid
                                    container
                                    key={item.feature.es}
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
                                            {translate(item.feature, lang)}
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
                                                {translateValue(item.others, lang)}
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

function FAQ({ lang }: { lang: Language }) {
    return (
        <Box sx={{ py: { xs: 6, md: 10 }, background: "#f5f5f5", borderTop: "3px solid #000000" }}>
            <Container maxWidth="md">
                <SectionTitle label={sectionTitles.faq.label} title={sectionTitles.faq.title} lang={lang} />
                <Stack spacing={2} sx={{ mt: 4 }}>
                    {faqs.map((faq) => (
                        <Accordion
                            key={faq.q.es}
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
                                    {translate(faq.q, lang)}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, background: "#f5f5f5" }}>
                                <Typography color="#666666" fontWeight={600} lineHeight={1.7} fontSize={15}>
                                    {translate(faq.a, lang)}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Stack>
            </Container>
        </Box>
    );
}

function CTA({ lang }: { lang: Language }) {
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
                            {translate(ctaCopy.title, lang)}
                        </Typography>
                        <Typography sx={{ color: "#cccccc", fontWeight: 600, fontSize: 18, lineHeight: 1.6 }}>
                            {translate(ctaCopy.subtitle, lang)}
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
                            {translate(ctaCopy.button, lang)}
                        </Button>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}

function Footer({ lang }: { lang: Language }) {
    return (
        <Box sx={{ background: "#000000", borderTop: "3px solid #ffffff", py: 6 }}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography fontWeight={900} fontSize={24} color="#ffffff" mb={2}>
                            MultiChain Wallet
                        </Typography>
                        <Typography color="#cccccc" fontWeight={600} fontSize={14} lineHeight={1.6}>
                            {translate(footerCopy.description, lang)}
                        </Typography>
                    </Grid>
                    {footerCopy.sections.map((section) => (
                        <Grid size={{ xs: 12, sm: 6, md: 2 }} key={section.title.es}>
                            <Typography fontWeight={800} fontSize={14} color="#ffffff" mb={2} textTransform="uppercase">
                                {translate(section.title, lang)}
                            </Typography>
                            <Stack spacing={1}>
                                {section.links.map((link) => (
                                    <Typography key={link.es} color="#cccccc" fontWeight={600} fontSize={14}>
                                        {translate(link, lang)}
                                    </Typography>
                                ))}
                            </Stack>
                        </Grid>
                    ))}
                </Grid>
                <Box sx={{ mt: 6, pt: 4, borderTop: "2px solid #333333" }}>
                    <Typography color="#cccccc" fontWeight={600} fontSize={14} textAlign="center">
                        {translate(footerCopy.copyright, lang)}
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}

function SectionTitle({ label, title, lang, compact = false }: { label: LocalizedString; title: LocalizedString; lang: Language; compact?: boolean }) {
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
                {translate(label, lang)}
            </Typography>
            <Typography
                sx={{
                    fontSize: { xs: 28, md: 38 },
                    fontWeight: 900,
                    color: "#000000",
                }}
            >
                {translate(title, lang)}
            </Typography>
        </Box>
    );
}