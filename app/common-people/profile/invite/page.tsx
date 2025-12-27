
"use client";

import { Box, Typography, Button, IconButton, Stack } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useLanguageStore } from "@/app/store/useLanguageStore";

const StepItem = ({ number, title, description, isLast = false }: { number: number, title: string, description: string, isLast?: boolean }) => (
    <Box sx={{ display: "flex", gap: 2, position: "relative" }}>
        {/* Line connector */}
        {!isLast && (
            <Box
                sx={{
                    position: "absolute",
                    left: 15,
                    top: 40,
                    bottom: -16,
                    width: "2px",
                    bgcolor: "#1E3A2F"
                }}
            />
        )}

        <Box
            sx={{
                width: 32,
                height: 32,
                minWidth: 32,
                borderRadius: "50%",
                bgcolor: "#1E3A2F",
                color: "#2dd4bf",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
                zIndex: 1
            }}
        >
            {number}
        </Box>
        <Box sx={{ pb: 3 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "16px", mb: 0.5 }}>{title}</Typography>
            <Typography sx={{ color: "#666", fontSize: "14px", lineHeight: 1.4, fontWeight: 500 }}>
                {description}
            </Typography>
        </Box>
    </Box>
);

export default function InvitePage() {
    const router = useRouter();
    const { language } = useLanguageStore();
    const inviteLink = "https://link.1llet.xyz/invite/tobias-123";

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        toast.success(language === "es" ? "Enlace copiado al portapapeles" : "Link copied to clipboard");
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: language === "es" ? 'Únete a 1llet' : 'Join 1llet',
                    text: language === "es" ? '¡Únete a 1llet y gana recompensas!' : 'Join 1llet and earn rewards!',
                    url: inviteLink,
                });
            } catch (error) {
                console.error('Error sharing', error);
            }
        } else {
            handleCopy();
        }
    };

    return (
        <Box sx={{
            minHeight: "100vh",
            bgcolor: "white",
            p: 3,
            pb: 12, // Space for bottom nav if needed, but this page might be standalone like profile
            maxWidth: 600,
            mx: "auto"
        }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <IconButton onClick={() => router.back()} sx={{ border: "2px solid #000", color: "#000", borderRadius: "8px" }}>
                    <ArrowBackIcon />
                </IconButton>
            </Stack>

            <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, fontSize: "2rem" }}>
                {language === "es" ? "Invitar amigos" : "Invite Friends"}
            </Typography>

            <Typography sx={{ fontSize: "16px", color: "white", bgcolor: "#18181b", p: 2, borderRadius: "12px", border: "2px solid #000", boxShadow: "4px 4px 0 #000", mb: 4, fontWeight: 500 }}>
                {language === "es"
                    ? "Trae a tus amigos a 1llet y obtén recompensas. Pueden aplicarse restricciones, consulta a continuación."
                    : "Bring your friends to 1llet and earn rewards. Restrictions may apply, see below."}
            </Typography>

            <Typography sx={{ fontWeight: 800, mb: 1.5, fontSize: "16px" }}>
                {language === "es" ? "Envíales tu enlace de invitación" : "Send them your invite link"}
            </Typography>

            {/* Link Box */}
            <Box
                onClick={handleCopy}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "#e4e4e7",
                    p: 2,
                    borderRadius: "12px",
                    cursor: "pointer",
                    mb: 3,
                    border: "2px solid transparent",
                    "&:hover": { border: "2px solid #000" }
                }}
            >
                <Typography sx={{ color: "#000", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", mr: 2 }}>
                    {inviteLink}
                </Typography>
                <ContentCopyIcon sx={{ color: "#52525b" }} />
            </Box>

            {/* Share Button */}
            <Button
                onClick={handleShare}
                fullWidth
                startIcon={<ShareIcon />}
                sx={{
                    bgcolor: "white",
                    color: "black",
                    py: 2,
                    borderRadius: "16px",
                    border: "3px solid #000",
                    boxShadow: "6px 6px 0 #000",
                    fontWeight: 800,
                    textTransform: "none",
                    fontSize: "16px",
                    mb: 5,
                    "&:hover": {
                        transform: "translate(-2px, -2px)",
                        boxShadow: "8px 8px 0 #000",
                        bgcolor: "#f4f4f5"
                    },
                    "&:active": {
                        transform: "translate(2px, 2px)",
                        boxShadow: "2px 2px 0 #000",
                    }
                }}
            >
                {language === "es" ? "Compartir enlace de invitación" : "Share invite link"}
            </Button>

            {/* How it works */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3, color: "#00DC8C" }}>
                <InfoOutlinedIcon />
                <Typography sx={{ fontWeight: 800, fontSize: "18px" }}>
                    {language === "es" ? "Cómo funciona" : "How it works"}
                </Typography>
            </Stack>

            <Box>
                <StepItem
                    number={1}
                    title={language === "es" ? "Comparte tu enlace" : "Share Your Link"}
                    description={language === "es"
                        ? "Comparte tu enlace de referencia vía chat, SMS o redes sociales."
                        : "Share your referral link via any chat app, SMS, or social media channel."}
                />
                <StepItem
                    number={2}
                    title={language === "es" ? "$2 Saldo Min. para Calificar" : "$2 Min. Balance to Qualify"}
                    description={language === "es"
                        ? "Debes tener un saldo mínimo de $2 para ganar recompensas."
                        : "You must have a minimum balance of $2 to earn rewards."}
                />
                <StepItem
                    number={3}
                    title={language === "es" ? "Invitado se Registra" : "Invitee Signs Up"}
                    description={language === "es"
                        ? "Tu amigo se registra con tu enlace. Tú ganas $0.10 y tu amigo gana $0.05."
                        : "Your friend signs up using your link. You earn $0.10 and your friend earns $0.05."}
                    isLast={true}
                />
            </Box>
        </Box>
    );
}
