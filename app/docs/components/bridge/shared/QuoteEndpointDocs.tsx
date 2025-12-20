import { Box, Typography, Divider, Chip } from "@mui/material";
import { CodeBlock } from "../../shared/CodeBlock";
import { Language } from "../../../types";

type QuoteEndpointDocsProps = {
    language: Language;
    baseUrl: string;
};

const CONTENT = {
    en: {
        title: "Utility: Get Quote",
        desc: "Calculate the exact amount the recipient will receive (Net Amount) after Protocol Fees. This endpoint simulates the bridge transaction without executing it.",
        requestTitle: "Request Payload",
        responseTitle: "Response Example",
    },
    es: {
        title: "Utilidad: Obtener Cotización",
        desc: "Calcula el monto exacto que recibirá el destinatario (Monto Neto) después de la Comisión de Protocolo. Este endpoint simula la transacción sin ejecutarla.",
        requestTitle: "Payload de Solicitud",
        responseTitle: "Ejemplo de Respuesta",
    }
};

export const QuoteEndpointDocs = ({ language, baseUrl }: QuoteEndpointDocsProps) => {
    const t = CONTENT[language];

    const snippetRequest = `// POST ${baseUrl}/api/bridge/quote
{
  "amount": "100",
  "sourceChain": "Base", // or "Stellar"
  "targetChain": "Stellar", // or "Base"
  "token": "USDC" // Optional (defaults to USDC logic)
}`;

    const snippetResponse = `{
  "success": true,
  "amountSent": 100,
  "protocolFee": 0.05,
  "netAmountBridged": 99.95, // (100 - 0.05)
  "minAmount": 0.08,
  "estimatedReceived": "99.920000" // From Bridge Provider
}`;

    return (
        <Box sx={{ mt: 6, mb: 6 }}>
            <Divider sx={{ mb: 4 }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Typography variant="h5" fontWeight={800}>
                    {t.title}
                </Typography>
                <Chip label="POST" color="secondary" size="small" sx={{ fontWeight: "bold" }} />
                <Typography variant="caption" sx={{ fontFamily: "monospace", bgcolor: "#eee", px: 1, py: 0.5, borderRadius: 1 }}>
                    /api/bridge/quote
                </Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 3, color: "#555" }}>
                {t.desc}
            </Typography>

            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                {t.requestTitle}
            </Typography>
            <CodeBlock code={snippetRequest} label="JSON Body" />

            <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mt: 2 }}>
                {t.responseTitle}
            </Typography>
            <CodeBlock code={snippetResponse} label="JSON Response" />
        </Box>
    );
};
