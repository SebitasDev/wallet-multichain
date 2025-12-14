import {avalanche, avalancheFuji} from "viem/chains";
import {AvalancheIcon} from "@/app/components/atoms/AvalancheIcon";
import {Address} from "abitype";
import {ChainConfig} from "@/app/constants/chainsInformation";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const AVALANCHE: ChainConfig = {
    usdc: (isDevelopment ? "0x5425890298aed601595a70AB815c96711a31Bc65" : "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E") as Address,
    chain: isDevelopment ? avalancheFuji : avalanche,
    domain: 1,
    aproxFromFee: isDevelopment ? 10000 : 10000,
    label: "Avalanche",
    icon: <AvalancheIcon />,
    rpcUrl: isDevelopment ? avalancheFuji.rpcUrls.default.http[0] : avalanche.rpcUrls.default.http[0],
    chipLabel: "AVAX",
    chipColor: "#E84142",
    crossChainInformation: {
        supportCCTP: true,
        supportCirclePaymaster: true
    }
}