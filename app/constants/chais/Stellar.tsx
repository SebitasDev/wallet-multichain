import { StellarIcon } from "@/app/components/atoms/StellarIcon";
import { Networks } from "stellar-sdk";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const STELLAR = {
    usdc: isDevelopment ? "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" : "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    code: "USDC",
    label: "Stellar",
    networkPassphrase: isDevelopment ? Networks.TESTNET : Networks.PUBLIC,
    icon: <StellarIcon />,
    chipLabel: "XML",
    serverURL: isDevelopment ? "https://horizon-testnet.stellar.org" : "https://horizon.stellar.org",
    chipColor: "#000000",
    crossChainInformation: {
        supportCCTP: false,
        supportCirclePaymaster: false
    },
    aproxFromFee: isDevelopment ? 0.003 : 0.0028
}