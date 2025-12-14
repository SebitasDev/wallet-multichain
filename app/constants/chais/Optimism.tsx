import {optimism, optimismSepolia} from "viem/chains";
import {OPIcon} from "@/app/components/atoms/OPIcon";
import {Address} from "abitype";
import {ChainConfig} from "@/app/constants/chainsInformation";

const isDevelopment = process.env.NODE_ENV === "development";

export const OPTIMISM: ChainConfig = {
    usdc: ( isDevelopment ? "0x5fd84259d66Cd46123540766Be93DFE6D43130D7" : "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" ) as Address,
    chain: isDevelopment ? optimismSepolia : optimism,
    domain: 2,
    aproxFromFee: 0.0025,
    label: "Optimism",
    icon: <OPIcon />,
    rpcUrl: isDevelopment ? "https://opt-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://opt-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN",
    chipLabel: "ETH",
    chipColor: "#FF0420",
    crossChainInformation: {
        supportCCTP: true,
        supportCirclePaymaster: true
    }
}