import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Typography, Paper } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";

interface AiContextModalProps {
    open: boolean;
    onClose: () => void;
    type: 'usdc-xlm' | 'usdc-usdc' | 'quote' | 'gasless';
    baseUrl: string;
}

export const AiContextModal = ({ open, onClose, type, baseUrl }: AiContextModalProps) => {

    const getContextContent = () => {
        const signatureCode = `
// --- SIGNATURE GENERATION (COPY-PASTE) ---
import { createWalletClient, custom } from "viem";
import { base } from "viem/chains";

// 1. Setup Client (Browser)
const walletClient = createWalletClient({
    chain: base,
    transport: custom(window.ethereum!)
});
const [account] = await walletClient.requestAddresses(); 

// 2. Constants
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const FACILITATOR_ADDRESS = "0x..."; // Value from Step 1 (GET /api/bridge/stellar)

// 3. Prepare Data
const value = BigInt(Math.floor(amount * 1_000_000)); // 6 decimals
const validAfter = BigInt(0); 
const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
const nonce = crypto.getRandomValues(new Uint8Array(32));
const nonceHex = "0x" + Buffer.from(nonce).toString('hex'); 

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
// Use 'signature' in paymentPayload
`;

        const stellarSignatureCode = `
// --- STELLAR SIGNING (COPY-PASTE) ---
import * as StellarSdk from "stellar-sdk";

// 1. Setup (Server safe)
const server = new StellarSdk.Horizon.Server("https://horizon.stellar.org");
const sourceKeypair = StellarSdk.Keypair.fromSecret("S..."); // User Private Key

// 2. Load Account & Build Transaction
const account = await server.loadAccount(sourceKeypair.publicKey());
const usdcAsset = new StellarSdk.Asset("USDC", "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN");

// 3. Create Transaction (Payment to Facilitator)
const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: "Public Global Stellar Network ; September 2015"
})
    .addOperation(StellarSdk.Operation.payment({
        destination: "G...", // FACILITATOR_STELLAR_ADDRESS (from Step 1)
        asset: usdcAsset,
        amount: "10.5" 
    }))
    .setTimeout(30)
    .build();

// 4. Sign & Convert to XDR
transaction.sign(sourceKeypair);
const signedXDR = transaction.toEnvelope().toXDR().toString("base64");

// Use 'signedXDR' in the API payload
`;

        const commonHeader = `
CONTEXT FOR AI AGENT:
You are implementing a bridge using the 1LLET Protocol API.
Base URL: ${baseUrl}

STEP 0: PREREQUISITE - GET FACILITATOR ADDRESS
Before generating signatures or bridge requests, you MUST fetch the Facilitator's address.
ENDPOINT: GET /api/bridge/stellar
RESPONSE:
{
  "stellarAddress": "G...", // Use for Stellar -> EVM (User sends funds here)
  "evmAddress": "0x..."     // Use for EVM -> Stellar (User authorizes this address)
}

// Rules removed from common header to support variable fees
`;

        if (type === 'usdc-xlm') {
            return `${commonHeader}
ENDPOINT: POST /api/bridge/stellar/xlm
DIRECTION: Base (EVM) -> Stellar (XLM)

PAYLOAD SCHEMA (TypeScript):
interface StellarBridgePayload {
  sourceChain: "Base"; 
  amount: number; // e.g., 10.5
  recipientStellar: string; // "G..." address
  paymentPayload: { // EIP-3009 TransferWithAuthorization
    authorization: {
      from: string;
      to: string; // Facilitator Address
      value: string; // Atomic units
      validAfter: number;
      validBefore: number;
      nonce: string;
    };
    signature: string; // Hex string
  };
}

${signatureCode}

FLOW:
1. Call GET /api/bridge/stellar to get 'evmAddress' (Facilitator).
2. User signs EIP-3009 Authorization (User -> Facilitator).
3. Call API with payload.
4. Facilitator deduces 0.05 fee.
5. Facilitator swaps remaining USDC to XLM via 1-Click Bridge.
6. User receives XLM.
`;
        }

        if (type === 'usdc-usdc') {
            return `${commonHeader}
ENDPOINT: POST /api/bridge/stellar/usdc
SUPPORTED DIRECTIONS:
1. EVM -> Stellar (USDC)
2. Stellar -> EVM (USDC)

--- CASE 1: EVM -> STELLAR (USDC) ---
Payload: Same as XLM endpoint, but set 'recipientStellar'.
Logic: Facilitator deduces 0.05 USDC fee, sends remaining USDC to 'recipientStellar'.
Target Chain: "Stellar"

PAYLOAD SCHEMA (EVM -> Stellar):
interface StellarBridgePayload {
  sourceChain: "Base";
  amount: number;
  recipientStellar: string;
  paymentPayload: ... // Same as above
}

${signatureCode}

--- CASE 2: STELLAR -> EVM (USDC) ---
PAYLOAD SCHEMA:
interface StellarBridgePayload {
  sourceChain: "Stellar";
  targetChain: "Base"; 
  amount: number;
  recipientOther: string; // "0x..." EVM address
  signedXDR: string; // User Signed Transaction XDR (User -> Facilitator)
}

${stellarSignatureCode}

FLOW:
1. User signs Stellar Transaction (PaymentOp: User -> Facilitator Public Key).
FLOW:
1. Call GET /api/bridge/stellar to get 'stellarAddress' (Facilitator Public Key).
2. User signs Stellar Transaction (PaymentOp: User -> Facilitator).
3. Call POST /api/bridge/stellar/usdc with signedXDR.
4. API submits XDR (Funds moved to Facilitator).
5. Facilitator deduces 0.05 fee.
6. Facilitator sends remaining USDC to 1-Click Bridge (Stellar -> EVM).
7. Bridge routes funds to 'recipientOther'.
`;
        }

        if (type === 'quote') {
            return `${commonHeader}
ENDPOINT: POST /api/bridge/quote
PURPOSE: Calculate exact amounts (Net Amount) and view fees without executing a transaction.

PAYLOAD SCHEMA:
interface QuotePayload {
  sourceChain: "Stellar" | "Base"; 
  targetChain: "Base" | "Stellar";
  amount: number; // Amount user wants to send
  token?: "USDC" | "XLM"; // Optional. 
}

RESPONSE SCHEMA:
interface QuoteResponse {
  success: boolean;
  amountSent: number;       // Input amount
  protocolFee: number;      // 0.05
  minAmount: number;        // Minimum required for this route
  netAmountBridged: number; // amount - protocolFee
  estimatedReceived: string; // Final amount recipient gets (from Bridge provider)
}

NOTES:
- Use this to show the user "You will receive X" before they sign.
- Returns 400 if amount < minAmount.
`;
        }

        if (type === 'gasless') {
            return `${commonHeader}
ENDPOINT: POST /api/pay/gasless
PURPOSE: Send USDC to another address on the SAME chain without holding gas tokens.

FEES:
- Protocol Fee: 0.02 USDC.
- Minimum Amount: 0.2 USDC.

SUPPORTED CHAINS:
1. Base (EVM)
2. Stellar

--- CHAIN 1: BASE (EVM) ---
PAYLOAD SCHEMA:
{
    chain: "base",
    amount: number,
    recipient: string, // 0x...
    payload: {
        authorization: { ... }, // EIP-3009 TransferWithAuthorization struct
        signature: string       // Hex string
    }
}

${signatureCode}

--- CHAIN 2: STELLAR ---
PAYLOAD SCHEMA:
{
    chain: "stellar",
    amount: "string",       // e.g. "10.0" (Stellar uses strings)
    recipient: string,      // G...
    payload: {
        signedXDR: string   // Base64 XDR of Payment Op (User -> Facilitator)
    }
}

${stellarSignatureCode}

FLOW:
1. User signs transfer to Facilitator.
2. API receives payload.
3. Facilitator deducts 0.02 USDC fee.
4. Facilitator pushes remaining funds to 'recipient'.
`;
        }
    };

    const content = getContextContent();

    const handleCopy = () => {
        navigator.clipboard.writeText(content || "");
        toast.success("AI Context Copied!");
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    border: "4px solid #000",
                    boxShadow: "8px 8px 0px #000",
                    borderRadius: 2
                }
            }}
        >
            <DialogTitle sx={{
                bgcolor: "#000",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: 900,
                letterSpacing: 1
            }}>
                🤖 CONTEXT FOR AI AGENTS
                <IconButton onClick={onClose} sx={{ color: "#fff" }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ bgcolor: "#FAFAFA", p: 3 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={700}>
                        Provide this context to an AI Agent (Cursor, Windsurf, Replit) to implement this bridge correctly.
                    </Typography>
                </Box>

                <Paper sx={{
                    p: 2,
                    bgcolor: "#1e1e1e",
                    color: "#00FF41",
                    fontFamily: "monospace",
                    fontSize: 12,
                    maxHeight: "400px",
                    overflow: "auto",
                    border: "2px solid #000",
                    position: "relative"
                }}>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{content}</pre>
                </Paper>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleCopy}
                    startIcon={<ContentCopyIcon />}
                    sx={{
                        mt: 3,
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
                    COPY CONTEXT
                </Button>
            </DialogContent>
        </Dialog>
    );
};
