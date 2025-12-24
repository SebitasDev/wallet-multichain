import { worldchain, worldchainSepolia } from "viem/chains";
import { Address } from "abitype";
import { WorldChainIcon } from "@/app/components/atoms/WorldChainIcon";
import { ChainConfig } from "@/app/types/chain";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const WORLD_CHAIN: ChainConfig = {
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: (isDevelopment ? "0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88" : "0x79A02482A880bCe3F13E09da970dC34dB4cD24D1") as Address,
            icon: <UsdcIcon />
        }
    ],
    evm: {
        chain: isDevelopment ? worldchainSepolia : worldchain,
        rpcUrl: isDevelopment ? worldchainSepolia.rpcUrls.default.http[0] : worldchain.rpcUrls.default.http[0],
    },
    label: "World Chain",
    icon: <WorldChainIcon />,
    chipLabel: "WORLD",
    chipColor: "#000000",
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: false,
            cCTPInformation: {
                supportCCTP: true,
                domain: 14,
            },
            aproxFromFee: isDevelopment ? 0.003 : 0.036,
        },
        nearIntentInformation: null
    }
}