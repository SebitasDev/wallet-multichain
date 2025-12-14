import {polygonAmoy} from "viem/chains";
import {polygon} from "wagmi/chains";
import PolygonIcon from "@/app/components/atoms/PolygonIcon";
import {Address} from "abitype";
import {ChainConfig} from "@/app/constants/chainsInformation";

const isDevelopment = process.env.NODE_ENV === "development";

export const POLYGON: ChainConfig = {
    usdc: (isDevelopment ? "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" : "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359") as Address,
    chain: isDevelopment ? polygonAmoy : polygon,
    domain: 7,
    aproxFromFee: isDevelopment ? 0.03 : 0.0035,
    label: "Polygon",
    icon: <PolygonIcon />,
    rpcUrl: isDevelopment ? "https://polygon-amoy.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" : "https://polygon-mainnet.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN",
    chipLabel: "POL",
    chipColor: "#8247E5",
    crossChainInformation: {
        supportCCTP: true,
        supportCirclePaymaster: true
    }
}