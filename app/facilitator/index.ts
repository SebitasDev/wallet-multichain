// Facilitador - Sistema de pagos gasless con transferWithAuthorization (ERC-3009)
// y soporte para cross-chain via Circle CCTP

// Configuración
export {
    FACILITATOR_FEE_USDC,
    FEE_RECIPIENT,
    calculateFee,
    calculateTotalWithFee,
    type FacilitatorChainKey,
    type FacilitatorNetworkConfig
} from "./config";

export {
    FACILITATOR_NETWORKS,
    getNetworkByChainId
} from "./evm/config";

// Tipos
export type {
    TransferAuthorization,
    SignatureComponents,
    FacilitatorPaymentPayload,
    CrossChainConfig,
    VerifyRequest,
    VerifyResponse,
    SettleDirectRequest,
    SettleCrossChainRequest,
    SettleResponse,
    CrossChainStatus
} from "./types";

// ABIs
export {
    usdcErc3009Abi,
    TransferWithAuthorizationTypes,
    ReceiveWithAuthorizationTypes
} from "./evm/usdcErc3009Abi";

export {
    tokenMessengerAbi,
    messageTransmitterAbi
} from "./evm/cctpAbi";

// Hook del cliente
// Export types or other configs if present
export * from "./config";
export * from "./types";
