import { Address } from "abitype";
import { TransferWithAuthorizationTypes } from "@/app/facilitator/usdcErc3009Abi"; // Reuse ABI from facilitator

// Re-export common types
export { TransferWithAuthorizationTypes };

export interface StellarBridgePayload {
    paymentPayload: {
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
    amount: string;
    recipientStellar: string; // Stellar recipient address
}

export interface StellarBridgeResponse {
    success: boolean;
    transactionHash?: string;
    errorReason?: string;
}
