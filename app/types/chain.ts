import { JSX } from "react";
import z from "zod";
import { ChainConfig as SDKChainConfig } from "@1llet.xyz/erc4337-gasless-sdk"; // Keep import for nominal compatibility/reference

export const ChainKeyEnum = z.enum([
    "Optimism",
    "Arbitrum",
    "Base",
    "Unichain",
    "Polygon",
    "Avalanche",
    "WorldChain",
    "Stellar",
    "Monad",
    "BNB",
    "GNOSIS"
]);

export type ChainKey = z.infer<typeof ChainKeyEnum>;

// Manually define SDK types that are not exported
export interface SDKAsset {
    name: string;
    decimals: number;
    address?: string; // Address | string
    coingeckoId?: string;
}

export interface SDKEvmInformation {
    chain: any; // viem Chain
    rpcUrl?: string | null;
    bundlerUrl?: string;
    entryPointAddress?: string; // Address
    factoryAddress?: string; // Address
    paymasterAddress?: string; // Address
    supports7702?: boolean;
    erc4337?: boolean;
}

export interface SDKNonEvmInformation {
    rpcUrl?: string;
    networkPassphrase?: string;
    serverURL?: string;
}

export interface SDKCrossChainInformation {
    circleInformation?: {
        supportCirclePaymaster?: boolean;
        cCTPInformation?: {
            supportCCTP: boolean;
            tokenMessenger?: string;
            messageTransmitter?: string;
            domain?: number;
        };
        aproxFromFee?: number;
    };
    nearIntentInformation?: {
        support: boolean;
        assetsId: { name: string; assetId: string; decimals?: number }[];
        needMemo?: boolean;
    } | null;
}

export interface UIAsset extends SDKAsset {
    icon?: JSX.Element;
    name: string;
    coingeckoId?: string;
    address?: string;
    decimals: number;
}

// Structurally compatible with SDKChainConfig
export interface ChainConfig {
    assets: UIAsset[];
    evm?: SDKEvmInformation;
    nonEvm?: SDKNonEvmInformation;
    crossChainInformation: SDKCrossChainInformation;

    // UI Props
    label: string;
    icon: JSX.Element;
    chipLabel: string;
    chipColor: string;
}
