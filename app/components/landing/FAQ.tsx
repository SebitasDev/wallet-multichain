import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Language, translate, faqs, sectionTitles } from "@/app/landing-translations";
import { SectionTitle } from "./SectionTitle";

export function FAQ({ lang }: { lang: Language }) {
    return (
        <Box sx={{ py: { xs: 6, md: 10 }, background: "#f5f5f5", borderTop: "3px solid #000000" }}>
            <Container maxWidth="md">
                <SectionTitle label={sectionTitles.faq.label} title={sectionTitles.faq.title} lang={lang} />
                <Stack spacing={2} sx={{ mt: 4 }}>
                    {faqs.map((faq) => (
                        <Accordion
                            key={faq.q.es}
                            sx={{
                                background: "#ffffff",
                                border: "3px solid #000000",
                                borderRadius: "12px !important",
                                boxShadow: "4px 4px 0px #000000",
                                "&:before": { display: "none" },
                                "&.Mui-expanded": {
                                    margin: "0 !important",
                                },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={{ color: "#000000" }} />}
                                sx={{
                                    "&.Mui-expanded": {
                                        borderBottom: "2px solid #000000",
                                    },
                                }}
                            >
                                <Typography fontWeight={800} fontSize={16} color="#000000">
                                    {translate(faq.q, lang)}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 3, background: "#f5f5f5" }}>
                                <Typography color="#666666" fontWeight={600} lineHeight={1.7} fontSize={15}>
                                    {translate(faq.a, lang)}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Stack>
            </Container>
        </Box>
    );
}
