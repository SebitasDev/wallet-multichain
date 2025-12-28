import { unichain, unichainSepolia } from "viem/chains";
import { UnichainIcon } from "@/app/components/atoms/UnichainIcon";
import { Address } from "abitype";
import { ChainConfig } from "@/app/types/chain";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const UNICHAIN: ChainConfig = {
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: (isDevelopment ? "0x31d0220469e10c4E71834a79b1f276d740d3768F" : "0x078D782b760474a361dDA0AF3839290b0EF57AD6") as Address,
            icon: <UsdcIcon />
        }
    ],
    evm: {
        chain: isDevelopment ? unichainSepolia : unichain,
        rpcUrl: isDevelopment ? "https://unichain-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://unichain-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN",
        supports7702: true,
    },
    label: "Unichain",
    icon: <UnichainIcon />,
    chipLabel: "UNI",
    chipColor: "#FF007A",
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: true,
            cCTPInformation: {
                supportCCTP: true,
                domain: 10,
            },
            aproxFromFee: 0,
        },
        nearIntentInformation: null
    }
}