import {base, baseSepolia} from "viem/chains";
import {BaseIcon} from "@/app/components/atoms/BaseIcon";
import {Address} from "abitype";
import {ChainConfig} from "@/app/constants/chainsInformation";

const isDevelopment = process.env.NODE_ENV === "development";

export const BASE: ChainConfig = {
    usdc: (isDevelopment ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as Address,
    chain: isDevelopment ? baseSepolia : base,
    domain: 6,
    aproxFromFee: isDevelopment ? 0.003 : 0.036,
    label: "Base",
    icon: <BaseIcon />,
    rpcUrl: isDevelopment ? "https://base-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://base-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN",
    chipLabel: "ETH",
    chipColor: "#0052FF",
    crossChainInformation: {
        supportCCTP: true,
        supportCirclePaymaster: true
    }
}