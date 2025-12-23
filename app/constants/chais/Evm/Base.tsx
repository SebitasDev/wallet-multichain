import { base, baseSepolia } from "viem/chains";
import { BaseIcon } from "@/app/components/atoms/BaseIcon";
import { Address } from "abitype";
import { ChainConfig } from "@/app/types/chain";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const BASE: ChainConfig = {
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: (isDevelopment ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as Address
        }
    ],
    evm: {
        chain: isDevelopment ? baseSepolia : base,
        rpcUrl: isDevelopment ? "https://base-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://base-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN",
    },
    label: "Base",
    icon: <BaseIcon />,
    chipLabel: "ETH",
    chipColor: "#0052FF",
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: true,
            cCTPInformation: {
                supportCCTP: true,
                domain: 6,
            },
            aproxFromFee: isDevelopment ? 0.003 : 0.005,
        },
        nearIntentInformation: {
            support: true,
            assetsId: [
                {
                    assetId: "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near",
                    name: "USDC",
                    decimals: 6
                }
            ],
            needMemo: false
        }
    }
}