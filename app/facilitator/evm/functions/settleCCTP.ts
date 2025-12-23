import { FacilitatorChainKey } from "@/app/facilitator/config";
import { FacilitatorPaymentPayload, CrossChainConfig, SettleResponse } from "@/app/facilitator/types";

export const settleCCTP = async (
    paymentPayload: FacilitatorPaymentPayload,
    sourceChain: FacilitatorChainKey,
    amount: string,
    crossChainConfig: CrossChainConfig
): Promise<SettleResponse> => {
    // Calls the new specific endpoint for CCTP settlement
    const response = await fetch("/api/bridge/cctp/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            paymentPayload,
            sourceChain,
            amount,
            crossChainConfig
        })
    });

    return response.json();
};
