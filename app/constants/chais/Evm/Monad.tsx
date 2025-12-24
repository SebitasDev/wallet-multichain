import {avalanche, avalancheFuji, monad, monadTestnet} from "viem/chains";
import { AvalancheIcon } from "@/app/components/atoms/AvalancheIcon";
import { Address } from "abitype";
import { ChainConfig } from "@/app/types/chain";
import {MonadIcon} from "@/app/components/atoms/MonadIcon";
import {UsdcIcon} from "@/app/components/atoms/UsdcIcon";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const Monad: ChainConfig = {
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: (isDevelopment ? "0x5425890298aed601595a70AB815c96711a31Bc65" : "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E") as Address
        }
    ],
    evm: {
        chain: isDevelopment ? monadTestnet : monad,
        rpcUrl: isDevelopment ? monadTestnet.rpcUrls.default.http[0] : monad.rpcUrls.default.http[0],
    },
    label: "Monad",
    icon: <MonadIcon />,
    chipLabel: "MON",
    chipColor: "#E84142",
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: false,
            cCTPInformation: {
                supportCCTP: false,
                domain: 0,
            },
            aproxFromFee: isDevelopment ? 0.001 : 0.001,
        },
        nearIntentInformation: {
            support: true,
            assetsId: [
                {
                    assetId: "nep245:v2_1.omni.hot.tg:143_2dmLwYWkCQKyTjeUPAsGJuiVLbFx",
                    name: "USDC",
                    decimals: 6,
                    icon: <UsdcIcon/>
                }
            ],
            needMemo: false
        }
    }
}