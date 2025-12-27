import api from "./axiosInstance";

export interface GaslessPayRequest {
    chain: string;
    amount: string | number;
    recipient: string;
    payload: any;
}

export interface GaslessPayResponse {
    success?: boolean;
    txHash?: string;
    error?: string;
    [key: string]: any;
}

export interface NotifyRequest {
    type: string;
    message: string;
    [key: string]: any;
}

export const miscApi = {
    debugHistory: async (data: any) => {
        const response = await api.post("/debug-history", data);
        return response.data;
    },

    getLocation: async () => {
        const response = await api.get("/location");
        return response.data;
    },

    notify: async (data: NotifyRequest) => {
        const response = await api.post("/notify", data);
        return response.data;
    },

    payGasless: async (data: GaslessPayRequest) => {
        const response = await api.post<GaslessPayResponse>("/pay/gasless", data);
        return response.data;
    },

    proxySoroban: async (data: any) => {
        const response = await api.post("/proxy-soroban", data);
        return response.data;
    },

    getGlobalStats: async () => {
        const response = await api.get("/stats/global");
        return response.data;
    },


};
