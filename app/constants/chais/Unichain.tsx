import {unichain, unichainSepolia} from "viem/chains";
import {UnichainIcon} from "@/app/components/atoms/UnichainIcon";
import {Address} from "abitype";
import {ChainConfig} from "@/app/constants/chainsInformation";

const isDevelopment = process.env.NODE_ENV === "development";

export const UNICHAIN: ChainConfig = {
    usdc: (isDevelopment ? "0x31d0220469e10c4E71834a79b1f276d740d3768F" : "0x078D782b760474a361dDA0AF3839290b0EF57AD6") as Address,
    chain: isDevelopment ? unichainSepolia : unichain,
    domain: 10,
    aproxFromFee: isDevelopment ? 0.003 : 0.0028,
    label: "Unichain",
    icon: <UnichainIcon />,
    rpcUrl: isDevelopment ? "https://unichain-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://unichain-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN",
    chipLabel: "UNI",
    chipColor: "#FF007A",
    crossChainInformation: {
        supportCCTP: true,
        supportCirclePaymaster: true
    }
}