import {Address} from "abitype";
import {
    arbitrum,
    arbitrumSepolia, avalanche, avalancheFuji, base,
    baseSepolia,
    optimism,
    optimismSepolia,
    polygonAmoy, unichain,
    unichainSepolia
} from "viem/chains";
import {JSX} from "react";
import {OPIcon} from "@/app/components/atoms/OPIcon";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import {BaseIcon} from "@/app/components/atoms/BaseIcon";
import z from "zod";
import {UnichainIcon} from "@/app/components/atoms/UnichainIcon";
import PolygonIcon from "@/app/components/atoms/PolygonIcon";
import {polygon} from "wagmi/chains";
import {AvalancheIcon} from "@/app/components/atoms/AvalancheIcon";

export const ChainKeyEnum = z.enum([
    "Optimism",
    "Arbitrum",
    "Base",
    "Unichain",
    "Polygon",
    "Avalanche"
]);

export type ChainKey = z.infer<typeof ChainKeyEnum>;

export interface ChainConfig {
    usdc: Address;
    chain: any;
    domain: number;
    aproxFromFee: number;
    label: string;
    icon: JSX.Element;
    rpcUrl: string;
}

export const NETWORKS: Record<ChainKey, ChainConfig> = {
    Optimism: {
        usdc: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "0x5fd84259d66Cd46123540766Be93DFE6D43130D7" : "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        chain: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? optimismSepolia : optimism,
        domain: 2,
        aproxFromFee: 0.0025,
        label: "Optimism",
        icon: <OPIcon />,
        rpcUrl: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "https://opt-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://opt-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN"
    },

    Arbitrum: {
        usdc: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" : "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        chain: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? arbitrumSepolia : arbitrum,
        domain: 3,
        aproxFromFee: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? 0.04 : 0.03,
        label: "Arbitrum",
        icon: <ArbIcon />,
        rpcUrl: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "https://arb-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://arb-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN"
    },

    Base: {
        usdc: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        chain: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? baseSepolia : base,
        domain: 6,
        aproxFromFee: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? 0.003 : 0.036,
        label: "Base",
        icon: <BaseIcon />,
        rpcUrl: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "https://base-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://base-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN"
    },

    Unichain: {
        usdc: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "0x31d0220469e10c4E71834a79b1f276d740d3768F" : "0x078D782b760474a361dDA0AF3839290b0EF57AD6",
        chain: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? unichainSepolia : unichain,
        domain: 10,
        aproxFromFee: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? 0.003 : 0.0028,
        label: "Unichain",
        icon: <UnichainIcon />,
        rpcUrl: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "https://unichain-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://unichain-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN"
    },

    Polygon: {
        usdc: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" : "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        chain: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? polygonAmoy : polygon,
        domain: 7,
        aproxFromFee: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? 0.03 : 0.0035,
        label: "Polygon",
        icon: <PolygonIcon />,
        rpcUrl: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "https://polygon-amoy.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://polygon-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN"
    },

    Avalanche: {
        usdc: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "0x5425890298aed601595a70AB815c96711a31Bc65" : "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        chain: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? avalancheFuji : avalanche,
        domain: 1,
        aproxFromFee: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? 10000 : 10000,
        label: "Avalanche",
        icon: <AvalancheIcon />,
        rpcUrl: process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? avalancheFuji.rpcUrls.default.http[0] : avalanche.rpcUrls.default.http[0]
    },
};

export const CHAIN_ID_TO_KEY: Record<string, string> = {
    [process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? optimismSepolia.id.toString() : optimism.id.toString()]: "Optimism",
    [process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? arbitrumSepolia.id.toString() : arbitrum.id.toString()]: "Arbitrum",
    [process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? baseSepolia.id.toString() : base.id.toString()]: "Base",
    [process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? unichainSepolia.id.toString() : unichain.id.toString()]: "Unichain",
    [process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? polygonAmoy.id.toString() : polygon.id.toString()]: "Polygon",
    [process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? avalancheFuji.id.toString() : avalanche.id.toString()]: "Avalanche",
};