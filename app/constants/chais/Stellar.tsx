import { StellarIcon } from "@/app/components/atoms/StellarIcon";
import { Networks } from "stellar-sdk";
import { ChainConfig } from "@/app/constants/chainsInformation";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const STELLAR: ChainConfig = {
    label: "Stellar",
    icon: <StellarIcon />,
    chipLabel: "XML",
    chipColor: "#000000",
    assets: [
        {
            name: "USDC",
            decimals: 6,
            address: isDevelopment ? "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" : "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
        }
    ],
    nonEvm: {
        networkPassphrase: isDevelopment ? Networks.TESTNET : Networks.PUBLIC,
        serverURL: isDevelopment ? "https://horizon-testnet.stellar.org" : "https://horizon.stellar.org",
    },
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: false,
            aproxFromFee: isDevelopment ? 0.003 : 0.0028
        },
        nearIntentInformation: {
            support: true,
            assetsId: [
                { assetId: "nep245:v2_1.omni.hot.tg:1100_111bzQBB65GxAPAVoxqmMcgYo5oS3txhqs1Uh1cgahKQUeTUq1TJu", name: "USDC", decimals: 6 }
            ],
            needMemo: true
        }
    }
}