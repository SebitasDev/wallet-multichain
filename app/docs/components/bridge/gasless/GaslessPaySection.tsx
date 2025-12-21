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
import { DocsContentProps } from "../../../types";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function GaslessPaySection({ language, baseUrl }: DocsContentProps) {
    const [signingChain, setSigningChain] = useState<'evm' | 'stellar'>('evm');
    const [aiModalOpen, setAiModalOpen] = useState(false);

    // Reuse logic style from UsdcToUsdcSection but simplified for pay/gasless
    const endpoint = `${baseUrl}/api/pay/gasless`;

    const content = {
        en: {
            title: "Gasless Transfer (Intra-chain)",
            desc: "Send USDC to another address on the SAME chain without holding gas tokens (ETH/XLM). The Facilitator pays the gas fees.",
            step1: "1. Generate Signature / XDR",
            step2: "2. Execute Transfer",
            response: "Response",
            evm: "EVM (Base)",
            stellar: "Stellar"
        },
        es: {
            title: "Transferencia Gasless (Intra-chain)",
            desc: "Envía USDC a otra dirección en la MISMA red sin tener tokens de gas (ETH/XLM). El Facilitador paga los fees.",
            step1: "1. Generar Firma / XDR",
            step2: "2. Ejecutar Transferencia",
            response: "Respuesta",
            evm: "EVM (Base)",
            stellar: "Stellar"
        }
    };

    const t = content[language];

    const snippetEvm = `// Client-side (Viem)
import { createWalletClient, custom } from "viem";
import { base } from "viem/chains";

// 1. Setup Wallet Client
const walletClient = createWalletClient({
    chain: base,
    transport: custom(window.ethereum!)
});
const [userAddress] = await walletClient.requestAddresses();

// 2. Fetch Configuration
const configRes = await fetch("${baseUrl}/api/bridge/stellar");
const config = await configRes.json();
const FACILITATOR_ADDRESS = config.evmAddress;

// 3. Prepare EIP-3009 Authorization
const amount = 10.5;
const value = BigInt(Math.floor(amount * 1_000_000)); // 6 decimals
const validAfter = BigInt(0);
const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
const nonce = crypto.getRandomValues(new Uint8Array(32));
const nonceHex = "0x" + Buffer.from(nonce).toString('hex');

// 4. Sign Typed Data
const signature = await walletClient.signTypedData({
    account: userAddress,
    domain: {
        name: "USD Coin",
        version: "2",
        chainId: base.id,
        verifyingContract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
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
        from: userAddress,
        to: FACILITATOR_ADDRESS,
        value,
        validAfter,
        validBefore,
        nonce: nonceHex,
    },
});

// 5. Submit Gasless Transfer
const payload = {
    chain: "base",
    amount: amount,
    recipient: "0xRecipientAddress...", // Destination on Base
    payload: {
        authorization: {
            from: userAddress,
            to: FACILITATOR_ADDRESS,
            value: value.toString(),
            validAfter: validAfter.toString(),
            validBefore: validBefore.toString(),
            nonce: nonceHex
        },
        signature: signature
    }
};

const res = await fetch("${endpoint}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
});
const data = await res.json();
console.log("Tx Hash:", data.txHash);`;

    const snippetStellar = `// Client-side (Stellar SDK)
import * as StellarSdk from "stellar-sdk";

// 1. Setup
const server = new StellarSdk.Horizon.Server("https://horizon.stellar.org");
const userKeypair = StellarSdk.Keypair.fromSecret("S_USER_SECRET_KEY..."); 

// 2. Fetch Configuration (Facilitator Public Key)
const configRes = await fetch("${baseUrl}/api/bridge/stellar");
const config = await configRes.json();
const FACILITATOR_STELLAR_ADDRESS = config.stellarAddress;

// 3. Load User Account
const account = await server.loadAccount(userKeypair.publicKey());
const usdcAsset = new StellarSdk.Asset(
    "USDC", 
    "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" // Circle USDC on Mainnet
);

// 4. Build Transaction (Payment: User -> Facilitator)
const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: "Public Global Stellar Network ; September 2015"
})
    .addOperation(StellarSdk.Operation.payment({
        destination: FACILITATOR_STELLAR_ADDRESS, 
        asset: usdcAsset,
        amount: "10.5" 
    }))
    .setTimeout(30)
    .build();

// 5. Sign & Export XDR
transaction.sign(userKeypair);
const signedXDR = transaction.toEnvelope().toXDR().toString("base64");

// 6. Submit Gasless Transfer
const payload = {
    chain: "stellar",
    amount: "10.5",
    recipient: "G_RECIPIENT_ADDRESS...", // Destination on Stellar
    payload: {
        signedXDR: signedXDR
    }
};

const res = await fetch("${endpoint}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
});
const data = await res.json();
console.log("Tx Hash:", data.txHash);`;

    const snippetRes = `{
  "success": true,
  "txHash": "..." // Hash of the Push transaction (Facilitator -> Recipient)
}`;

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 32, height: 32 }}><UsdcIcon /></Box>
                    <Typography variant="h5" fontWeight={900}>Gasless Pay</Typography>
                </Box>
                <Chip label="POST" color="secondary" size="small" sx={{ fontWeight: "bold", ml: 1 }} />
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
            </Box>

            <Typography variant="caption" sx={{ fontFamily: "monospace", display: "block", mb: 2, bgcolor: "#eee", px: 1, py: 0.5, borderRadius: 1, width: "fit-content" }}>
                {endpoint}
            </Typography>

            <Typography variant="body1" sx={{ mb: 4, color: "#555" }}>
                {t.desc}
            </Typography>

            <Divider sx={{ mb: 4 }} />

            <Typography variant="h6" fontWeight={700} gutterBottom>{t.step1}</Typography>

            <ToggleButtonGroup
                value={signingChain}
                exclusive
                onChange={(e, next) => next && setSigningChain(next)}
                size="small"
                sx={{ mb: 2 }}
            >
                <ToggleButton value="evm" sx={{ fontWeight: "bold", px: 3 }}>{t.evm}</ToggleButton>
                <ToggleButton value="stellar" sx={{ fontWeight: "bold", px: 3 }}>{t.stellar}</ToggleButton>
            </ToggleButtonGroup>

            <CodeBlock
                code={signingChain === 'evm' ? snippetEvm : snippetStellar}
                label={signingChain === 'evm' ? "Request (Base)" : "Request (Stellar)"}
            />

            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mt: 4 }}>{t.response}</Typography>
            <CodeBlock code={snippetRes} label="JSON" />

            <AiContextModal
                open={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                type="gasless"
                baseUrl={baseUrl}
            />
        </Box>
    );
}
