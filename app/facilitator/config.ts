import { Address } from "abitype";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";

// ============================================
// CONFIGURACIÓN DEL FACILITADOR
// ============================================

const isDev = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

// Comisión del facilitador (en USDC con 6 decimales)
// 0.01 USDC = 10000 (6 decimales)
export const FACILITATOR_FEE_USDC = BigInt(10000); // 0.01 USDC

// Dirección que recibe las comisiones
export const FEE_RECIPIENT: Address = process.env.FACILITATOR_FEE_RECIPIENT as Address || "0x0000000000000000000000000000000000000000";

// ============================================
// CCTP CONTRACTS (Circle Cross-Chain Transfer Protocol)
// Los mismos para todas las chains en cada ambiente
// ============================================

export const CCTP_CONTRACTS = {
    tokenMessenger: {
        mainnet: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d" as Address,
        testnet: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as Address
    },
    messageTransmitter: {
        mainnet: "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64" as Address,
        testnet: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as Address
    }
};

// Obtener TokenMessenger según ambiente
export const getTokenMessenger = (): Address => {
    return isDev ? CCTP_CONTRACTS.tokenMessenger.testnet : CCTP_CONTRACTS.tokenMessenger.mainnet;
};

// Obtener MessageTransmitter según ambiente
export const getMessageTransmitter = (): Address => {
    return isDev ? CCTP_CONTRACTS.messageTransmitter.testnet : CCTP_CONTRACTS.messageTransmitter.mainnet;
};

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

// ============================================
// CONSTRUIR CONFIG DEL FACILITADOR DESDE chainsInformation
// ============================================

const buildFacilitatorNetworks = (): Record<FacilitatorChainKey, FacilitatorNetworkConfig> => {
    const tokenMessenger = getTokenMessenger();
    const messageTransmitter = getMessageTransmitter();

    const result: Partial<Record<FacilitatorChainKey, FacilitatorNetworkConfig>> = {};

    for (const [key, config] of Object.entries(NETWORKS)) {
        const chainKey = key as FacilitatorChainKey;

        // Skip non-EVM chains or chains without CCTP domain
        if (!config.evm || !config.crossChainInformation.circleInformation?.cCTPInformation) continue;

        const cctpInfo = config.crossChainInformation.circleInformation.cCTPInformation;

        // Determinar el nombre de USDC según la chain
        let usdcName = "USD Coin";
        if (chainKey === "Base" && isDev) {
            usdcName = "USDC"; // Base Sepolia usa "USDC"
        }

        const usdcAddress = config.assets.find(a => a.name === "USDC")?.address;
        if (!usdcAddress) continue; // Should have USDC

        result[chainKey] = {
            chainId: config.evm.chain.id,
            chain: config.evm.chain,
            usdc: usdcAddress as Address,
            usdcName,
            usdcVersion: "2",
            domain: cctpInfo.domain,
            tokenMessenger,
            messageTransmitter,
            rpcUrl: config.evm.rpcUrl || ""
        };
    }

    return result as Record<FacilitatorChainKey, FacilitatorNetworkConfig>;
};

export const FACILITATOR_NETWORKS = buildFacilitatorNetworks();

// Helper para obtener config por chainId
export const getNetworkByChainId = (chainId: number): FacilitatorNetworkConfig | undefined => {
    return Object.values(FACILITATOR_NETWORKS).find(n => n.chainId === chainId);
};

// Helper para calcular fee (siempre 0.01 USDC fijo)
export const calculateFee = (): bigint => {
    return FACILITATOR_FEE_USDC;
};

// Helper para calcular monto total (amount + fee)
export const calculateTotalWithFee = (amount: bigint): bigint => {
    return amount + calculateFee();
};
