import { ChainKey } from "@/app/types/chain";
import { SettleResponse, FacilitatorPaymentPayload } from "@/app/facilitator/types";

export interface BridgeContext {
    paymentPayload: FacilitatorPaymentPayload;
    sourceChain: ChainKey;
    destChain: ChainKey;
    sourceToken?: string;
    destToken?: string;
    amount: string;
    recipient: string;
    senderAddress?: string;
    privateKey?: string;
}


export interface BridgeStrategy {
    name: string;
    canHandle(context: BridgeContext): boolean;
    execute(context: BridgeContext): Promise<SettleResponse>;
}
