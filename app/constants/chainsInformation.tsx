import {Address} from "abitype";
import {
    arbitrum,
    arbitrumSepolia, avalanche, avalancheFuji, base,
    baseSepolia,
    optimism,
    optimismSepolia,
    polygonAmoy, unichain,
    unichainSepolia, worldchain, worldchainSepolia
} from "viem/chains";
import {JSX} from "react";
import z from "zod";
import {polygon} from "wagmi/chains";
import {ARBITRUM, AVALANCHE, BASE, OPTIMISM, POLYGON, UNICHAIN, WORLD_CHAIN} from "@/app/constants/chais";

export const ChainKeyEnum = z.enum([
    "Optimism",
    "Arbitrum",
    "Base",
    "Unichain",
    "Polygon",
    "Avalanche",
    "WorldChain"
]);

export type ChainKey = z.infer<typeof ChainKeyEnum>;

interface CrossChainInformation {
    supportCCTP: boolean;
    supportCirclePaymaster: boolean;
}

export interface ChainConfig {
    usdc: Address;
    chain: any;
    domain: number;
    aproxFromFee: number;
    label: string;
    icon: JSX.Element;
    rpcUrl: string;
    chipLabel: string;
    chipColor: string;
    crossChainInformation: CrossChainInformation;
}

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const NETWORKS: Record<ChainKey, ChainConfig> = {
    Optimism: OPTIMISM,
    Arbitrum: ARBITRUM,
    Base: BASE,
    Unichain: UNICHAIN,
    Polygon: POLYGON,
    Avalanche: AVALANCHE,
    WorldChain: WORLD_CHAIN
};

export const CHAIN_ID_TO_KEY: Record<string, string> = {
    [isDevelopment ? optimismSepolia.id.toString() : optimism.id.toString()]: "Optimism",
    [isDevelopment ? arbitrumSepolia.id.toString() : arbitrum.id.toString()]: "Arbitrum",
    [isDevelopment ? baseSepolia.id.toString() : base.id.toString()]: "Base",
    [isDevelopment ? unichainSepolia.id.toString() : unichain.id.toString()]: "Unichain",
    [isDevelopment ? polygonAmoy.id.toString() : polygon.id.toString()]: "Polygon",
    [isDevelopment ? avalancheFuji.id.toString() : avalanche.id.toString()]: "Avalanche",
    [isDevelopment ? worldchainSepolia.id.toString() : worldchain.id.toString()]: "WorldChain",
};