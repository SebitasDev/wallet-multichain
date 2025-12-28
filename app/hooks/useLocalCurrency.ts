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
        const initializeCurrency = async () => {
            let detectedCurrency = "USD";
            let liveRate = 1;

            try {
                // 1. Detect User Location & Currency
                const locationResponse = await fetch("https://ipapi.co/json/");
                if (!locationResponse.ok) throw new Error("Location fetch failed");
                const locationData = await locationResponse.json();
                detectedCurrency = locationData.currency || "USD";
            } catch (error) {
                console.warn("Failed to detect location, defaulting to USD", error);
            }

            try {
                // 2. Fetch Live Exchange Rates (Base USD)
                if (detectedCurrency === "ARS") {
                    // Special case for Argentina: Use "Dolar Cripto" (USDT/USDC rate) for more realistic wallet value
                    // Using dolarapi.com which is specialized for Argentina's multiple rates
                    const arsResponse = await fetch("https://dolarapi.com/v1/dolares/cripto");
                    if (arsResponse.ok) {
                        const arsData = await arsResponse.json();
                        // API returns object with { compra, venta, fecha }
                        // Use 'venta' as conservative estimate or 'promedio' if available. 
                        // Actually endpoint /cripto returns { compra: number, venta: number, ... }
                        liveRate = arsData.venta || 1100;
                    } else {
                        // Fallback to official if dolarapi fails
                        throw new Error("DolarAPI failed, trying standard API");
                    }
                } else {
                    // Standard global API for other currencies
                    const ratesResponse = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
                    if (ratesResponse.ok) {
                        const ratesData = await ratesResponse.json();
                        if (ratesData.rates && ratesData.rates[detectedCurrency]) {
                            liveRate = ratesData.rates[detectedCurrency];
                        } else if (RATES[detectedCurrency]) {
                            liveRate = RATES[detectedCurrency];
                        }
                    } else {
                        liveRate = RATES[detectedCurrency] || 1;
                    }
                }
            } catch (error) {
                console.warn("Failed to fetch rates, using fallback", error);

                // Secondary Fallback Attempt for ARS if DolarAPI failed but we haven't tried global API yet?
                // For simplicity, just use hardcoded Fallback
                liveRate = RATES[detectedCurrency] || 1;
            }

            // 3. Update State
            setCurrency({
                code: detectedCurrency,
                symbol: SYMBOLS[detectedCurrency] || "$",
                rate: liveRate,
                loading: false,
            });
        };

        initializeCurrency();
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
