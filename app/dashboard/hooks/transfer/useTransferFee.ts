import { useMemo } from "react";

export const useTransferFee = (
    amount: string | undefined,
    sourceChain: string,
    destChain: string,
    sourceToken: string,
    destToken: string,
    tokenPrice: number | undefined
) => {
    return useMemo(() => {
        if (process.env.NEXT_PUBLIC_ENVIROMENT === "development" || process.env.NODE_ENV === "development") return { fee: "0.00", total: "0.00" };
        if (!amount) return { fee: "0.00", total: "0.00" };

        const amountFloat = parseFloat(amount || "0");

        // Same-Chain Native Transfer = Free
        if (sourceChain === destChain && sourceToken === destToken) {
            return {
                fee: "0.00",
                total: amountFloat.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                    useGrouping: false
                })
            };
        }

        let usdFee = 0.02; // Default Cross-chain
        let feeStr = "0.00";

        // If dealing with USDC, fee is just the USD amount
        const isUSDC = sourceToken.includes("USDC");
        if (isUSDC) {
            feeStr = usdFee.toFixed(2);
        } else if (tokenPrice && tokenPrice > 0) {
            // If Native/Other, convert USD fee to Token Amount
            const nativeFee = usdFee / tokenPrice;
            // Return with high precision for crypto
            feeStr = nativeFee.toFixed(8); // e.g. 0.000033 BNB
        } else {
            // Fallback
            feeStr = "0.00";
        }

        const feeVal = parseFloat(feeStr);
        const totalVal = amountFloat + feeVal;

        const totalStr = totalVal.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
            useGrouping: false
        });

        return { fee: feeStr, total: totalStr };

    }, [amount, destChain, sourceChain, sourceToken, destToken, tokenPrice]);
};
