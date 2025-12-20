"use client";

import { useState } from "react";
import {
    Box,
    Typography,
    Divider,
    Chip,
    ToggleButton,
    ToggleButtonGroup,
    Button
} from "@mui/material";
import { CodeBlock } from "../../shared/CodeBlock";
import { AiContextModal } from "../../shared/AiContextModal";
import { QuoteEndpointDocs } from "../shared/QuoteEndpointDocs";
import { DocsContentProps } from "../../../types";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";
import { StellarIcon } from "@/app/components/atoms/StellarIcon";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

type ImplementationMode = 'wallet' | 'privateKey';

const CONTENT = {
    en: {
        title: "USDC (EVM) → XLM (Stellar)",
        method: "POST",
        desc: "Bridge USDC from an EVM network (like Base) directly to XLM on a Stellar account. This utilizes a 'gasless' pull payment via EIP-3009.",
        prereqDesc: "You must fetch the Facilitator EVM Address to authorize the transfer.",
        step1: "1. Get Configuration",
        step2: "2. Generate Signature (EIP-3009)",
        step3: "3. Execute Bridge",
        responseTitle: "API Response Info",
        success: "Success Response",
        modeWallet: "Connected Wallet (Browser)",
        modeKey: "Private Key (Backend/Script)"
    },
    es: {
        title: "USDC (EVM) → XLM (Stellar)",
        method: "POST",
        desc: "Puentea USDC desde una red EVM (como Base) directamente a XLM en una cuenta Stellar. Utiliza un pago 'gasless' vía EIP-3009.",
        prereqDesc: "Debes obtener la Dirección EVM del Facilitador para autorizar la transferencia.",
        step1: "1. Obtener Configuración",
        step2: "2. Generar Firma (EIP-3009)",
        step3: "3. Ejecutar Bridge",
        responseTitle: "Información de Respuesta",
        success: "Respuesta Exitosa",
        modeWallet: "Wallet Conectada (Navegador)",
        modeKey: "Llave Privada (Backend/Script)"
    }
};

