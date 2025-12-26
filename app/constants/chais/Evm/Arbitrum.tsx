import { arbitrum, arbitrumSepolia } from "viem/chains";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import { Address } from "abitype";
import { ChainConfig } from "@/app/types/chain";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const ARBITRUM: ChainConfig = {
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: (isDevelopment ? "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" : "0xaf88d065e77c8cC2239327C5EDb3A432268e5831") as Address,
            icon: <UsdcIcon />
        }
    ],
    evm: {
        chain: isDevelopment ? arbitrumSepolia : arbitrum,
        rpcUrl: isDevelopment ? "https://arb-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://arb-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN",
    },
    label: "Arbitrum",
    icon: <ArbIcon />,
    chipLabel: "ARB",
    chipColor: "#28A0F0",
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: true,
            cCTPInformation: {
                supportCCTP: true,
                domain: 3,
            },
            aproxFromFee: 0,
        },
        nearIntentInformation: {
            support: true,
            assetsId: [
                {
                    assetId: "nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near",
                    name: "USDC",
                    decimals: 6
                }
            ],
            needMemo: false
        }
    }
}