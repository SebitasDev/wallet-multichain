import { avalanche, avalancheFuji } from "viem/chains";
import { AvalancheIcon } from "@/app/components/atoms/AvalancheIcon";
import { Address } from "abitype";
import { ChainConfig } from "@/app/types/chain";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const AVALANCHE: ChainConfig = {
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: (isDevelopment ? "0x5425890298aed601595a70AB815c96711a31Bc65" : "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E") as Address,
            icon: <UsdcIcon />
        },
        {
            name: "AVAX",
            decimals: 18,
            address: "0x0000000000000000000000000000000000000000" as Address,
            icon: <AvalancheIcon />
        }
    ],
    evm: {
        chain: isDevelopment ? avalancheFuji : avalanche,
        rpcUrl: isDevelopment ? avalancheFuji.rpcUrls.default.http[0] : avalanche.rpcUrls.default.http[0],
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
                }
            ],
            needMemo: false
        }
    }
}