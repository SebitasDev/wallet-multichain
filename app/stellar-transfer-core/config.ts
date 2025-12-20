import { Address } from "abitype";
import { TransferWithAuthorizationTypes } from "@/app/facilitator/usdcErc3009Abi"; // Reuse ABI from facilitator

// Re-export common types
export { TransferWithAuthorizationTypes };

export interface StellarBridgePayload {
    paymentPayload?: {
        authorization: {
            from: Address;
            to: Address;
            value: string;
            validAfter: string;
            validBefore: string;
            nonce: string;
        };
        signature: `0x${string}`;
    };
    sourceChain: string;
    targetChain?: string;
    amount: string;
    recipientStellar?: string; // For EVM->Stellar
    recipientOther?: string;   // For Stellar->EVM (Base)
    signedXDR?: string; // User -> Facilitator Funding TX
}

export interface StellarBridgeResponse {
    success: boolean;
    transactionHash?: string;
    depositAddress?: string;
    memo?: string;
    errorReason?: string;
}
