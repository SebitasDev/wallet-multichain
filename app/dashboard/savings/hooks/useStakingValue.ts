import { useEffect, useRef, useState } from "react";

/**
 * Hook that animates a staking value in real-time based on APY.
 *
 * The blockchain already calculates accrued interest via convertToAssets().
 * This hook simply animates the value from the current blockchain value
 * going forward, creating the visual effect of earnings incrementing.
 *
 * @param rawValue - The value from blockchain as BigInt string (6 decimals for USDC)
 * @param apy - Annual Percentage Yield as decimal (e.g. 0.045 for 4.5%)
 * @returns The animated value as a number
 */
export function useStakingValue(
    rawValue: string,
    apy: number
): number {
    // Convert raw BigInt string (6 decimals) to number
    const parseRawValue = (raw: string): number => {
        const bigIntValue = BigInt(raw || "0");
        // USDC has 6 decimals
        return Number(bigIntValue) / 1_000_000;
    };

    const baseValue = parseRawValue(rawValue);
    const [displayValue, setDisplayValue] = useState<number>(baseValue);
    const animationRef = useRef<number | null>(null);
    const lastFrameRef = useRef<number>(performance.now());
    const currentValueRef = useRef<number>(baseValue);
    const rawValueRef = useRef<string>(rawValue);

    // Sync when blockchain value changes
    useEffect(() => {
        if (rawValue !== rawValueRef.current) {
            const newValue = parseRawValue(rawValue);
            currentValueRef.current = newValue;
            rawValueRef.current = rawValue;
            setDisplayValue(newValue);
            lastFrameRef.current = performance.now();
        }
    }, [rawValue]);

    // Animation loop - animates from current value forward
    useEffect(() => {
        if (baseValue <= 0 || apy <= 0) {
            return;
        }

        // Rate per millisecond
        const millisecondsPerYear = 365 * 24 * 60 * 60 * 1000;
        const ratePerMs = apy / millisecondsPerYear;

        const animate = () => {
            const now = performance.now();
            const elapsed = now - lastFrameRef.current;
            lastFrameRef.current = now;

            // Calculate growth for this frame
            const growth = currentValueRef.current * ratePerMs * elapsed;
            currentValueRef.current = currentValueRef.current + growth;

            setDisplayValue(currentValueRef.current);

            animationRef.current = requestAnimationFrame(animate);
        };

        // Start animation
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [baseValue, apy]);

    return displayValue;
}
