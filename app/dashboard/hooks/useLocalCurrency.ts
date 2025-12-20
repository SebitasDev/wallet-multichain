"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/app/utils/formatCurrency";

interface CurrencyState {
    code: string; // e.g., "MXN", "COP"
    rate: number; // e.g., 20.5
    symbol?: string; // e.g. "$"
    isLoading: boolean;
}

export const useLocalCurrency = () => {
    const [currency, setCurrency] = useState<CurrencyState>({
        code: "USD",
        rate: 1,
        isLoading: true,
    });

    useEffect(() => {
        const fetchLocalData = async () => {
            try {
                // 1. Get User's Currency Code via IP
                let currencyCode = "USD";
                try {
                    // Call our internal API proxy to avoid CORS
                    const ipRes = await fetch("/api/location");

                    if (ipRes.ok) {
                        const ipData = await ipRes.json();
                        console.log("Local Currency Debug - IP Data:", ipData); // Debug log
                        currencyCode = ipData.currency || "USD";
                    }
                } catch (e) {
                    console.warn("Failed to fetch location data (proxy), defaulting to USD.", e);
                }

                // Removed early return for USD to allow debugging/verification
                // if (currencyCode === "USD") { ... }

                // 2. Get Exchange Rate (USD -> Local)
                try {
                    const rateRes = await fetch("https://open.er-api.com/v6/latest/USD");
                    const rateData = await rateRes.json();
                    const rate = rateData.rates[currencyCode];

                    console.log(`Local Currency Debug - Code: ${currencyCode}, Rate: ${rate}`); // Debug log

                    if (rate) {
                        setCurrency({
                            code: currencyCode,
                            rate,
                            isLoading: false,
                        });
                    } else {
                        setCurrency({ code: "USD", rate: 1, isLoading: false });
                    }
                } catch (err) {
                    console.warn("Failed to fetch exchange rate", err);
                    setCurrency({ code: "USD", rate: 1, isLoading: false });
                }

            } catch (error) {
                console.error("Critical error in useLocalCurrency:", error);
                setCurrency({ code: "USD", rate: 1, isLoading: false });
            }
        };

        fetchLocalData();
    }, []);

    const convert = (usdAmount: number) => {
        return usdAmount * currency.rate;
    };

    const formatConvert = (usdAmount: number) => {
        const converted = convert(usdAmount);
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency.code,
            minimumFractionDigits: 2,
        }).format(converted);
    };

    return {
        currencyCode: currency.code,
        formattedWithCode: (usdAmount: number) => {
            if (currency.isLoading) return null; // Only hide on loading
            return `≈ ${formatConvert(usdAmount)}`;
        },
        isLoading: currency.isLoading,
    };
};
