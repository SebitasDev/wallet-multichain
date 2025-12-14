import {arbitrum, arbitrumSepolia} from "viem/chains";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import {Address} from "abitype";
import {ChainConfig} from "@/app/constants/chainsInformation";

const isDevelopment = process.env.NODE_ENV === "development";

export const ARBITRUM: ChainConfig = {
    usdc: (isDevelopment ? "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" : "0xaf88d065e77c8cC2239327C5EDb3A432268e5831") as Address,
    chain: isDevelopment ? arbitrumSepolia : arbitrum,
    domain: 3,
    aproxFromFee: isDevelopment ? 0.04 : 0.03,
    label: "Arbitrum",
    icon: <ArbIcon />,
    rpcUrl: isDevelopment ? "https://arb-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://arb-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN",
    chipLabel: "ARB",
    chipColor: "#28A0F0",
    crossChainInformation: {
        supportCCTP: true,
        supportCirclePaymaster: true
    }
}