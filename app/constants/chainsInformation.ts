import {Address} from "abitype";
import {arbitrumSepolia, baseSepolia, optimismSepolia} from "viem/chains";

export type ChainKey = "Optimism_Sepolia" | "Arbitrum_Sepolia" | "Base_Sepolia";

interface ChainConfig {
    usdc: Address;
    chain: any;
    domain: number;
    aproxFromFee: number;
}

export const NETWORKS: Record<ChainKey, ChainConfig> = {
    Optimism_Sepolia: {
        usdc: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
        chain: optimismSepolia,
        domain: 2,
        aproxFromFee: 0.0025
    },

    Arbitrum_Sepolia: {
        usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
        chain: arbitrumSepolia,
        domain: 3,
        aproxFromFee: 0.04
    },

    Base_Sepolia: {
        usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        chain: baseSepolia,
        domain: 6,
        aproxFromFee: 0.003
    },
};
