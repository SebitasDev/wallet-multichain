import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ShieldIcon from "@mui/icons-material/Shield";
import SpeedIcon from "@mui/icons-material/Speed";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupsIcon from "@mui/icons-material/Groups";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import LockIcon from "@mui/icons-material/Lock";
import { BaseIcon } from "@/app/components/atoms/BaseIcon";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import PolygonIcon from "@/app/components/atoms/PolygonIcon";
import { UnichainIcon } from "@/app/components/atoms/UnichainIcon";
import { AvalancheIcon } from "@/app/components/atoms/AvalancheIcon";
import { WorldChainIcon } from "@/app/components/atoms/WorldChainIcon";

export type Language = "es" | "en";

export type LocalizedString = {
    en: string;
    es: string;
};

export const translate = (value: LocalizedString, lang: Language) => (lang === "en" ? value.en : value.es);
export const translateValue = (value: string | LocalizedString, lang: Language) => (typeof value === "string" ? value : translate(value, lang));

export const features = [
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

export const chains = [
    { name: "Base", icon: <BaseIcon />, color: "#0052FF" },
    { name: "Arbitrum", icon: <ArbIcon />, color: "#28A0F0" },
    { name: "Optimism", icon: <OPIcon />, color: "#FF0420" },
    { name: "Polygon", icon: <PolygonIcon />, color: "#8247E5" },
    { name: "Unichain", icon: <UnichainIcon />, color: "#FF007A" },
    { name: "Avalanche", icon: <AvalancheIcon />, color: "#E84142" },
    { name: "World Chain", icon: <WorldChainIcon />, color: "#FBDA0F" },
];

export const mainFeatures = [
    {
        title: { es: "Visualización unificada", en: "Unified visualization" },
        desc: { es: "Olvídate de cambiar de red. Tus balances de todas las chains se suman y muestran en una sola vista clara. Filtra por chain si lo necesitas.", en: "Forget switching networks. Your balances from all chains are aggregated and shown in one clear view. Filter by chain if needed." },
        icon: <AccountBalanceWalletIcon />,
        color: "#7852FF",
    },
    {
        title: { es: "Envíos inteligentes", en: "Smart sends" },
        desc: { es: "Elige el token y el destino. Nosotros encontramos la mejor ruta. Si tienes USDC en Polygon y quieres enviar a Base, lo hacemos posible con un click.", en: "Choose token and destination. We find the best route. If you have USDC on Polygon and want to send to Base, we make it possible with one click." },
        icon: <SwapHorizIcon />,
        color: "#00DC8C",
    },
    {
        title: { es: "Pagos QR universales", en: "Universal QR payments" },
        desc: { es: "Genera códigos QR que especifican chain, token y monto. Escanea y paga desde cualquier wallet compatible al instante.", en: "Generate QR codes specifying chain, token, and amount. Scan and pay from any compatible wallet instantly." },
        icon: <QrCode2Icon />,
        color: "#3CD2FF",
    },
    {
        title: { es: "Seguridad client-side", en: "Client-side security" },
        desc: { es: "Tus llaves privadas se cifran en tu dispositivo antes de guardarse. Nadie (ni nosotros) puede acceder a tus fondos.", en: "Your private keys are encrypted on your device before saving. No one (not even us) can access your funds." },
        icon: <LockIcon />,
        color: "#FF007A",
    },
];

export const useCases = [
    {
        title: { es: "Para traders DeFi", en: "For DeFi traders" },
        desc: { es: "Mueve liquidez entre exchanges y protocolos en diferentes chains en segundos, aprovechando arbitrajes sin perder tiempo en bridges lentos.", en: "Move liquidity between exchanges and protocols on different chains in seconds, seizing arbitrage opportunities without wasting time on slow bridges." },
        emoji: "⚡",
    },
    {
        title: { es: "Para cobros internacionales", en: "For international payments" },
        desc: { es: "Recibe pagos en USDC desde cualquier chain. Tu cliente paga en Optimism, tú recibes en Base. Sin complicaciones.", en: "Receive USDC payments from any chain. Your client pays on Optimism, you receive on Base. No hassle." },
        emoji: "🌍",
    },
    {
        title: { es: "Para equipos y DAOs", en: "For teams and DAOs" },
        desc: { es: "Gestiona tesorería en múltiples redes. Visualiza el total de activos y ejecuta pagos de nómina o proveedores en la chain que prefieras.", en: "Manage treasury across multiple networks. View total assets and execute payroll or vendor payments on the chain of your choice." },
        emoji: "🏢",
    },
    {
        title: { es: "Para usuarios nuevos", en: "For newcomers" },
        desc: { es: "Empieza en cripto sin complicaciones. Interfaz clara que explica cada paso, sin términos técnicos confusos. Seguridad por defecto.", en: "Start in crypto without confusion. A clear interface explains each step—no jargon, security by default." },
        emoji: "🌱",
    },
];

export const comparison = [
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

export const faqs = [
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

export const heroContent = {
    badge: { es: "🚀 1llet", en: "🚀 1llet" },
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

export const stats = [
    { value: "6+", label: { es: "Chains soportadas", en: "Supported chains" }, color: "#7852FF" },
    { value: "0.01%", label: { es: "Fee por transfer", en: "Transfer fee" }, color: "#00DC8C" },
    { value: "< 30s", label: { es: "Setup inicial", en: "Initial setup" }, color: "#3CD2FF" },
    { value: "100%", label: { es: "100% Seguro", en: "100% Secure" }, color: "#FF007A" },
];

export const sectionTitles = {
    features: {
        label: { es: "Características principales", en: "Main features" },
        title: { es: "Todo lo que necesitas para gestionar tus fondos", en: "Everything you need to manage your funds" },
    },
    mainFeatures: {
        label: { es: "Profundiza más", en: "Dive deeper" },
        title: { es: "Características que marcan la diferencia", en: "Features that make a difference" },
    },
    useCases: {
        label: { es: "Casos de uso", en: "Use cases" },
        title: { es: "Diseñado para todos los usuarios cripto", en: "Designed for all crypto users" },
    },
    comparison: {
        label: { es: "Comparación", en: "Comparison" },
        title: { es: "Por qué elegirnos sobre otras opciones", en: "Why choose us over other options" },
    },
    chains: {
        label: { es: "Ecosistema", en: "Ecosystem" },
        title: { es: "Soportamos las mejores L2s", en: "We support the best L2s" },
    },
    faq: {
        label: { es: "Preguntas frecuentes", en: "FAQ" },
        title: { es: "Todo lo que necesitas saber", en: "Everything you need to know" },
    },
};

export const comparisonHeaders = {
    feature: { es: "Característica", en: "Feature" },
    us: "1llet",
    others: { es: "Otros", en: "Others" },
};

export const ctaCopy = {
    title: { es: "Listo para tomar control de tus fondos multi-chain?", en: "Ready to take control of your multi-chain funds?" },
    subtitle: {
        es: "Únete a cientos de usuarios que ya gestionan sus wallets de forma más inteligente. Gratis, open source y sin sorpresas.",
        en: "Join hundreds of users who manage their wallets smarter. Free, open source, and no surprises.",
    },
    button: { es: "Empezar ahora →", en: "Start now →" },
};

export const footerCopy = {
    description: {
        es: "La forma más inteligente de gestionar tus fondos en múltiples blockchains. Open source, seguro y fácil de usar.",
        en: "The smartest way to manage your funds across multiple blockchains. Open source, secure, and easy to use.",
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
                { es: "Documentación", en: "Documentation" },
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
        es: "© 2025 1llet. Hecho con 💜 para criptobros.",
        en: "© 2025 1llet. Built with 💜 for cryptobros.",
    },
};

export const languageToggleLabel: LocalizedString = {
    es: "ES",
    en: "EN",
};
