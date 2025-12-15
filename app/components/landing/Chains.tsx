import { Box, Container, Typography, keyframes } from "@mui/material";
import { Language, translate, chains, sectionTitles } from "@/app/landing-translations";
import { SectionTitle } from "./SectionTitle";

const marquee = keyframes`
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
`;

export function Chains({ lang }: { lang: Language }) {
    return (
        <Box sx={{ py: { xs: 6, md: 8 }, overflow: "hidden" }}>
            <Container maxWidth="lg">
                <SectionTitle label={sectionTitles.chains.label} title={sectionTitles.chains.title} lang={lang} compact />
                <Box
                    sx={{
                        display: "flex",
                        width: "max-content",
                        gap: 3,
                        animation: `${marquee} 40s linear infinite`,
                        "&:hover": {
                            animationPlayState: "paused",
                        },
                    }}
                >
                    {[...chains, ...chains].map((chain, index) => (
                        <Box
                            key={`${chain.name}-${index}`}
                            sx={{
                                width: 200,
                                flexShrink: 0,
                                p: 3,
                                background: "#ffffff",
                                border: "3px solid #000000",
                                borderRadius: 3,
                                boxShadow: "4px 4px 0px #000000",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 1.5,
                                transition: "all 0.2s",
                                "&:hover": {
                                    transform: "translate(-2px, -2px)",
                                    boxShadow: "6px 6px 0px #000000",
                                },
                            }}
                        >
                            <Box sx={{ "& svg": { fontSize: 48, color: chain.color } }}>{chain.icon}</Box>
                            <Typography fontWeight={800} fontSize={18}>
                                {chain.name}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Container>
        </Box>
    );
}
