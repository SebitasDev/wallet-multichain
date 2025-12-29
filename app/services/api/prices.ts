import axios from "axios";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

export const pricesApi = {
    getPrices: async (ids: string[]) => {
        try {
            if (!ids.length) return {};

            const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
                params: {
                    ids: ids.join(","),
                    vs_currencies: "usd"
                }
            });

            return response.data;
        } catch (error) {
            console.error("Failed to fetch prices:", error);
            return {};
        }
    }
};
