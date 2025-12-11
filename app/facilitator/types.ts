import { Address } from "abitype";
import { FacilitatorChainKey } from "./config";

// ============================================
// TIPOS PARA EL FACILITADOR
// ============================================

// Autorización ERC-3009 que el usuario firma
export interface TransferAuthorization {
    from: Address;
    to: Address;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: `0x${string}`;
}

// Firma desglosada (v, r, s)
export interface SignatureComponents {
    v: number;
    r: `0x${string}`;
    s: `0x${string}`;
}

// Payload completo del pago
export interface FacilitatorPaymentPayload {
    authorization: TransferAuthorization;
    signature: `0x${string}`;
}

// Configuración de cross-chain
export interface CrossChainConfig {
    destinationChain: FacilitatorChainKey;
    destinationDomain: number;
    mintRecipient: Address;
}

// Request para verify
export interface VerifyRequest {
    paymentPayload: FacilitatorPaymentPayload;
    sourceChain: FacilitatorChainKey;
    expectedAmount: string;
}

// Response de verify
export interface VerifyResponse {
    isValid: boolean;
    payer?: Address;
    invalidReason?: string;
    fee?: string;
    netAmount?: string;
}

// Request para settle (transfer directo)
export interface SettleDirectRequest {
    paymentPayload: FacilitatorPaymentPayload;
    sourceChain: FacilitatorChainKey;
    recipient: Address;
    amount: string;
}

// Request para settle (cross-chain)
export interface SettleCrossChainRequest {
    paymentPayload: FacilitatorPaymentPayload;
    sourceChain: FacilitatorChainKey;
    crossChainConfig: CrossChainConfig;
    amount: string;
}

// Response de settle
export interface SettleResponse {
    success: boolean;
    transactionHash?: `0x${string}`;
    burnTransactionHash?: `0x${string}`;
    payer?: Address;
    fee?: string;
    netAmount?: string;
    errorReason?: string;
    // Para cross-chain
    attestation?: {
        message: `0x${string}`;
        attestation: `0x${string}`;
    };
}

// Estado del bridge cross-chain
export interface CrossChainStatus {
    status: "pending" | "burning" | "waiting_attestation" | "completed" | "failed";
    burnTxHash?: `0x${string}`;
    attestation?: {
        message: `0x${string}`;
        attestation: `0x${string}`;
    };
    error?: string;
}
