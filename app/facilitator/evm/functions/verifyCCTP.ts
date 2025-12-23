import { FacilitatorChainKey } from "@/app/facilitator/config";
import { FacilitatorPaymentPayload, VerifyResponse } from "@/app/facilitator/types";

export const verifyCCTP = async (
    paymentPayload: FacilitatorPaymentPayload,
    sourceChain: FacilitatorChainKey,
    amount: string,
    destinationChain?: FacilitatorChainKey
): Promise<VerifyResponse> => {
    // Calls the new specific endpoint for CCTP verification
    const response = await fetch("/api/bridge/cctp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            paymentPayload,
            sourceChain,
            destinationChain,
            expectedAmount: amount
        })
    });

    return response.json();
};
