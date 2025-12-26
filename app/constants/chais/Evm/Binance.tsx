import { bsc, bscTestnet } from "viem/chains";
import { ChainConfig } from "@/app/types/chain";
import { BnbIcon } from "@/app/components/atoms/BnbIcon";
import { UsdtIcon } from "@/app/components/atoms/UsdtIcon";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

export const BNB: ChainConfig = {
    label: "BNB",
    icon: <BnbIcon />,
    chipLabel: "BNB",
    chipColor: "#F3BA2F",
    assets: [
        {
            name: "USDC",
            decimals: 18,
            address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // BSC Mainnet USDC
            icon: <UsdcIcon />
        },
        {
            name: "USDT",
            decimals: 18,
            address: "0xb46d67fb63770052a07d5b7c14ed858a8c90f825", // BSC Mainnet USDT
            icon: <UsdtIcon />
        },
        {
            name: "BNB",
            decimals: 18,
            address: "0x0000000000000000000000000000000000000000", // Native
            icon: <BnbIcon />
        },
    ],
    evm: {
        chain: isDevelopment ? bscTestnet : bsc,
        rpcUrl: isDevelopment ? "https://data-seed-prebsc-1-s1.binance.org:8545" : "https://bsc-dataseed.binance.org",
    },
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: false,
            aproxFromFee: 0,
            cCTPInformation: {
                supportCCTP: false,
                domain: 0,
            },
        },
        nearIntentInformation: {
            support: true,
            needMemo: false,
            assetsId: [
                {
                    name: "USDC",
                    assetId: "nep245:v2_1.omni.hot.tg:56_2w93GqMcEmQFDru84j3HZZWt557r",
                    decimals: 18,
                },
                {
                    name: "USDT",
                    assetId: "nep245:v2_1.omni.hot.tg:56_2CMMyVTGZkeyNZTSvS5sarzfir6g",
                    decimals: 18,
                },
                {
                    name: "BNB",
                    assetId: "nep245:v2_1.omni.hot.tg:56_11111111111111111111",
                    decimals: 18,
                }
            ],
        },
    },
};
