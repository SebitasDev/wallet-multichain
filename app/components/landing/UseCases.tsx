import { Box, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import { Language, translate, useCases, sectionTitles } from "@/app/landing-translations";
import { SectionTitle } from "./SectionTitle";

export function UseCases({ lang }: { lang: Language }) {
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
