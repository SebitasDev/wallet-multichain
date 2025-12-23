import { FacilitatorChainKey } from "@/app/facilitator/config";
import { FacilitatorPaymentPayload, SettleResponse } from "@/app/facilitator/types";
import { Address } from "abitype";

export const settleGaslessTransfer = async (
    paymentPayload: FacilitatorPaymentPayload,
    sourceChain: FacilitatorChainKey,
    amount: string,
    recipient: Address
): Promise<SettleResponse> => {
    // Calls the new specific endpoint for Same-Chain Gasless Transfer
    const response = await fetch("/api/transfer/gasless", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            paymentPayload,
            sourceChain,
            amount,
            recipient
        })
    });

    return response.json();
};
