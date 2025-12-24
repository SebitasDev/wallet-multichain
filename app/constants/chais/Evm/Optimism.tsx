import { optimism, optimismSepolia } from "viem/chains";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import { Address } from "abitype";
import { ChainConfig } from "@/app/types/chain";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const OPTIMISM: ChainConfig = {
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: (isDevelopment ? "0x5fd84259d66Cd46123540766Be93DFE6D43130D7" : "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85") as Address,
            icon: <UsdcIcon />
        }
    ],
    evm: {
        chain: isDevelopment ? optimismSepolia : optimism,
        rpcUrl: isDevelopment ? "https://opt-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://opt-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN",
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
            aproxFromFee: 0.0025,
        },
        nearIntentInformation: {
            support: true,
            assetsId: [
                {
                    assetId: "nep245:v2_1.omni.hot.tg:10_A2ewyUyDp6qsue1jqZsGypkCxRJ",
                    name: "USDC",
                    decimals: 6
                }
            ],
            needMemo: false
        }
    }
}