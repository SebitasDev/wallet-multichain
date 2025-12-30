import { polygonAmoy } from "viem/chains";
import { polygon } from "wagmi/chains";
import PolygonIcon from "@/app/components/atoms/PolygonIcon";
import { Address } from "abitype";
import { ChainConfig } from "@/app/types/chain";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";
import { UsdtIcon } from "@/app/components/atoms/UsdtIcon";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const POLYGON: ChainConfig = {
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: (isDevelopment ? "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" : "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359") as Address,
            icon: <UsdcIcon />,
            coingeckoId: "usd-coin"
        },
        {
            name: "POL",
            decimals: 18,
            address: "0x0000000000000000000000000000000000000000" as Address,
            icon: <PolygonIcon />,
            coingeckoId: "polygon-ecosystem-token"
        },
        {
            name: "USDT",
            decimals: 6,
            address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" as Address,
            icon: <UsdtIcon />,
            coingeckoId: "tether"
        }
    ],
    evm: {
        chain: isDevelopment ? polygonAmoy : polygon,
        rpcUrl: isDevelopment ? "https://polygon-amoy.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://polygon-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN",
        supports7702: true,
    },
    label: "Polygon",
    icon: <PolygonIcon />,
    chipLabel: "POL",
    chipColor: "#8247E5",
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: true,
            cCTPInformation: {
                supportCCTP: true,
                domain: 7,
            },
            aproxFromFee: 0,
        },
        nearIntentInformation: {
            support: true,
            assetsId: [
                {
                    assetId: "nep245:v2_1.omni.hot.tg:137_qiStmoQJDQPTebaPjgx5VBxZv6L",
                    name: "USDC",
                    decimals: 6
                },
                {
                    assetId: "nep245:v2_1.omni.hot.tg:137_11111111111111111111",
                    name: "POL",
                    decimals: 18
                },
                {
                    assetId: "nep245:v2_1.omni.hot.tg:137_3hpYoaLtt8MP1Z2GH1U473DMRKgr",
                    name: "USDT",
                    decimals: 6
                }
            ],
            needMemo: false
        }
    }
}