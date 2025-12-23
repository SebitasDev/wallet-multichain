import { Address } from "abitype";
import { ChainKey } from "@/app/types/chain";

// ============================================
// CONFIGURACIÓN DEL FACILITADOR
// ============================================

const isDev = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const FACILITATOR_FEE_USDC = BigInt(10000); // 0.01 USDC

export const FEE_RECIPIENT: Address = process.env.FACILITATOR_FEE_RECIPIENT as Address || "0x0000000000000000000000000000000000000000";

export const FACILITATOR_ADDRESS: Address = (process.env.NEXT_PUBLIC_FACILITATOR_ADDRESS as Address) || "0x0000000000000000000000000000000000000000";
// ============================================
// RE-EXPORTAR TIPOS DE CHAINS
// ============================================

export type FacilitatorChainKey = ChainKey;

export interface FacilitatorNetworkConfig {
    chainId: number;
    chain: any;
    usdc: Address;
    usdcName: string;
    usdcVersion: string;
    domain: number;
    tokenMessenger: Address;
    messageTransmitter: Address;
    rpcUrl: string;
}

export const calculateFee = (): bigint => {
    return FACILITATOR_FEE_USDC;
};

export const calculateTotalWithFee = (amount: bigint): bigint => {
    return amount + calculateFee();
};

