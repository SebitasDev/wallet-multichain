import { Box, Card, Container, Grid, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Language, translate, translateValue, comparison, sectionTitles, comparisonHeaders, LocalizedString } from "@/app/landing-translations";
import { SectionTitle } from "./SectionTitle";

export function Comparison({ lang }: { lang: Language }) {
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
                                                {translateValue(item.us as LocalizedString, lang)}
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
