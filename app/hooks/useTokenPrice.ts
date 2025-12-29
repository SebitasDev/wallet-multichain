import { useState, useEffect } from "react";
import { pricesApi } from "@/app/services/api";

export const useTokenPrice = (coingeckoId?: string) => {
    const [price, setPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!coingeckoId) {
            setPrice(null);
            return;
        }

        const fetchPrice = async () => {
            setLoading(true);
            try {
                const data = await pricesApi.getPrices([coingeckoId]);
                if (data[coingeckoId]?.usd) {
                    setPrice(data[coingeckoId].usd);
                }
            } catch (error) {
                console.error("Error fetching price:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrice();
        // Calculate refresh every 60s could be added here
    }, [coingeckoId]);

    return { price, loading };
};
