import {Address} from "abitype";
import {arbitrumSepolia, baseSepolia, optimismSepolia, unichainSepolia} from "viem/chains";
import {JSX} from "react";
import {OPIcon} from "@/app/components/atoms/OPIcon";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import {BaseIcon} from "@/app/components/atoms/BaseIcon";
import z from "zod";
import {UnichainIcon} from "@/app/components/atoms/UnichainIcon";

export const ChainKeyEnum = z.enum([
    "Optimism_Sepolia",
    "Arbitrum_Sepolia",
    "Base_Sepolia",
    "Unichain_Sepolia",
]);

export type ChainKey = z.infer<typeof ChainKeyEnum>;

export interface ChainConfig {
    usdc: Address;
    chain: any;
    domain: number;
    aproxFromFee: number;
    label: string;
    icon: JSX.Element;
}

export const NETWORKS: Record<ChainKey, ChainConfig> = {
    Optimism_Sepolia: {
        usdc: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
        chain: optimismSepolia,
        domain: 2,
        aproxFromFee: 0.0025,
        label: "Optimism",
        icon: <OPIcon />
    },

    Arbitrum_Sepolia: {
        usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
        chain: arbitrumSepolia,
        domain: 3,
        aproxFromFee: 0.04,
        label: "Arbitrum",
        icon: <ArbIcon />
    },

    Base_Sepolia: {
        usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        chain: baseSepolia,
        domain: 6,
        aproxFromFee: 0.003,
        label: "Base",
        icon: <BaseIcon />
    },

    Unichain_Sepolia: {
        usdc: "0x31d0220469e10c4E71834a79b1f276d740d3768F",
        chain: unichainSepolia,
        domain: 10,
        aproxFromFee: 0.003,
        label: "Unichain",
        icon: <UnichainIcon />
    },
};

export const CHAIN_ID_TO_KEY: Record<string, ChainKey> = {
    [optimismSepolia.id.toString()]: "Optimism_Sepolia",
    [arbitrumSepolia.id.toString()]: "Arbitrum_Sepolia",
    [baseSepolia.id.toString()]: "Base_Sepolia",
    [unichainSepolia.id.toString()]: "Unichain_Sepolia",
};