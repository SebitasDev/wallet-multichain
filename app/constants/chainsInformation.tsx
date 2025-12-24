import {
    arbitrum,
    arbitrumSepolia, avalanche, avalancheFuji, base,
    baseSepolia,
    optimism,
    optimismSepolia,
    polygonAmoy, unichain,
    unichainSepolia, worldchain, worldchainSepolia
} from "viem/chains";
import { polygon } from "wagmi/chains";
import { ARBITRUM, AVALANCHE, BASE, Monad, OPTIMISM, POLYGON, STELLAR, UNICHAIN, WORLD_CHAIN, BNB } from "@/app/constants/chais";
import { ChainKey, ChainKeyEnum, ChainConfig } from "@/app/types/chain";

export { ChainKeyEnum };
export type { ChainKey, ChainConfig };

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const NETWORKS: Record<ChainKey, ChainConfig> = {
    Optimism: OPTIMISM,
    Arbitrum: ARBITRUM,
    Base: BASE,
    Unichain: UNICHAIN,
    Polygon: POLYGON,
    Avalanche: AVALANCHE,
    WorldChain: WORLD_CHAIN,
    Stellar: STELLAR,
    Monad: Monad,
    BNB: BNB
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