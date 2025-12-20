# implementation_plan.md

## Goal Description
Automate the Stellar -> Base (EVM) transfer flow. Instead of displaying deposit instructions for the user to execute manually, the **Facilitator Backend** will sign and submit the Stellar transaction using a private key provided in the environment variables.

## User Review Required
> [!IMPORTANT]
> This change makes the backend **custodial** for the source funds on Stellar. It effectively assumes the "Facilitator" holds the funds and sends them on behalf of the user/app.
> The environment variable for the private key must be set: `FACILITATOR_STELLAR_PRIVATE_KEY`.

## Proposed Changes

### Configuration
#### [NEW] [.env.local](file:///Users/sebastianramirezgarcua/WebstormProjects/multichain-wallet/my-app/.env.local)
- Add `FACILITATOR_STELLAR_PRIVATE_KEY` (User will add this).

### API Endpoint (`app/api/bridge-stellar/route.ts`)
#### [MODIFY] [route.ts](file:///Users/sebastianramirezgarcua/WebstormProjects/multichain-wallet/my-app/app/api/bridge-stellar/route.ts)
- Import `stellar-sdk` components (`Keypair`, `TransactionBuilder`, `Networks`, `Server`, `Asset`, `Operation`).
- Read `FACILITATOR_STELLAR_PRIVATE_KEY` from env.
- logic flow for `sourceChain === "Stellar"`:
    1.  Get 1-Click Quote (as before) to get `depositAddress` and `memo`.
    2.  Check if `FACILITATOR_STELLAR_PRIVATE_KEY` is present.
    3.  Load Stellar Keypair.
    4.  Initialize Horizon Server (`STELLAR.serverURL`).
    5.  Load source account sequence.
    6.  Build Transaction: `Payment` of `amount` USDC to `depositAddress` with `memo`.
    7.  Sign & Submit.
    8.  Return `success: true` and `txHash`.

### Frontend Hooks (`app/facilitator/hooks/useFacilitator.ts`)
#### [MODIFY] [useFacilitator.ts](file:///Users/sebastianramirezgarcua/WebstormProjects/multichain-wallet/my-app/app/facilitator/hooks/useFacilitator.ts)
- Update `transferFromStellar` to expect a direct success response (tx hash) instead of just deposit info (though it might still return it for logging).
- The return type logic needs to handle "Success (Automated)" vs "Instructions (Manual)". Since we are pivoting to full automation, we treat it as a success flow.

### Frontend UI (`app/dashboard/hooks/useCrossChainTransfer.ts` & `index.tsx`)
#### [MODIFY] [useCrossChainTransfer.ts](file:///Users/sebastianramirezgarcua/WebstormProjects/multichain-wallet/my-app/app/dashboard/hooks/useCrossChainTransfer.ts)
- Remove `depositInfo` state setting logic.
- On success of `transferFromStellar`, show a success Toast ("Transfer executed by facilitator! TX: ...") and close the modal.

#### [MODIFY] [index.tsx](file:///Users/sebastianramirezgarcua/WebstormProjects/multichain-wallet/my-app/app/dashboard/components/CrossChainTransferModal/index.tsx)
- Revert/Remove the "Deposit Instructions" conditional rendering since it's no longer needed (or keep it as fallback if we want hybrid, but request implies replacement).

## Verification Plan
### Manual Verification
1.  **Mock Test**: Since we likely don't have a valid funded Stellar Private Key in this dev env, we will implement the logic and verify the code structure.
2.  **Dry Run**: The user will verify by adding their key and testing.
