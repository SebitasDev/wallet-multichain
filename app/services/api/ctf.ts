import api from "./axiosInstance";

export interface CreateGameRequest {
    address: string;
    creator: string;
    captureFee: string;
    duration: number;
    txHash: string;
    rewardAmount?: string;
}

export interface CreateGameResponse {
    success?: boolean;
    game?: any;
    error?: string;
}

export interface CaptureRequest {
    gameAddress: string;
    newHolder: string;
    txHash: string;
    type?: "CAPTURE" | "JOIN";
    previousHolder?: string;
    amount?: string;
}

export interface CaptureResponse {
    success?: boolean;
    error?: string;
}

export interface ListGamesParams {
    page?: number;
    limit?: number;
}

export interface ListGamesResponse {
    games: any[];
    metadata: {
        total: number;
        page: number;
        totalPages: number;
        hasMore: boolean;
    };
    error?: string;
}

export const ctfApi = {
    createGame: async (data: CreateGameRequest) => {
        const response = await api.post<CreateGameResponse>("/ctf/create", data);
        return response.data;
    },

    capture: async (data: CaptureRequest) => {
        const response = await api.post<CaptureResponse>("/ctf/capture", data);
        return response.data;
    },

    listGames: async (params?: ListGamesParams) => {
        const response = await api.get<ListGamesResponse>("/ctf/list", { params });
        return response.data;
    },

    getGameDetails: async (gameAddress: string, userAddress?: string) => {
        const params: any = { gameAddress };
        if (userAddress) params.userAddress = userAddress;

        const response = await api.get("/ctf/game-details", { params });
        return response.data;
    },

    getGamesMetadata: async () => {
        const response = await api.get("/ctf/games-metadata");
        return response.data;
    },

    getLeaderboard: async () => {
        const response = await api.get("/ctf/leaderboard");
        return response.data;
    },

    getProfile: async (userAddress: string) => {
        const response = await api.get("/ctf/profile", { params: { userAddress } });
        return response.data;
    },
};
