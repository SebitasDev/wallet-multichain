import { Box, Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { Language, translate, ctaCopy } from "@/app/landing-translations";

export function CTA({ lang }: { lang: Language }) {
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
