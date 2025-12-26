"use client";

import { useState, useEffect } from "react";

interface CurrencyState {
    code: string;
    symbol: string;
    rate: number;
    loading: boolean;
}

const RATES: Record<string, number> = {
    USD: 1,
    ARS: 1040,      // Argentina
    EUR: 0.92,      // Europe
    BRL: 5.0,       // Brazil
    COP: 3900,      // Colombia
    MXN: 17,        // Mexico
    CLP: 950,       // Chile
    PEN: 3.7,       // Peru
    UYU: 39,        // Uruguay
    VES: 36,        // Venezuela
    BOB: 6.9,       // Bolivia
    GTQ: 7.8,       // Guatemala
    HNL: 24.7,      // Honduras
    NIO: 36.8,      // Nicaragua
    CRC: 515,       // Costa Rica
    DOP: 59,        // Dominican Republic
    PYG: 7280,      // Paraguay
};

const SYMBOLS: Record<string, string> = {
    USD: "$",
    ARS: "$",
    EUR: "€",
    BRL: "R$",
    COP: "$",
    MXN: "$",
    CLP: "$",
    PEN: "S/",
    UYU: "$",
    VES: "Bs.",
    BOB: "Bs.",
    GTQ: "Q",
    HNL: "L",
    NIO: "C$",
    CRC: "₡",
    DOP: "RD$",
    PYG: "₲",
};

export function useLocalCurrency() {
    const [currency, setCurrency] = useState<CurrencyState>({
        code: "USD",
        symbol: "$",
        rate: 1,
        loading: true,
    });

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                // Using ipapi.co for simple IP geolocation
                const response = await fetch("https://ipapi.co/json/");
                const data = await response.json();
                const detectedCurrency = data.currency || "USD";

                // If we have a hardcoded rate for this currency, use it. Otherwise fallback to USD.
                if (RATES[detectedCurrency]) {
                    setCurrency({
                        code: detectedCurrency,
                        symbol: SYMBOLS[detectedCurrency] || "$",
                        rate: RATES[detectedCurrency],
                        loading: false,
                    });
                } else {
                    setCurrency({
                        code: "USD",
                        symbol: "$",
                        rate: 1,
                        loading: false,
                    });
                }
            } catch (error) {
                console.error("Failed to detect location:", error);
                setCurrency({
                    code: "USD",
                    symbol: "$",
                    rate: 1,
                    loading: false,
                });
            }
        };

        fetchLocation();
    }, []);

    const formatAmount = (usdAmount: number) => {
        const converted = usdAmount * currency.rate;
        // Format appropriately based on the value size
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currency.code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(converted);
    };

    const formatParts = (usdAmount: number) => {
        const converted = usdAmount * currency.rate;
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currency.code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).formatToParts(converted);
    };

    return { ...currency, formatAmount, formatParts };
}
