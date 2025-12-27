import api from "./axiosInstance";

export interface DepositRequest {
    chain: string;
    amount: string;
    walletAddress: string;
    privateKey: string;
}

export interface DepositResponse {
    success: boolean;
    transactionHash?: string;
    shares?: string;
    errorReason?: string;
}

export interface WithdrawRequest {
    chain: string;
    amount: string;
    walletAddress: string;
    privateKey: string;
}

export interface WithdrawResponse {
    success: boolean;
    transactionHash?: string;
    usdcAmount?: string;
    errorReason?: string;
}

export const savingsApi = {
    deposit: async (data: DepositRequest) => {
        const response = await api.post<DepositResponse>("/savings/deposit", data);
        return response.data;
    },

    withdraw: async (data: WithdrawRequest) => {
        const response = await api.post<WithdrawResponse>("/savings/withdraw", data);
        return response.data;
    },

    getPositions: async (walletAddress: string) => {
        const response = await api.get(`/savings/positions/${walletAddress}`);
        return response.data;
    },
};
