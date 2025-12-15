import { Box, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import { Language, translate, features, sectionTitles } from "@/app/landing-translations";
import { SectionTitle } from "./SectionTitle";

export function Features({ lang }: { lang: Language }) {
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
