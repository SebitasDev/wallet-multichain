import { ChainBadgeList } from "@/app/components/molecules/ChainBadgeList";
import { ChainInfo } from "@/app/dashboard/types";

interface WalletCardChainListProps {
    visibleChains: ChainInfo[];
}

export const WalletCardChainList = ({ visibleChains }: WalletCardChainListProps) => {
    return <ChainBadgeList chains={visibleChains} />;
};
