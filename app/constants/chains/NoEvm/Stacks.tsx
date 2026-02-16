 import { ChainConfig } from "@/app/types/chain";
import { UsdcIcon } from "@/app/components/atoms/UsdcIcon";

// Placeholder icon until provided
function StacksIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" >
            <circle cx="12" cy="12" r="12" fill="#5546FF" />
            <path d="M7 16V10H17V16H15.5V11.5H8.5V16H7Z" fill="white" />
            <path d="M12 4.5L17 8H7L12 4.5Z" fill="white" />
        </svg>
    )
}

export const STACKS: ChainConfig = {
    label: "Stacks",
    icon: <StacksIcon />,
    chipLabel: "STX",
    chipColor: "#5546FF",
    assets: [
        {
            name: "USDCx", // Explicitly named USDCx
            decimals: 6,
            address: "native", // Placeholder or specific contract if known
            icon: <UsdcIcon />,
            coingeckoId: "usd-coin"
        }
    ],
    nonEvm: {
        // Add specific Stacks RPCs/Config if needed, currently not used by transferManager but good for metadata
        rpcUrl: "https://api.mainnet.hiro.so",
        
    },
    crossChainInformation: {
        circleInformation: {
            supportCirclePaymaster: false,
            aproxFromFee: 0
        },
        nearIntentInformation: null
    }
}
