import { Typography, Box } from "@mui/material";

interface SplitBalanceProps {
    amount: number;
    mainFontSize?: object | string | number;
    smallFontSize?: object | string | number;
}

export const SplitBalance = ({
    amount,
    mainFontSize,
    smallFontSize
}: SplitBalanceProps) => {
    // 1. Format to string with high precision (e.g. 6 decimals) to capture all significant digits
    // We use maximumFractionDigits: 6 to avoid scientific notation for small numbers
    // but not too many garbage digits.
    const fullString = amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    });

    // Clean currency string if needed or just use number logic.
    // Standard "en-US" currency: "$1,234.5678"
    // We want Main: "$1,234.56" and Small: "78"

    // Regex to capture:
    // Group 1: Everything up to the second decimal digit
    // Group 2: The rest of the digits
    const match = fullString.match(/^(\$?[0-9,]+\.[0-9]{2})([0-9]*)$/);

    const mainPart = match ? match[1] : fullString;
    const smallPart = match ? match[2] : "";

    return (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "baseline" }}>
            <Typography
                component="span"
                sx={{
                    fontSize: mainFontSize || { xs: 32, sm: 38, md: 44 },
                    fontWeight: 900,
                    lineHeight: 1,
                    color: "#000000",
                }}
            >
                {mainPart}
            </Typography>
            {smallPart && (
                <Typography
                    component="span"
                    sx={{
                        fontSize: smallFontSize || { xs: 18, sm: 22, md: 26 }, // ~50-60% of main
                        fontWeight: 700,
                        lineHeight: 1,
                        color: "#999999",
                        ml: 0.2
                    }}
                >
                    {smallPart}
                </Typography>
            )}
        </Box>
    );
};