export default function UsdcToXlmSection({ language, baseUrl }: DocsContentProps) {
    // Default to 'privateKey' as requested
    const [implMode, setImplMode] = useState<ImplementationMode>('privateKey');
    const [aiModalOpen, setAiModalOpen] = useState(false);

    const t = CONTENT[language];

    // --- CODE SNIPPETS ---
    const snippetConfig = `// GET ${baseUrl}/api/bridge/stellar
{
  "stellarAddress": "G...", 
  "evmAddress": "0x123..." // FACILITATOR_ADDRESS
}`;

    const snippetViemWallet = `import { createWalletClient, custom } from "viem";
import { base } from "viem/chains";

// 1. Setup Client (Browser)
const walletClient = createWalletClient({
    chain: base,
    transport: custom(window.ethereum!)
});
const [account] = await walletClient.requestAddresses(); // Get connected address

// 2. Constants
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const FACILITATOR_ADDRESS = "0x..."; // Value from Step 1

// 3. Prepare Data
const value = BigInt(Math.floor(amount * 1_000_000)); // 6 decimals
const validAfter = BigInt(0); 
const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
const nonce = crypto.getRandomValues(new Uint8Array(32));
const nonceHex = "0x" + Buffer.from(nonce).toString('hex'); // Ensure Buffer polyfill

// 4. Sign Typed Data (EIP-3009)
const signature = await walletClient.signTypedData({
    account,
    domain: {
        name: "USD Coin",
        version: "2",
        chainId: base.id,
        verifyingContract: USDC_BASE,
    },
    types: {
        TransferWithAuthorization: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
        ]
    },
    primaryType: "TransferWithAuthorization",
    message: {
        from: account,
        to: FACILITATOR_ADDRESS,
        value,
        validAfter,
        validBefore,
        nonce: nonceHex,
    },
});

// Use this 'signature' and 'message' fields in the API payload`;

    const snippetViemKey = `import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// 1. Setup Account (Backend/Script)
const account = privateKeyToAccount("0xMY_PRIVATE_KEY");

const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http()
});

// 2. Constants
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const FACILITATOR_ADDRESS = "0x..."; // Value from Step 1

// 3. Prepare Data
const value = BigInt(Math.floor(amount * 1_000_000));
const validAfter = BigInt(0); 
const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);
const nonce = crypto.getRandomValues(new Uint8Array(32));
const nonceHex = "0x" + Buffer.from(nonce).toString('hex');

// 4. Sign Typed Data (EIP-3009)
const signature = await walletClient.signTypedData({
    domain: {
        name: "USD Coin",
        version: "2",
        chainId: base.id,
        verifyingContract: USDC_BASE,
    },
    types: {
        TransferWithAuthorization: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
        ]
    },
    primaryType: "TransferWithAuthorization",
    message: {
        from: account.address,
        to: FACILITATOR_ADDRESS,
        value,
        validAfter,
        validBefore,
        nonce: nonceHex,
    },
});`;

    const snippetPayload = `const payload = {
    sourceChain: "Base",
    targetChain: "Stellar",
    amount: "10.5",
    recipientStellar: "GB...", 
    destinationToken: "XLM", // <--- Important
    paymentPayload: {
        authorization: {
            from: "0xUser...",
            to: "0xFacilitator...", // From step 1
            value: "10500000",
            validAfter: "0",
            validBefore: "...",
            nonce: "0x..."
        },
        signature: "0x..." 
    }
};

await fetch("${baseUrl}/api/bridge/stellar/xlm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
});`;

    const snippetResponse = `{
  "success": true,
  "transactionHash": "0x..." // EVM Transaction Hash (Facilitator -> 1-Click)
}`;

    // ... (existing imports)

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 32, height: 32 }}><UsdcIcon /></Box>
                    <Typography variant="h4" fontWeight={900}>USDC</Typography>
                </Box>

                <ArrowForwardIcon sx={{ color: "#999" }} />

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 32, height: 32, color: "#000" }}><StellarIcon /></Box>
                    <Typography variant="h4" fontWeight={900}>XLM</Typography>
                </Box>

                <Chip label="POST" color="primary" size="small" sx={{ fontWeight: "bold", ml: 1 }} />

                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setAiModalOpen(true)}
                    sx={{
                        fontWeight: 900,
                        border: "2px solid #000",
                        color: "#000",
                        bgcolor: "#fff",
                        boxShadow: "2px 2px 0px #000",
                        ml: "auto",
                        "&:hover": {
                            bgcolor: "#eee",
                            boxShadow: "1px 1px 0px #000",
                            transform: "translate(1px, 1px)"
                        }
                    }}
                >
                    🤖 Docs for AI
                </Button>
                <Typography variant="caption" sx={{ fontFamily: "monospace", bgcolor: "#eee", px: 1, py: 0.5, borderRadius: 1 }}>
                    {baseUrl}/api/bridge/stellar/xlm
                </Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 4, color: "#555" }}>
                {t.desc}
            </Typography>

            <Divider sx={{ mb: 4 }} />

            {/* FEE INFO ALERT */}
            <Box sx={{
                border: "2px solid #000",
                boxShadow: "4px 4px 0px #000",
                bgcolor: "#FFDE00",
                p: 2,
                mb: 4
            }}>
                <Typography variant="subtitle2" fontWeight={900} sx={{ textTransform: "uppercase", display: "flex", gap: 1 }}>
                    ⚠️ {language === 'en' ? "Fee Structure" : "Estructura de Comisiones"}
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                    {language === 'en'
                        ? "Minimum Amount: 0.08 USDC. Protocol Fee: 0.05 USDC."
                        : "Monto Mínimo: 0.08 USDC. Comisión de Protocolo: 0.05 USDC."}
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                    {language === 'en'
                        ? "The fee covers the cost of gasless execution (EIP-3009) and bridge routing."
                        : "La comisión cubre el costo de la ejecución gasless (EIP-3009) y el enrutamiento del bridge."}
                </Typography>
            </Box>

            <QuoteEndpointDocs language={language} baseUrl={baseUrl} />

            {/* Step 1 */}
            <Typography variant="h6" fontWeight={700} gutterBottom>{t.step1}</Typography>
            <Typography variant="body2">{t.prereqDesc}</Typography>
            <CodeBlock code={snippetConfig} label="GET /api/bridge/stellar" />

            {/* Step 2 */}
            <Typography variant="h6" fontWeight={700} gutterBottom>{t.step2}</Typography>

            <ToggleButtonGroup
                color="primary"
                value={implMode}
                exclusive
                onChange={(e, next) => next && setImplMode(next)}
                size="small"
                sx={{ mb: 2 }}
            >
                <ToggleButton value="privateKey" sx={{ fontWeight: "bold" }}>
                    {t.modeKey}
                </ToggleButton>
                <ToggleButton value="wallet" sx={{ fontWeight: "bold" }}>
                    {t.modeWallet}
                </ToggleButton>
            </ToggleButtonGroup>

            <CodeBlock
                code={implMode === 'wallet' ? snippetViemWallet : snippetViemKey}
                label={implMode === 'wallet' ? "Viem (Browser / Metamask)" : "Viem (Script)"}
            />

            {/* Step 3 */}
            <Typography variant="h6" fontWeight={700} gutterBottom>{t.step3}</Typography>
            <CodeBlock code={snippetPayload} label="Request Payload" />

            {/* Response */}
            <Typography variant="h6" fontWeight={700} gutterBottom>{t.responseTitle}</Typography>
            <CodeBlock code={snippetResponse} label={t.success} />

            <AiContextModal
                open={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                type="usdc-xlm"
                baseUrl={baseUrl}
            />
        </Box>
    );
}
