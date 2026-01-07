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
import { CHAIN_CONFIGS } from "@1llet.xyz/erc4337-gasless-sdk";
import { ChainKey, ChainKeyEnum, ChainConfig } from "@/app/types/chain";
import { JSX } from "react";

// Icons
import { BaseIcon } from "@/app/components/atoms/BaseIcon";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import { UnichainIcon } from "@/app/components/atoms/UnichainIcon";
import PolygonIcon from "@/app/components/atoms/PolygonIcon";
import { AvalancheIcon } from "@/app/components/atoms/AvalancheIcon";
import { WorldChainIcon } from "@/app/components/atoms/WorldChainIcon";
import { StellarIcon } from "@/app/components/atoms/StellarIcon";
import { MonadIcon } from "@/app/components/atoms/MonadIcon";
import { BnbIcon } from "@/app/components/atoms/BnbIcon";
import GnosisIcon from "@/app/components/atoms/GnosisIcon";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";
import { EthIcon } from "@/app/components/atoms/EthIcon";
import { UsdtIcon } from "@/app/components/atoms/UsdtIcon";
import { EureIcon } from "@/app/components/atoms/EureIcon";
import { XdaiIcon } from "@/app/components/atoms/XdaiIcon";

export { ChainKeyEnum };
export type { ChainKey, ChainConfig };

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

// Map chain IDs to ChainKey names (SDK uses numeric IDs)
const CHAIN_ID_TO_NAME: Record<number, ChainKey> = {
    [optimism.id]: "Optimism",
    [optimismSepolia.id]: "Optimism",
    [base.id]: "Base",
    [baseSepolia.id]: "Base",
    [gnosis.id]: "GNOSIS",
    [gnosisChiado.id]: "GNOSIS",
};

// UI Configuration Mapping
const UI_CONFIGS: Record<ChainKey, {
    label: string,
    icon: JSX.Element,
    chipLabel: string,
    chipColor: string,
    assetIcons: Record<string, JSX.Element>
}> = {
    Base: {
        label: "Base",
        icon: <BaseIcon />,
        chipLabel: "ETH",
        chipColor: "#0052FF",
        assetIcons: { "USDC": <UsdcIcon />, "ETH": <EthIcon /> }
    },
    Optimism: {
        label: "Optimism",
        icon: <OPIcon />,
        chipLabel: "ETH",
        chipColor: "#FF0420",
        assetIcons: { "USDC": <UsdcIcon />, "ETH": <EthIcon />, "USDT": <UsdtIcon /> }
    },
    Arbitrum: {
        label: "Arbitrum",
        icon: <ArbIcon />,
        chipLabel: "ETH",
        chipColor: "#2D374B",
        assetIcons: { "USDC": <UsdcIcon />, "ETH": <EthIcon /> }
    },
    Unichain: {
        label: "Unichain",
        icon: <UnichainIcon />,
        chipLabel: "ETH",
        chipColor: "#F52E74",
        assetIcons: { "USDC": <UsdcIcon />, "ETH": <EthIcon /> }
    },
    Polygon: {
        label: "Polygon",
        icon: <PolygonIcon />,
        chipLabel: "POL",
        chipColor: "#8247E5",
        assetIcons: { "USDC": <UsdcIcon />, "POL": <PolygonIcon /> }
    },
    Avalanche: {
        label: "Avalanche",
        icon: <AvalancheIcon />,
        chipLabel: "AVAX",
        chipColor: "#E84142",
        assetIcons: { "USDC": <UsdcIcon />, "AVAX": <AvalancheIcon /> }
    },
    WorldChain: {
        label: "World Chain",
        icon: <WorldChainIcon />,
        chipLabel: "ETH",
        chipColor: "#000000",
        assetIcons: { "USDC": <UsdcIcon />, "ETH": <EthIcon /> }
    },
    Stellar: {
        label: "Stellar",
        icon: <StellarIcon />,
        chipLabel: "XLM",
        chipColor: "#3E1BDB",
        assetIcons: { "USDC": <UsdcIcon />, "XLM": <StellarIcon /> }
    },
    Monad: {
        label: "Monad",
        icon: <MonadIcon />,
        chipLabel: "MON",
        chipColor: "#836EF9",
        assetIcons: { "USDC": <UsdcIcon />, "BMON": <MonadIcon /> }
    },
    BNB: {
        label: "BNB Chain",
        icon: <BnbIcon />,
        chipLabel: "BNB",
        chipColor: "#F3BA2F",
        assetIcons: { "USDC": <UsdcIcon />, "BNB": <BnbIcon /> }
    },
    GNOSIS: {
        label: "Gnosis",
        icon: <GnosisIcon />,
        chipLabel: "xDai",
        chipColor: "#04795B",
        assetIcons: { "USDC": <UsdcIcon />, "EURe": <EureIcon />, "xDai": <XdaiIcon /> }
    }
};

