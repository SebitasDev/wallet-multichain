import { Box, Typography } from "@mui/material";
import { Language, LocalizedString, translate } from "@/app/landing-translations";

export function SectionTitle({ label, title, lang, compact = false }: { label: LocalizedString; title: LocalizedString; lang: Language; compact?: boolean }) {
    return (
        <Box sx={{ mb: compact ? 2 : 3, textAlign: "center" }}>
            <Typography
                variant="body2"
                sx={{
                    color: "#666666",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    fontWeight: 800,
                    fontSize: 12,
                    mb: 1,
                }}
            >
                {translate(label, lang)}
            </Typography>
            <Typography
                sx={{
                    fontSize: { xs: 28, md: 38 },
                    fontWeight: 900,
                    color: "#000000",
                }}
            >
                {translate(title, lang)}
            </Typography>
        </Box>
    );
}
