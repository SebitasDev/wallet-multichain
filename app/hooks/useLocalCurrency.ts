"use client";

import { useEffect, useRef } from "react";
import { useCurrencyStore } from "@/app/store/useCurrencyStore";

export function useLocalCurrency() {
    const { code, symbol, rate, loading, fetchCurrency } = useCurrencyStore();
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchCurrency();
        }
    }, [fetchCurrency]);

    const formatAmount = (usdAmount: number) => {
        const converted = usdAmount * rate;
        // Format appropriately based on the value size
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(converted);
    };

    const formatParts = (usdAmount: number) => {
        const converted = usdAmount * rate;
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).formatToParts(converted);
    };

    return { code, symbol, rate, loading, formatAmount, formatParts };
}
