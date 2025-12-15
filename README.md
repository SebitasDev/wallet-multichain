# MultiChain Wallet

Modern dashboard and landing page for managing multichain wallets, integrated with Spark.fi for savings and advanced cross-chain capabilities.

### Key Features
- **Multichain Dashboard**: Manage assets across multiple chains (Base, Optimism, Arbitrum, Unichain, etc.).
- **USDC Savings**: Earn yield on your USDC using Spark.fi sUSDC vaults (ERC-4626 standard).
- **Cross-Chain Bridge**: Seamlessly bridge USDC across supported networks.
- **Smart Wallet Features**: Built with Account Abstraction (Bundlers, Paymasters) in mind.

### Requirements
- Node 18+
- pnpm or npm

### Installation
```bash
pnpm install   # or npm install
```

### Useful Scripts
- `pnpm dev` — Start development server.
- `pnpm lint` — Run linter.

### Project Structure
- `app/page.tsx` — Main Landing Page.
- `app/dashboard/page.tsx` — Main Dashboard view.
- `app/dashboard/savings/` — Savings management interface (Spark.fi integration).
- `app/cross-chain-core/` — Core logic for cross-chain transfers and smart wallet factories.
- `app/api/` — API Endpoints to support savings, facilitators, and bridging.

### Environment Variables
Create a `.env.local` file in the root directory and configure the necessary keys (e.g., Circle API, Bundler URLs, Facilitator keys).

### UI/UX Notes
- **Theme**: Dark mode with gradients and rounded aesthetics.
- **Tech Stack**: Next.js (App Router), Material UI, Framer Motion, Zustand.

### Common Issues
- **Hydration Mismatch**: Ensure no random values are generated during SSR without proper handling.
- **API Errors**: Verify that all environment variables are correctly set and that you are on the correct network.
