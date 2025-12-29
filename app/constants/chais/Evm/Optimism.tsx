import { optimism, optimismSepolia } from "viem/chains";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import { Address } from "abitype";
import { ChainConfig } from "@/app/types/chain";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";
import { UsdtIcon } from "@/app/components/atoms/UsdtIcon";
import { EthIcon } from "@/app/components/atoms/EthIcon";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const OPTIMISM: ChainConfig = {
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: (isDevelopment ? "0x5fd84259d66Cd46123540766Be93DFE6D43130D7" : "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85") as Address,
            icon: <UsdcIcon />,
            coingeckoId: "usd-coin"
        },
        {
            name: "USDT",
            decimals: 6,
            address: (isDevelopment ? "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58" : "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58") as Address,
            icon: <UsdtIcon />,
            coingeckoId: "tether"
        },
        {
            name: "OP",
            decimals: 18,
            address: (isDevelopment ? "0x4200000000000000000000000000000000000042" : "0x4200000000000000000000000000000000000042") as Address,
            icon: <OPIcon />,
            coingeckoId: "optimism"
        },
        {
            name: "ETH",
            decimals: 18,
            address: "0x0000000000000000000000000000000000000000" as Address,
            icon: <EthIcon />,
            coingeckoId: "ethereum"
        }
    ],
    evm: {
        chain: isDevelopment ? optimismSepolia : optimism,
        rpcUrl: isDevelopment ? "https://opt-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://opt-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN",
        supports7702: true,
    },
    label: "Optimism",
    icon: <OPIcon />,
    chipLabel: "ETH",
    chipColor: "#FF0420",
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: true,
            cCTPInformation: {
                supportCCTP: true,
                domain: 2,
            },
            aproxFromFee: 0,
        },
        nearIntentInformation: {
            support: true,
            assetsId: [
                {
                    assetId: "nep245:v2_1.omni.hot.tg:10_A2ewyUyDp6qsue1jqZsGypkCxRJ",
                    name: "USDC",
                    decimals: 6
                },
                {
                    assetId: "nep245:v2_1.omni.hot.tg:10_359RPSJVdTxwTJT9TyGssr2rFoWo",
                    name: "USDT",
                    decimals: 6
                },
                {
                    assetId: "nep245:v2_1.omni.hot.tg:10_vLAiSt9KfUGKpw5cD3vsSyNYBo7",
                    name: "OP",
                    decimals: 18
                },
                {
                    assetId: "nep245:v2_1.omni.hot.tg:10_11111111111111111111",
                    name: "ETH",
                    decimals: 18
                }
            ],
            needMemo: false
        }
    }
}