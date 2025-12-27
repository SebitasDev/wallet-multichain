import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { Language, translate, footerCopy } from "@/app/landing-translations";

export function Footer({ lang }: { lang: Language }) {
    return (
        <Box sx={{ background: "#000000", borderTop: "3px solid #ffffff", py: 6 }}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography fontWeight={900} fontSize={24} color="#ffffff" mb={2}>
                            1LLET
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
                                    <Link key={link.label.es} href={link.href} style={{ textDecoration: "none" }}>
                                        <Typography
                                            color="#cccccc"
                                            fontWeight={600}
                                            fontSize={14}
                                            sx={{ "&:hover": { color: "#ffffff", textDecoration: "underline" } }}
                                        >
                                            {translate(link.label, lang)}
                                        </Typography>
                                    </Link>
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
