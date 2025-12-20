import { Box, Typography, Button } from "@mui/material";
import { useState } from "react";
import { DocsContentProps } from "../../../types";
import { AiContextModal } from "../../shared/AiContextModal";
import CalculateIcon from '@mui/icons-material/Calculate';
import { QuoteEndpointDocs } from "../shared/QuoteEndpointDocs";

export default function QuoteSection({ language, baseUrl }: DocsContentProps) {
    const [aiModalOpen, setAiModalOpen] = useState(false);

    const t = {
        title: language === 'en' ? "Get Quote Utility" : "Utilidad de Cotización",
        subtitle: language === 'en'
            ? "Calculate fees and estimated returns before bridging."
            : "Calcula comisiones y retornos estimados antes de enviar.",
        aiButton: language === 'en' ? "Docs for AI" : "Docs para IA"
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 4,
                flexDirection: { xs: "column", md: "row" },
                gap: 2
            }}>
                <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                        <CalculateIcon sx={{ fontSize: 40 }} />
                        <Typography variant="h4" fontWeight={900} sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                            {t.title}
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        {t.subtitle}
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    onClick={() => setAiModalOpen(true)}
                    sx={{
                        bgcolor: "#000",
                        color: "#fff",
                        fontWeight: 900,
                        border: "2px solid #000",
                        boxShadow: "4px 4px 0px #000",
                        "&:hover": {
                            bgcolor: "#333",
                            boxShadow: "2px 2px 0px #000",
                            transform: "translate(2px, 2px)"
                        }
                    }}
                >
                    🤖 {t.aiButton}
                </Button>
            </Box>

            <QuoteEndpointDocs language={language} baseUrl={baseUrl} />

            <AiContextModal
                open={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                type="quote"
                baseUrl={baseUrl}
            />
        </Box>
    );
}
