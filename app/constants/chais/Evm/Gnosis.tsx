import { gnosis, gnosisChiado } from "viem/chains";
import { Address } from "abitype";
import { ChainConfig } from "@/app/types/chain";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";
import { UsdtIcon } from "@/app/components/atoms/UsdtIcon";
import { EthIcon } from "@/app/components/atoms/EthIcon";
import GnosisIcon from "@/app/components/atoms/GnosisIcon";
import { EureIcon } from "@/app/components/atoms/EureIcon";
import { XdaiIcon } from "@/app/components/atoms/XdaiIcon";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const GNOSIS: ChainConfig = {
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: (isDevelopment ? "0x2a22f9c3b484c3629090FeED35F17Ff8F88f76F0" : "0x2a22f9c3b484c3629090FeED35F17Ff8F88f76F0") as Address,
            icon: <UsdcIcon />,
            coingeckoId: "usd-coin"
        },
        {
            name: "USDT",
            decimals: 6,
            address: (isDevelopment ? "0x2a22f9c3b484c3629090FeED35F17Ff8F88f76F0" : "0x2a22f9c3b484c3629090FeED35F17Ff8F88f76F0") as Address,
            icon: <UsdtIcon />,
            coingeckoId: "tether"
        },
        {
            name: "EURe",
            decimals: 6,
            address: (isDevelopment ? "0x420CA0f9B9b604cE0fd9C18EF134C705e5Fa3430" : "0x420CA0f9B9b604cE0fd9C18EF134C705e5Fa3430") as Address,
            icon: <EureIcon />,
            coingeckoId: "monerium-eur-money"
        },
        {
            name: "GNO",
            decimals: 18,
            address: (isDevelopment ? "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb" : "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb") as Address,
            icon: <GnosisIcon />,
            coingeckoId: "gnosis"
        },
        {
            name: "WETH",
            decimals: 18,
            address: (isDevelopment ? "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1" : "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1") as Address,
            icon: <EthIcon />,
            coingeckoId: "ethereum"
        },
        {
            name: "XDAI",
            decimals: 18,
            address: "0x0000000000000000000000000000000000000000" as Address,
            icon: <XdaiIcon />,
            coingeckoId: "xdai"
        }
    ],
    evm: {
        chain: isDevelopment ? gnosisChiado : gnosis,
        rpcUrl: isDevelopment ? gnosisChiado.rpcUrls.default.http[0] : gnosis.rpcUrls.default.http[0],
        supports7702: true,
    },
    label: "Gnosis",
    icon: <GnosisIcon />,
    chipLabel: "GNO",
    chipColor: "#133629",
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: false,
            aproxFromFee: 0,
            cCTPInformation: {
                supportCCTP: false,
                domain: 0,
            },
        },
        nearIntentInformation: {
            support: true,
            assetsId: [
                {
                    assetId: "nep141:gnosis-0x2a22f9c3b484c3629090feed35f17ff8f88f76f0.omft.near",
                    name: "USDC",
                    decimals: 6
                },
                {
                    assetId: "nep141:gnosis-0x4ecaba5870353805a9f068101a40e0f32ed605c6.omft.near",
                    name: "USDT",
                    decimals: 6
                },
                {
                    assetId: "nep141:gnosis-0x420ca0f9b9b604ce0fd9c18ef134c705e5fa3430.omft.near.omft.near",
                    name: "EURe",
                    decimals: 6
                },
                {
                    assetId: "nep141:gnosis-0x9c58bacc331c9aa871afd802db6379a98e80cedb.omft.near",
                    name: "GNO",
                    decimals: 18
                },
                {
                    assetId: "nep141:gnosis-0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1.omft.near",
                    name: "WETH",
                    decimals: 18
                },
                {
                    assetId: "nep141:gnosis.omft.near",
                    name: "XDAI",
                    decimals: 18
                }
            ],
            needMemo: false
        }
    }
};