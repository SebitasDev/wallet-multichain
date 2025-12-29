import { monad, monadTestnet } from "viem/chains";
import { Address } from "abitype";
import { ChainConfig } from "@/app/types/chain";
import { MonadIcon } from "@/app/components/atoms/MonadIcon";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";
import { UsdtIcon } from "@/app/components/atoms/UsdtIcon";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const Monad: ChainConfig = {
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: (isDevelopment ? "0x5425890298aed601595a70AB815c96711a31Bc65" : "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E") as Address,
            icon: <UsdcIcon />,
            coingeckoId: "usd-coin"
        },
        {
            name: "USDT",
            decimals: 6,
            address: (isDevelopment ? "0xe7cd86e13AC4309349F30B3435a9d337750fC82D" : "0xe7cd86e13AC4309349F30B3435a9d337750fC82D") as Address,
            icon: <UsdtIcon />,
            coingeckoId: "tether"
        },
        {
            name: "MON",
            decimals: 18,
            address: "0x0000000000000000000000000000000000000000" as Address,
            icon: <MonadIcon />,
            coingeckoId: "monad"
        }
    ],
    evm: {
        chain: isDevelopment ? monadTestnet : monad,
        rpcUrl: isDevelopment ? monadTestnet.rpcUrls.default.http[0] : monad.rpcUrls.default.http[0],
        supports7702: true,
    },
    label: "Monad",
    icon: <MonadIcon />,
    chipLabel: "MON",
    chipColor: "#E84142",
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: false,
            cCTPInformation: {
                supportCCTP: true,
                domain: 15,
            },
            aproxFromFee: 0,
        },
        nearIntentInformation: {
            support: true,
            assetsId: [
                {
                    assetId: "nep245:v2_1.omni.hot.tg:143_2dmLwYWkCQKyTjeUPAsGJuiVLbFx",
                    name: "USDC",
                    decimals: 6
                },
                {
                    assetId: "nep245:v2_1.omni.hot.tg:143_4EJiJxSALvGoTZbnc8K7Ft9533et",
                    name: "USDT",
                    decimals: 6
                },
                {
                    assetId: "nep245:v2_1.omni.hot.tg:143_11111111111111111111",
                    name: "MON",
                    decimals: 18
                }
            ],
            needMemo: false
        }
    }
}