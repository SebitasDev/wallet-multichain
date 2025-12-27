import { useState, useEffect } from "react";

/**
 * Extrapolates the growth of an invested amount based on APY.
 * Returns a value that updates every 100ms to simulate real-time interest.
 * Includes "catch-up" logic based on ledger timestamp to prevent reset on refresh.
 */
export const useLiveBalance = (invested: number, apy: number, timestamp?: number) => {
    const [animatedInvested, setAnimatedInvested] = useState(invested);

    // Sync state when source data changes (e.g. after a fresh fetch)
    useEffect(() => {
        if (!timestamp || invested <= 0 || apy <= 0) {
            setAnimatedInvested(invested);
            return;
        }

        // Catch-up logic: Calculate accrued interest since the last ledger update
        const nowSeconds = Math.floor(Date.now() / 1000);
        const secondsSinceUpdate = Math.max(0, nowSeconds - timestamp);
        const ratePerSecond = (apy / 100) / 31536000;
        const catchUpInterest = invested * ratePerSecond * secondsSinceUpdate;

        setAnimatedInvested(invested + catchUpInterest);
    }, [invested, timestamp, apy]);

    // Live animation loop
    useEffect(() => {
        if (invested <= 0 || apy <= 0) return;

        const interval = setInterval(() => {
            const ratePerSecond = (apy / 100) / 31536000;
            const ratePer100ms = ratePerSecond / 10;
            setAnimatedInvested(prev => prev * (1 + ratePer100ms));
        }, 100);

        return () => clearInterval(interval);
    }, [invested, apy]);

    return animatedInvested;
};
