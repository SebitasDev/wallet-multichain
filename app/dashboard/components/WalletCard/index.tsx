import { CardContent, Divider } from "@mui/material";
import { GradientCard } from "@/app/components/atoms/GradientCard";
import { WalletCardHeader } from "./WalletCardHeader";
import { WalletCardAddressBar } from "./WalletCardAddressBar";
import { WalletCardChainList } from "./WalletCardChainList";
import { WalletCardFooter } from "./WalletCardFooter";
import { useWalletCard } from "@/app/dashboard/hooks/wallet/useWalletCard";
import { Wallet } from "@/app/dashboard/types";

type Props = { wallet: Wallet };

export function WalletCard({ wallet }: Props) {
    const {
        expanded,
        showNameExpanded,
        visibleChains,
        copyToClipboard,
        exceedsNameLimit,
        displayName,
        toggleExpanded,
        toggleNameExpanded
    } = useWalletCard(wallet);

    return (
        <GradientCard
            sx={{
                minWidth: { xs: "78vw", sm: 320 },
                maxWidth: 360,
                flex: "0 0 auto",
                display: "inline-flex",
                mr: { xs: 1, sm: 1.75 },
                mb: { xs: 1.8, sm: 2.5 },
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
            }}
        >
            <CardContent sx={{ p: 0, position: "relative", zIndex: 1 }}>
                <WalletCardHeader
                    wallet={wallet}
                    displayName={displayName}
                    exceedsNameLimit={exceedsNameLimit}
                    showNameExpanded={showNameExpanded}
                    onToggleName={toggleNameExpanded}
                />

                <WalletCardAddressBar
                    wallet={wallet}
                    onCopy={copyToClipboard}
                />

                <WalletCardChainList visibleChains={visibleChains} />

                <Divider sx={{ mx: 3, backgroundColor: "rgba(255,255,255,0.07)" }} />

                <WalletCardFooter
                    expanded={expanded}
                    onToggle={toggleExpanded}
                    showToggle={wallet.chains.length > 2}
                />
            </CardContent>
        </GradientCard>
    );
}
