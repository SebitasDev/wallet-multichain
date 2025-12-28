export const getAiContext = (type: string, baseUrl: string) => {
    const commonHeader = `
CONTEXT FOR AI AGENT:
You are implementing a bridge using the 1LLET Protocol API.
Base URL: ${baseUrl}

// Rules removed from common header to support variable fees
`;

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
};
