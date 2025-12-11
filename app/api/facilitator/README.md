# Facilitator API

Custom facilitator for gasless USDC transfers and cross-chain payments via Circle CCTP.

## Overview

This API enables users to transfer USDC without paying gas fees. The user signs an ERC-3009 authorization, and the facilitator executes the transaction on their behalf.

**Flow:**
1. User signs `TransferWithAuthorization` (EIP-712)
2. Client calls `/verify` to validate the signature
3. Client calls `/settle` to execute the transfer
4. For cross-chain: facilitator burns USDC via CCTP and returns attestation

## Endpoints

### POST `/api/facilitator/verify`

Validates an ERC-3009 authorization before settlement.

**Request Body:**
```json
{
  "paymentPayload": {
    "authorization": {
      "from": "0x...",
      "to": "0x...",
      "value": "1000000",
      "validAfter": "0",
      "validBefore": "1735689600",
      "nonce": "0x..."
    },
    "signature": "0x..."
  },
  "sourceChain": "Base",
  "expectedAmount": "1000000"
}
```

**Response (200):**
```json
{
  "isValid": true,
  "payer": "0x...",
  "fee": "10000",
  "netAmount": "1000000"
}
```

**Response (400 - Invalid):**
```json
{
  "isValid": false,
  "invalidReason": "Invalid signature - recovered address does not match"
}
```

**Validation Checks:**
- Signature recovery matches `authorization.from`
- Amount covers `expectedAmount + fee`
- Current time is within `validAfter` and `validBefore`
- Nonce hasn't been used

---

### POST `/api/facilitator/settle`

Executes the payment settlement.

**Request Body (Same-chain):**
```json
{
  "paymentPayload": {
    "authorization": { ... },
    "signature": "0x..."
  },
  "sourceChain": "Base",
  "amount": "1000000",
  "recipient": "0x..."
}
```

**Request Body (Cross-chain):**
```json
{
  "paymentPayload": {
    "authorization": { ... },
    "signature": "0x..."
  },
  "sourceChain": "Base",
  "amount": "1000000",
  "crossChainConfig": {
    "destinationChain": "Polygon",
    "destinationDomain": 7,
    "mintRecipient": "0x..."
  }
}
```

**Response (200 - Same-chain):**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "payer": "0x...",
  "fee": "10000",
  "netAmount": "1000000"
}
```

**Response (200 - Cross-chain):**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "burnTransactionHash": "0x...",
  "payer": "0x...",
  "fee": "10000",
  "netAmount": "1000000",
  "attestation": {
    "message": "0x...",
    "attestation": "0x..."
  }
}
```

**Execution Steps:**
1. Calls `transferWithAuthorization` (user → facilitator)
2. **If cross-chain:**
   - Approves USDC to TokenMessenger
   - Calls `depositForBurn` (CCTP)
   - Waits for Circle attestation
3. **If same-chain:**
   - Transfers USDC to recipient

---

### POST `/api/facilitator/attestation`

Polls Circle's attestation service for pending cross-chain transfers.

**Request Body:**
```json
{
  "transactionHash": "0x...",
  "sourceChain": "Base"
}
```

**Response (200 - Complete):**
```json
{
  "status": "complete",
  "message": "0x...",
  "attestation": "0x..."
}
```

**Response (200 - Pending):**
```json
{
  "status": "pending"
}
```

**Response (400/500 - Error):**
```json
{
  "status": "error",
  "error": "Error message"
}
```

## Supported Chains

| Chain    | ChainId | CCTP Domain |
|----------|---------|-------------|
| Base     | 8453    | 6           |
| Polygon  | 137     | 7           |
| Arbitrum | 42161   | 3           |
| Optimism | 10      | 2           |
| Unichain | 130     | 16          |

## Environment Variables

```env
FACILITATOR_PRIVATE_KEY=0x...
NEXT_PUBLIC_FACILITATOR_ADDRESS=0x...
```

## Fee Structure

- **Fixed fee:** 0.01 USDC (10000 atomic units)
- Fee is included in the signed amount
- User signs for `amount + fee`, receives `amount`

## Client Integration

Use the `useFacilitator` hook for easy integration:

```typescript
import { useFacilitator } from "@/app/facilitator";

const { transferDirect, transferCrossChain } = useFacilitator({
  provider: xoProvider,  // or
  privateKey: "0x...",
  userAddress: "0x..."
});

// Same-chain transfer
await transferDirect("10.00", "Base", recipientAddress);

// Cross-chain transfer
await transferCrossChain("10.00", "Base", "Polygon", recipientAddress);
```
