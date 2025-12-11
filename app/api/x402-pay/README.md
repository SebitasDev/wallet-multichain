# x402 Payment API

Processes x402 protocol payments using Ultravioleta's facilitator service.

## Overview

x402 is a payment protocol that enables gasless USDC transfers via ERC-3009 `transferWithAuthorization`. This endpoint acts as a proxy to Ultravioleta's facilitator.

**Flow:**
1. Client creates a payment header using `x402/client`
2. Client calls this API with the signed header
3. API verifies the payment with Ultravioleta
4. API settles the payment and returns the transaction

## Endpoint

### POST `/api/x402-pay`

Processes an x402 payment.

**Request Body:**
```json
{
  "paymentHeader": "eyJ4NDAy...",
  "recipientAddress": "0x...",
  "amount": "1000000",
  "network": "base"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `paymentHeader` | string | Yes | Base64-encoded payment payload from x402 client |
| `recipientAddress` | string | Yes | Destination address for USDC |
| `amount` | string | Yes | Amount in atomic units (6 decimals) |
| `network` | string | No | Network name (defaults to payload network or "base-sepolia") |

**Response (200 - Success):**
```json
{
  "success": true,
  "transaction": "0x...",
  "network": "base",
  "payer": "0x..."
}
```

**Response (400 - Verification Failed):**
```json
{
  "error": "Payment verification failed",
  "reason": "Invalid signature - recovered address does not match",
  "details": { ... }
}
```

**Response (400 - Settlement Failed):**
```json
{
  "error": "Payment settlement failed",
  "reason": "Insufficient funds",
  "details": { ... }
}
```

## Supported Networks

| Network | USDC Address | USDC Name |
|---------|--------------|-----------|
| base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | USD Coin |
| base-sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | USDC |
| polygon | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | USD Coin |

## Payment Header Structure

The `paymentHeader` is a base64-encoded JSON object:

```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "base",
  "payload": {
    "signature": "0x...",
    "authorization": {
      "from": "0x...",
      "to": "0x...",
      "value": "1000000",
      "validAfter": "1735600000",
      "validBefore": "1735603600",
      "nonce": "0x..."
    }
  }
}
```

## Client Usage

### With XO Wallet

```typescript
import { createPaymentHeader } from "x402/client";
import { createWalletClient, custom } from "viem";

const walletClient = createWalletClient({
  chain: base,
  transport: custom(xoProvider),
  account: userAddress
});

const paymentHeader = await createPaymentHeader(walletClient, 1, {
  scheme: "exact",
  network: "base",
  maxAmountRequired: "1000000",
  resource: "https://facilitator.ultravioletadao.xyz",
  description: "Payment",
  mimeType: "application/json",
  payTo: recipientAddress,
  maxTimeoutSeconds: 300,
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  extra: {
    name: "USD Coin",
    version: "2"
  }
});

const response = await fetch("/api/x402-pay", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    paymentHeader,
    recipientAddress,
    amount: "1000000",
    network: "base"
  })
});
```

### With Private Key

```typescript
import { createPaymentHeader } from "x402/client";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(privateKey);

const paymentHeader = await createPaymentHeader(account, 1, {
  scheme: "exact",
  network: "base",
  maxAmountRequired: "1000000",
  // ... same options as above
});
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Missing required fields | Request body incomplete | Include all required fields |
| Invalid payment header format | Base64 decode failed | Verify header encoding |
| Unsupported network | Network not configured | Use supported network |
| Payment verification failed | Invalid signature/amount/time | Re-sign with correct params |
| Payment settlement failed | On-chain execution error | Check balance/allowance |

## External Dependencies

- **Ultravioleta Facilitator:** `https://facilitator.ultravioletadao.xyz`
  - `/verify` - Validates payment signatures
  - `/settle` - Executes on-chain transfers
