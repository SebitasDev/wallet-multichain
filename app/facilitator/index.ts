// Facilitador - Sistema de pagos gasless con transferWithAuthorization (ERC-3009)
// y soporte para cross-chain via Circle CCTP

// Configuración
export {
    FACILITATOR_FEE_USDC,
    FEE_RECIPIENT,
    FACILITATOR_NETWORKS,
    getNetworkByChainId,
    calculateFee,
    calculateTotalWithFee,
    type FacilitatorChainKey,
    type FacilitatorNetworkConfig
} from "./config";

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
} from "./usdcErc3009Abi";

export {
    tokenMessengerAbi,
    messageTransmitterAbi
} from "./cctpAbi";

// Hook del cliente
export { useFacilitator } from "./hooks/useFacilitator";
