import { Box, Card, CardContent, Container, Grid, Stack, Typography } from "@mui/material";
import { Language, translate, mainFeatures, sectionTitles } from "@/app/landing-translations";
import { SectionTitle } from "./SectionTitle";

export function MainFeatures({ lang }: { lang: Language }) {
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