// Get SDK config by chain ID
const getSDKConfig = (chainId: number) => {
    return (CHAIN_CONFIGS as Record<number, any>)[chainId];
};

// Manual chain configurations (for chains not in SDK or to override)
const MANUAL_CONFIGS: Record<ChainKey, ChainConfig> = {
    Base: {
        label: "Base",
        icon: <BaseIcon />,
        chipLabel: "ETH",
        chipColor: "#0052FF",
        assets: [
            { name: "USDC", decimals: 6, address: isDevelopment ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", icon: <UsdcIcon />, coingeckoId: "usd-coin" },
            { name: "ETH", decimals: 18, address: "0x0000000000000000000000000000000000000000", icon: <EthIcon />, coingeckoId: "ethereum" }
        ],
        evm: {
            chain: isDevelopment ? baseSepolia : base,
            rpcUrl: isDevelopment ? "https://sepolia.base.org" : "https://mainnet.base.org",
            supports7702: false,
            erc4337: true,
            ...(getSDKConfig(isDevelopment ? baseSepolia.id : base.id) || {})
        },
        crossChainInformation: {
            circleInformation: {
                supportCirclePaymaster: true,
                cCTPInformation: { supportCCTP: true, domain: 6 },
                aproxFromFee: 0.02
            },
            nearIntentInformation: {
                support: true,
                assetsId: [{ name: "USDC", assetId: isDevelopment ? "usdc.fakes.testnet" : "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1", decimals: 6 }],
                needMemo: false
            }
        }
    },
    Optimism: {
        label: "Optimism",
        icon: <OPIcon />,
        chipLabel: "ETH",
        chipColor: "#FF0420",
        assets: [
            { name: "USDC", decimals: 6, address: isDevelopment ? "0x5fd84259d66Cd46123540766Be93DFE6D43130D7" : "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", icon: <UsdcIcon />, coingeckoId: "usd-coin" },
            { name: "ETH", decimals: 18, address: "0x0000000000000000000000000000000000000000", icon: <EthIcon />, coingeckoId: "ethereum" }
        ],
        evm: {
            chain: isDevelopment ? optimismSepolia : optimism,
            rpcUrl: isDevelopment ? "https://sepolia.optimism.io" : "https://mainnet.optimism.io",
            supports7702: false,
            erc4337: true,
            ...(getSDKConfig(isDevelopment ? optimismSepolia.id : optimism.id) || {})
        },
        crossChainInformation: {
            circleInformation: {
                supportCirclePaymaster: true,
                cCTPInformation: { supportCCTP: true, domain: 2 },
                aproxFromFee: 0.02
            },
            nearIntentInformation: {
                support: true,
                assetsId: [{ name: "USDC", assetId: isDevelopment ? "usdc.fakes.testnet" : "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1", decimals: 6 }],
                needMemo: false
            }
        }
    },
    Arbitrum: {
        label: "Arbitrum",
        icon: <ArbIcon />,
        chipLabel: "ETH",
        chipColor: "#2D374B",
        assets: [
            { name: "USDC", decimals: 6, address: isDevelopment ? "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" : "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", icon: <UsdcIcon />, coingeckoId: "usd-coin" },
            { name: "ETH", decimals: 18, address: "0x0000000000000000000000000000000000000000", icon: <EthIcon />, coingeckoId: "ethereum" }
        ],
        evm: {
            chain: isDevelopment ? arbitrumSepolia : arbitrum,
            rpcUrl: isDevelopment ? "https://sepolia-rollup.arbitrum.io/rpc" : "https://arb1.arbitrum.io/rpc",
            supports7702: false,
            erc4337: false
        },
        crossChainInformation: {
            circleInformation: {
                supportCirclePaymaster: false,
                cCTPInformation: { supportCCTP: true, domain: 3 },
                aproxFromFee: 0.02
            },
            nearIntentInformation: {
                support: true,
                assetsId: [{ name: "USDC", assetId: isDevelopment ? "usdc.fakes.testnet" : "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1", decimals: 6 }],
                needMemo: false
            }
        }
    },
    Polygon: {
        label: "Polygon",
        icon: <PolygonIcon />,
        chipLabel: "POL",
        chipColor: "#8247E5",
        assets: [
            { name: "USDC", decimals: 6, address: isDevelopment ? "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582" : "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", icon: <UsdcIcon />, coingeckoId: "usd-coin" },
            { name: "POL", decimals: 18, address: "0x0000000000000000000000000000000000000000", icon: <PolygonIcon />, coingeckoId: "matic-network" }
        ],
        evm: {
            chain: isDevelopment ? polygonAmoy : polygon,
            rpcUrl: isDevelopment ? "https://rpc-amoy.polygon.technology" : "https://polygon-rpc.com",
            supports7702: false,
            erc4337: false
        },
        crossChainInformation: {
            circleInformation: {
                supportCirclePaymaster: false,
                cCTPInformation: { supportCCTP: true, domain: 7 },
                aproxFromFee: 0.02
            },
            nearIntentInformation: {
                support: true,
                assetsId: [{ name: "USDC", assetId: isDevelopment ? "usdc.fakes.testnet" : "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1", decimals: 6 }],
                needMemo: false
            }
        }
    },
    Avalanche: {
        label: "Avalanche",
        icon: <AvalancheIcon />,
        chipLabel: "AVAX",
        chipColor: "#E84142",
        assets: [
            { name: "USDC", decimals: 6, address: isDevelopment ? "0x5425890298aed601595a70AB815c96711a31Bc65" : "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", icon: <UsdcIcon />, coingeckoId: "usd-coin" },
            { name: "AVAX", decimals: 18, address: "0x0000000000000000000000000000000000000000", icon: <AvalancheIcon />, coingeckoId: "avalanche-2" }
        ],
        evm: {
            chain: isDevelopment ? avalancheFuji : avalanche,
            rpcUrl: isDevelopment ? "https://api.avax-test.network/ext/bc/C/rpc" : "https://api.avax.network/ext/bc/C/rpc",
            supports7702: false,
            erc4337: false
        },
        crossChainInformation: {
            circleInformation: {
                supportCirclePaymaster: false,
                cCTPInformation: { supportCCTP: true, domain: 1 },
                aproxFromFee: 0.02
            },
            nearIntentInformation: {
                support: true,
                assetsId: [{ name: "USDC", assetId: isDevelopment ? "usdc.fakes.testnet" : "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1", decimals: 6 }],
                needMemo: false
            }
        }
    },
    Unichain: {
        label: "Unichain",
        icon: <UnichainIcon />,
        chipLabel: "ETH",
        chipColor: "#F52E74",
        assets: [
            { name: "USDC", decimals: 6, address: isDevelopment ? "0x31d0220469e10c4E71834a79b1f276d740d3768F" : "0x078D782b760474a361dDA0AF3839290b0EF57AD6", icon: <UsdcIcon />, coingeckoId: "usd-coin" },
            { name: "ETH", decimals: 18, address: "0x0000000000000000000000000000000000000000", icon: <EthIcon />, coingeckoId: "ethereum" }
        ],
        evm: {
            chain: isDevelopment ? unichainSepolia : unichain,
            rpcUrl: isDevelopment ? "https://sepolia.unichain.org" : "https://mainnet.unichain.org",
            supports7702: false,
            erc4337: false
        },
        crossChainInformation: {
            circleInformation: {
                supportCirclePaymaster: false,
                cCTPInformation: { supportCCTP: true, domain: 10 },
                aproxFromFee: 0.02
            },
            nearIntentInformation: null
        }
    },
    WorldChain: {
        label: "World Chain",
        icon: <WorldChainIcon />,
        chipLabel: "ETH",
        chipColor: "#000000",
        assets: [
            { name: "USDC", decimals: 6, address: isDevelopment ? "0x0000000000000000000000000000000000000000" : "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1", icon: <UsdcIcon />, coingeckoId: "usd-coin" },
            { name: "ETH", decimals: 18, address: "0x0000000000000000000000000000000000000000", icon: <EthIcon />, coingeckoId: "ethereum" }
        ],
        evm: {
            chain: isDevelopment ? worldchainSepolia : worldchain,
            rpcUrl: isDevelopment ? "https://worldchain-sepolia.g.alchemy.com/public" : "https://worldchain-mainnet.g.alchemy.com/public",
            supports7702: false,
            erc4337: false
        },
        crossChainInformation: {
            circleInformation: {
                supportCirclePaymaster: false,
                aproxFromFee: 0.02
            },
            nearIntentInformation: null
        }
    },
    Monad: {
        label: "Monad",
        icon: <MonadIcon />,
        chipLabel: "MON",
        chipColor: "#836EF9",
        assets: [
            { name: "USDC", decimals: 6, address: "0x0000000000000000000000000000000000000000", icon: <UsdcIcon />, coingeckoId: "usd-coin" },
            { name: "BMON", decimals: 18, address: "0x0000000000000000000000000000000000000000", icon: <MonadIcon />, coingeckoId: "monad" }
        ],
        evm: {
            chain: isDevelopment ? monadTestnet : monad,
            rpcUrl: isDevelopment ? "https://testnet-rpc.monad.xyz" : "https://rpc.monad.xyz",
            supports7702: false,
            erc4337: false,
            ...(getSDKConfig(isDevelopment ? monadTestnet.id : monad.id) || {})
        },
        crossChainInformation: {
            circleInformation: {
                supportCirclePaymaster: false,
                aproxFromFee: 0.02
            },
            nearIntentInformation: null
        }
    },
    BNB: {
        label: "BNB Chain",
        icon: <BnbIcon />,
        chipLabel: "BNB",
        chipColor: "#F3BA2F",
        assets: [
            { name: "USDC", decimals: 18, address: isDevelopment ? "0x0000000000000000000000000000000000000000" : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", icon: <UsdcIcon />, coingeckoId: "usd-coin" },
            { name: "BNB", decimals: 18, address: "0x0000000000000000000000000000000000000000", icon: <BnbIcon />, coingeckoId: "binancecoin" }
        ],
        evm: {
            chain: isDevelopment ? bscTestnet : bsc,
            rpcUrl: isDevelopment ? "https://data-seed-prebsc-1-s1.binance.org:8545" : "https://bsc-dataseed.binance.org",
            supports7702: false,
            erc4337: false
        },
        crossChainInformation: {
            circleInformation: {
                supportCirclePaymaster: false,
                aproxFromFee: 0.02
            },
            nearIntentInformation: {
                support: true,
                assetsId: [{ name: "USDC", assetId: isDevelopment ? "usdc.fakes.testnet" : "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1", decimals: 6 }],
                needMemo: false
            }
        }
    },
    GNOSIS: {
        label: "Gnosis",
        icon: <GnosisIcon />,
        chipLabel: "xDai",
        chipColor: "#04795B",
        assets: [
            { name: "USDC", decimals: 6, address: isDevelopment ? "0x0000000000000000000000000000000000000000" : "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83", icon: <UsdcIcon />, coingeckoId: "usd-coin" },
            { name: "EURe", decimals: 18, address: isDevelopment ? "0x0000000000000000000000000000000000000000" : "0xcB444e90D8198415266c6a2724b7900fb12FC56E", icon: <EureIcon />, coingeckoId: "monerium-eur-money" },
            { name: "xDai", decimals: 18, address: "0x0000000000000000000000000000000000000000", icon: <XdaiIcon />, coingeckoId: "xdai" }
        ],
        evm: {
            chain: isDevelopment ? gnosisChiado : gnosis,
            rpcUrl: isDevelopment ? "https://rpc.chiadochain.net" : "https://rpc.gnosischain.com",
            supports7702: false,
            erc4337: true,
            ...(getSDKConfig(isDevelopment ? gnosisChiado.id : gnosis.id) || {})
        },
        crossChainInformation: {
            circleInformation: {
                supportCirclePaymaster: false,
                aproxFromFee: 0.02
            },
            nearIntentInformation: null
        }
    },
    Stellar: {
        label: "Stellar",
        icon: <StellarIcon />,
        chipLabel: "XLM",
        chipColor: "#3E1BDB",
        assets: [
            {
                name: "USDC",
                decimals: 6,
                address: isDevelopment
                    ? "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
                    : "GA5ZSEJYB37JRC5AVCIA5MOP4RXTLEPLZGN4QFFFE6G747JESSQSQ666",
                icon: <UsdcIcon />,
                coingeckoId: "usd-coin"
            },
            { name: "XLM", decimals: 7, icon: <StellarIcon />, coingeckoId: "stellar" }
        ],
        nonEvm: {
            rpcUrl: isDevelopment ? "https://horizon-testnet.stellar.org" : "https://horizon.stellar.org",
            networkPassphrase: isDevelopment ? "Test SDF Network ; September 2015" : "Public Global Stellar Network ; September 2015"
        },
        crossChainInformation: {
            nearIntentInformation: {
                support: true,
                assetsId: [{ name: "USDC", assetId: isDevelopment ? "usdc.fakes.testnet" : "usdc.near", decimals: 6 }],
                needMemo: true
            }
        }
    }
};

export const NETWORKS: Record<ChainKey, ChainConfig> = MANUAL_CONFIGS;

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