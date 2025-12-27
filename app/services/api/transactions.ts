import api from "./axiosInstance";

export interface CreateTransactionRequest {
    id: string;
    fromAddress: string;
    toAddress: string;
    totalAmount: string;
    destinationChain: string;
    token?: string;
    [key: string]: any;
}

export interface GetTransactionsParams {
    address?: string;
    page?: number;
    limit?: number;
}

export interface TransactionResponse {
    success: boolean;
    transaction?: any;
    transactions?: any[];
    pagination?: {
        total: number;
        totalPages: number;
        page: number;
        limit: number;
    };
    error?: string;
}

export const transactionsApi = {
    create: async (data: CreateTransactionRequest) => {
        const response = await api.post<TransactionResponse>("/transactions", data);
        return response.data;
    },

    update: async (data: { id: string; status?: string; route?: any[] }) => {
        const response = await api.put<TransactionResponse>("/transactions", data);
        return response.data;
    },

    getAll: async (params?: GetTransactionsParams) => {
        const response = await api.get<TransactionResponse>("/transactions", { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/transactions/${id}`);
        return response.data;
    },

    getStats: async (params?: any) => {
        const response = await api.get("/transactions/stats", { params });
        return response.data;
    },
};
