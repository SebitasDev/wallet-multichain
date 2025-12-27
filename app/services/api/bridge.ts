import api from "./axiosInstance";

export interface BridgeQuoteRequest {
    sourceChain: string;
    targetChain: string;
    amount: string | number;
    token: string;
    sourceToken?: string;
}

export interface BridgeQuoteResponse {
    success: boolean;
    amountSent: number;
    protocolFee: number;
    netAmountBridged: number;
    estimatedReceived: string;
    minAmount: number;
    error?: string;
}

export interface SettleRequest {
    paymentPayload: any; // Used by multiple services (CCTP, Gasless, Near), structure varies
    sourceChain: string;
    destChain: string;
    recipient: string;
    amount: string;
    destToken?: string;
    sourceToken?: string;
    senderAddress?: string;
}

export interface SettleResponse {
    success: boolean;
    txHash?: string;
    errorReason?: string;
    [key: string]: any;
}

export interface VerifyCctpRequest {
    paymentPayload: {
        authorization: {
            from: string;
            to: string;
            value: string;
            validAfter: string;
            validBefore: string;
            nonce: string;
        };
        signature: string;
        sourceChain: string;
        domainName?: string;
        domainVersion?: string;
    };
    sourceChain: string;
    destinationChain?: string;
    expectedAmount?: string;
}

export interface VerifyCctpResponse {
    isValid: boolean;
    invalidReason?: string;
}

export const bridgeApi = {
    getQuote: async (data: BridgeQuoteRequest) => {
        const response = await api.post<BridgeQuoteResponse>("/bridge/quote", data);
        return response.data;
    },

    settle: async (data: SettleRequest) => {
        const response = await api.post<SettleResponse>("/bridge/settle", data);
        return response.data;
    },

    verifyCCTP: async (data: VerifyCctpRequest) => {
        const response = await api.post<VerifyCctpResponse>("/bridge/cctp/verify", data);
        return response.data;
    },

    // Stellar endpoints mostly mirror the generic quote structure for now
    getStellarQuote: async (data: BridgeQuoteRequest) => {
        const response = await api.post<any>("/bridge/stellar", data);
        return response.data;
    },

    getStellarUSDCQuote: async (data: any) => {
        const response = await api.post<any>("/bridge/stellar/usdc", data);
        return response.data;
    },

    getStellarXLMQuote: async (data: any) => {
        const response = await api.post<any>("/bridge/stellar/xlm", data);
        return response.data;
    },

    streamUsdc: async (data: any) => {
        const response = await api.post<any>("/bridge-usdc-stream", data);
        return response.data;
    },
};
