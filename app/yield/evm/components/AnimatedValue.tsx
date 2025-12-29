"use client";

import { Typography, SxProps, Theme } from "@mui/material";
import { useStakingValue } from "../hooks/useStakingValue";

interface AnimatedValueProps {
    /** Raw value as BigInt string from blockchain (6 decimals for USDC) */
    rawValue: string;
    /** APY as percentage string (e.g. "4.00") */
    apy: string;
    /** Number of decimal places to show (default: 12 like Spark) */
    decimals?: number;
    /** Whether to show the $ prefix */
    showDollarSign?: boolean;
    /** Whether to show + prefix for positive values */
    showPlusSign?: boolean;
    /** Custom sx props for the Typography */
    sx?: SxProps<Theme>;
}

/**
 * Displays a value that animates in real-time based on APY.
 *
 * Takes raw blockchain values and animates them forward,
 * showing 12 decimals like Spark.fi does.
 */
export function AnimatedValue({
    rawValue,
    apy,
    decimals = 12,
    showDollarSign = true,
    showPlusSign = false,
    sx,
}: AnimatedValueProps) {
    // Parse APY to decimal (4.00% -> 0.04)
    const apyDecimal = parseFloat(apy) / 100;

    // Get the animated value (already converted to number)
    const animatedValue = useStakingValue(rawValue, apyDecimal);

    // Format with fixed decimals to show the animation like Spark does
    const formatValue = (value: number): string => {
        if (value === 0) return "0." + "0".repeat(decimals);

        // Always show fixed decimals so animation is visible
        return value.toFixed(decimals);
    };

    const displayValue = formatValue(animatedValue);
    const prefix = showDollarSign ? "$" : "";
    const plusPrefix = showPlusSign && animatedValue > 0 ? "+" : "";

    return (
        <Typography
            component="span"
            sx={{
                fontVariantNumeric: "tabular-nums",
                fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
                letterSpacing: "-0.02em",
                ...sx,
            }}
        >
            {plusPrefix}{prefix}{displayValue}
        </Typography>
    );
}
