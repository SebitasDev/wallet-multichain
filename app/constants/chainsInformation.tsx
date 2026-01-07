import {
    arbitrum,
    arbitrumSepolia, avalanche, avalancheFuji, base,
    baseSepolia,
    optimism,
    optimismSepolia,
    polygonAmoy, unichain,
    unichainSepolia, worldchain, worldchainSepolia,
    monad, monadTestnet,
    bsc, bscTestnet,
    gnosisChiado,
    gnosis
} from "viem/chains";
import { polygon } from "wagmi/chains";
import { ARBITRUM, AVALANCHE, BASE, Monad, OPTIMISM, POLYGON, STELLAR, UNICHAIN, WORLD_CHAIN, BNB, GNOSIS } from "@/app/constants/chains";
import { CHAIN_CONFIGS } from "@1llet.xyz/erc4337-gasless-sdk";
import { ChainKey, ChainKeyEnum, ChainConfig } from "@/app/types/chain";

export { ChainKeyEnum };
export type { ChainKey, ChainConfig };

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

const getSDKConfig = (chainId: number) => {
    return (CHAIN_CONFIGS as Record<number, any>)[chainId];
};

export const NETWORKS: Record<ChainKey, ChainConfig> = {
    Optimism: {
        ...OPTIMISM,
        evm: {
            ...OPTIMISM.evm,
            ...(getSDKConfig(isDevelopment ? optimismSepolia.id : optimism.id) || {})
        }
    },
    Arbitrum: {
        ...ARBITRUM,
        evm: {
            ...ARBITRUM.evm,
            ...(getSDKConfig(isDevelopment ? arbitrumSepolia.id : arbitrum.id) || {})
        }
    },
    Base: {
        ...BASE,
        evm: {
            ...BASE.evm,
            ...(getSDKConfig(isDevelopment ? baseSepolia.id : base.id) || {})
        }
    },
    Unichain: {
        ...UNICHAIN,
        evm: {
            ...UNICHAIN.evm,
            ...(getSDKConfig(isDevelopment ? unichainSepolia.id : unichain.id) || {})
        }
    },
    Polygon: {
        ...POLYGON,
        evm: {
            ...POLYGON.evm,
            ...(getSDKConfig(isDevelopment ? polygonAmoy.id : polygon.id) || {})
        }
    },
    Avalanche: {
        ...AVALANCHE,
        evm: {
            ...AVALANCHE.evm,
            ...(getSDKConfig(isDevelopment ? avalancheFuji.id : avalanche.id) || {})
        }
    },
    WorldChain: {
        ...WORLD_CHAIN,
        evm: {
            ...WORLD_CHAIN.evm,
            ...(getSDKConfig(isDevelopment ? worldchainSepolia.id : worldchain.id) || {})
        }
    },
    Stellar: STELLAR,
    Monad: {
        ...Monad,
        evm: {
            ...Monad.evm,
            ...(getSDKConfig(isDevelopment ? monadTestnet.id : monad.id) || {})
        }
    },
    BNB: {
        ...BNB,
        evm: {
            ...BNB.evm,
            ...(getSDKConfig(isDevelopment ? bscTestnet.id : bsc.id) || {})
        }
    },
    GNOSIS: {
        ...GNOSIS,
        evm: {
            ...GNOSIS.evm,
            ...(getSDKConfig(isDevelopment ? gnosisChiado.id : gnosis.id) || {})
        }
    }
};

export const CHAIN_ID_TO_KEY: Record<string, string> = {
    [isDevelopment ? optimismSepolia.id.toString() : optimism.id.toString()]: "Optimism",
    [isDevelopment ? arbitrumSepolia.id.toString() : arbitrum.id.toString()]: "Arbitrum",
    [isDevelopment ? baseSepolia.id.toString() : base.id.toString()]: "Base",
    [isDevelopment ? unichainSepolia.id.toString() : unichain.id.toString()]: "Unichain",
    [isDevelopment ? polygonAmoy.id.toString() : polygon.id.toString()]: "Polygon",
    [isDevelopment ? avalancheFuji.id.toString() : avalanche.id.toString()]: "Avalanche",
    [isDevelopment ? worldchainSepolia.id.toString() : worldchain.id.toString()]: "WorldChain",
    [isDevelopment ? monadTestnet.id.toString() : monad.id.toString()]: "Monad",
    [isDevelopment ? bscTestnet.id.toString() : bsc.id.toString()]: "BNB",
    [isDevelopment ? gnosisChiado.id.toString() : gnosis.id.toString()]: "GNOSIS",
};