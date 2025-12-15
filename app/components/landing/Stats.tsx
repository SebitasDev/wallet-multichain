import { Box, Container, Grid, Typography } from "@mui/material";
import { Language, translate, stats } from "@/app/landing-translations";

export function Stats({ lang }: { lang: Language }) {
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
