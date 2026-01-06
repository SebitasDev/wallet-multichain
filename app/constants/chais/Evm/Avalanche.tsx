import { avalanche, avalancheFuji } from "viem/chains";
import { AvalancheIcon } from "@/app/components/atoms/AvalancheIcon";
import { Address } from "abitype";
import { ChainConfig } from "@/app/types/chain";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";
import { UsdtIcon } from "@/app/components/atoms/UsdtIcon";
import { EthIcon } from "@/app/components/atoms/EthIcon";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const AVALANCHE: ChainConfig = {
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: (isDevelopment ? "0x5425890298aed601595a70AB815c96711a31Bc65" : "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E") as Address,
            icon: <UsdcIcon />,
            coingeckoId: "usd-coin"
        },
        {
            name: "WETH",
            decimals: 18,
            address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB" as Address,
            icon: <EthIcon />,
            coingeckoId: "ethereum"
        },
        {
            name: "AVAX",
            decimals: 18,
            address: "0x0000000000000000000000000000000000000000" as Address,
            icon: <AvalancheIcon />,
            coingeckoId: "avalanche-2"
        },
        {
            name: "USDT",
            decimals: 6,
            address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7" as Address,
            icon: <UsdtIcon />,
            coingeckoId: "tether"
        }
    ],
    evm: {
        chain: isDevelopment ? avalancheFuji : avalanche,
        rpcUrl: isDevelopment ? avalancheFuji.rpcUrls.default.http[0] : avalanche.rpcUrls.default.http[0],
        supports7702: false,
    },
    label: "Avalanche",
    icon: <AvalancheIcon />,
    chipLabel: "AVAX",
    chipColor: "#E84142",
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: true,
            cCTPInformation: {
                supportCCTP: true,
                domain: 1,
            },
            aproxFromFee: 0,
        },
        nearIntentInformation: {
            support: true,
            assetsId: [
                {
                    assetId: "nep245:v2_1.omni.hot.tg:43114_3atVJH3r5c4GqiSYmg9fECvjc47o",
                    name: "USDC",
                    decimals: 6
                },
                {
                    assetId: "nep245:v2_1.omni.hot.tg:43114_11111111111111111111",
                    name: "AVAX",
                    decimals: 18
                },
                {
                    assetId: "nep245:v2_1.omni.hot.tg:43114_372BeH7ENZieCaabwkbWkBiTTgXp",
                    name: "USDT",
                    decimals: 6
                }
            ],
            needMemo: false
        }
    }
}