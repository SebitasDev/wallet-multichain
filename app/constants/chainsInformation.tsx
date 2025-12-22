import { Address } from "abitype";
import {
    arbitrum,
    arbitrumSepolia, avalanche, avalancheFuji, base,
    baseSepolia,
    optimism,
    optimismSepolia,
    polygonAmoy, unichain,
    unichainSepolia, worldchain, worldchainSepolia
} from "viem/chains";
import { JSX } from "react";
import z from "zod";
import { polygon } from "wagmi/chains";
import { ARBITRUM, AVALANCHE, BASE, OPTIMISM, POLYGON, STELLAR, UNICHAIN, WORLD_CHAIN } from "@/app/constants/chais";

export const ChainKeyEnum = z.enum([
    "Optimism",
    "Arbitrum",
    "Base",
    "Unichain",
    "Polygon",
    "Avalanche",
    "WorldChain",
    "Stellar"
]);

export type ChainKey = z.infer<typeof ChainKeyEnum>;

interface NearIntentAsset {
    assetId: string,
    name: string,
    decimals: number
}

interface NearIntentInformation {
    support: boolean,
    assetsId: NearIntentAsset[],
    needMemo: boolean
}

interface CCTPInformation {
    supportCCTP: boolean;
    domain: number;
}

export interface CircleInformation {
    supportCirclePaymaster: boolean;
    cCTPInformation?: CCTPInformation;
    aproxFromFee: number;
}

export interface CrossChainInformation {
    circleInformation?: CircleInformation;
    nearIntentInformation: NearIntentInformation | null;
}

export interface EvmInformation {
    chain: any;
    rpcUrl: string | null;
}

export interface NonEvmInformation {
    networkPassphrase?: string;
    serverURL?: string;
}

export interface Asset {
    name: string;
    decimals: number;
    address?: Address | string;
}

export interface ChainConfig {
    label: string;
    icon: JSX.Element;
    chipLabel: string;
    chipColor: string;
    assets: Asset[];

    evm?: EvmInformation;
    nonEvm?: NonEvmInformation;

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
    WorldChain: WORLD_CHAIN,
    Stellar: STELLAR
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