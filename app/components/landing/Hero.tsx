import { Box, Button, Card, Chip, Container, Grid, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TranslateIcon from "@mui/icons-material/Translate";
import Link from "next/link";
import { Language, translate, heroContent, languageToggleLabel } from "@/app/landing-translations";

export function Hero({ lang, onToggleLanguage }: { lang: Language; onToggleLanguage: () => void }) {
    return (
        <Box
            component="section"
            sx={{
                background: "#ffffff",
                borderBottom: "3px solid #000000",
                position: "relative",
                overflow: "hidden",
                px: { xs: 2, md: 4 },
                py: { xs: 3, md: 5 },
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
