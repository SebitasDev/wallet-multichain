# Spark.fi USDC Savings Vaults Integration

This module integrates Spark.fi USDC Savings Vaults (sUSDC) into the multichain wallet, allowing users to earn yield on their USDC across multiple L2 chains.

## Overview

- **Token:** USDC (6 decimals)
- **Vault Standard:** ERC-4626
- **Yield Source:** Sky Savings Rate (SSR) via Spark.fi
- **Current APY:** ~4.50%

## Supported Chains

| Chain | sUSDC Vault Address | USDC Address |
|-------|---------------------|--------------|
| Base | `0x3128a0f7f0ea68e7b7c9b00afa7e41045828e858` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Optimism | `0xCF9326e24EBfFBEF22ce1050007A43A3c0B6DB55` | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| Arbitrum | `0x940098b108fb7d0a7e374f6eded7760787464609` | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Unichain | `0x14d9143BEcC348920b68D123687045db49a016C6` | `0x078D782b760474a361dDA0AF3839290b0EF57AD6` |

## API Endpoints

### POST /api/savings/deposit

Deposits USDC into the Spark.fi sUSDC vault.

**Request:**
```json
{
  "signature": "0x...",
  "chain": "base|optimism|arbitrum|unichain",
  "amount": "1000000",
  "walletAddress": "0x...",
  "nonce": "1699999999999"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "shares": "990000000000000000"
}
```

### POST /api/savings/withdraw

Withdraws USDC from the Spark.fi sUSDC vault.

**Request:**
```json
{
  "signature": "0x...",
  "chain": "base|optimism|arbitrum|unichain",
  "amount": "1000000",
  "walletAddress": "0x...",
  "nonce": "1699999999999"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "usdcAmount": "1000000"
}
```

### GET /api/savings/positions/:walletAddress

Fetches all savings positions for a wallet across all supported chains.

**Response:**
```json
{
  "positions": [
    {
      "chain": "base",
      "shares": "990000000000000000",
      "currentValue": "1050000"
    }
  ]
}
```

## USDC Decimal Handling

**IMPORTANT:** USDC uses 6 decimals, not 18.

- 1 USDC = 1,000,000 (1e6)
- Use `BigInt` for all calculations
- Use `parseUsdcAmount()` to convert user input
- Use `formatUsdcAmount()` to display values

```typescript
import { parseUsdcAmount, formatUsdcAmount } from "@/app/savings/config";

// Convert user input to BigInt
const amount = parseUsdcAmount("100.50"); // Returns 100500000n

// Format for display
const display = formatUsdcAmount(100500000n); // Returns "100.50"
```

## File Structure

```
/app/savings/
├── config.ts          # Chain config, vault addresses, helpers
├── types.ts           # TypeScript interfaces
├── vaultAbi.ts        # ERC-4626 vault ABI
├── signature.ts       # EIP-712 signature utilities
└── README.md          # This file

/app/api/savings/
├── deposit/route.ts   # Deposit endpoint
├── withdraw/route.ts  # Withdraw endpoint
└── positions/[walletAddress]/route.ts  # Positions endpoint

/app/store/
└── useSavingsStore.ts # Zustand store for savings state

/app/dashboard/savings/
├── page.tsx           # Main savings page
├── components/
│   ├── SavingsSummaryCard.tsx
│   ├── DepositSection.tsx
│   ├── PositionsTable.tsx
│   ├── DistributionChart.tsx
│   └── ConfirmationModal.tsx
└── hooks/
    ├── useSavingsPositions.ts
    ├── useSavingsDeposit.ts
    ├── useSavingsWithdraw.ts
    └── useUsdcBalance.ts
```

## How It Works

### Deposit Flow
1. User enters USDC amount and selects chain
2. Frontend signs EIP-712 typed data with wallet
3. API validates signature matches wallet address
4. API checks USDC balance and allowance
5. If allowance insufficient, returns `USDC_APPROVAL_NEEDED`
6. Executes `vault.deposit(amount, receiver)`
7. Returns transaction hash and shares received

### Withdraw Flow
1. User clicks withdraw on a position
2. Frontend signs EIP-712 typed data
3. API validates signature
4. Checks max withdrawable (vault liquidity)
5. Executes `vault.withdraw(amount, receiver, owner)`
6. Returns transaction hash

### Position Tracking
- Shares balance: `vault.balanceOf(walletAddress)`
- Current value: `vault.convertToAssets(shares)`
- Deposited amount: Tracked in localStorage via Zustand
- Earnings: `currentValue - deposited`

## Environment Variables

Required (already configured):
- `FACILITATOR_PRIVATE_KEY` - Private key for transaction execution
- RPC URLs in `chainsInformation.tsx`

## EIP-712 Signature Format

```typescript
// Domain
{
  name: "SparkSavings",
  version: "1",
  chainId: <chain-id>,
  verifyingContract: <vault-address>
}

// Deposit Type
{
  SavingsDeposit: [
    { name: "wallet", type: "address" },
    { name: "chain", type: "string" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" }
  ]
}
```

## Testing Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/dashboard/savings`

3. Ensure you have USDC on the selected chain

4. For testnet testing, use the chain-specific USDC faucets

## Troubleshooting

### "USDC_APPROVAL_NEEDED" Error
The user's wallet needs to approve USDC spending to the vault. This should be handled in the frontend by prompting for approval.

### "Insufficient USDC balance"
The wallet doesn't have enough USDC on the selected chain.

### "Insufficient liquidity"
The vault doesn't have enough liquidity for the requested withdrawal. Try a smaller amount or wait for more deposits.

### RPC Errors
Check the RPC URL configuration in `chainsInformation.tsx` and ensure the API key is valid.

## Security Considerations

1. **Signature Validation:** All operations require valid EIP-712 signatures
2. **Signer Verification:** Backend verifies signer matches wallet address
3. **Amount Validation:** All amounts validated for proper format and range
4. **Private Keys:** Facilitator key never exposed to frontend

## References

- [Spark.fi Documentation](https://docs.spark.fi/dev/savings/spark-vaults-v2)
- [ERC-4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)
- [Sky Savings Rate](https://sky.money/)
