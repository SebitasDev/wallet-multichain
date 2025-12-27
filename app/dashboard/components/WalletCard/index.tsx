import { Card, CardContent, Divider } from "@mui/material";
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
        <Card
            sx={{
                minWidth: { xs: "78vw", sm: 320 },
                maxWidth: 360,
                flex: "0 0 auto",
                display: "inline-flex",
                mr: { xs: 1, sm: 1.75 },
                mb: { xs: 1.8, sm: 2.5 },
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
                position: "relative",
                isolation: "isolate",
                borderRadius: 22,
                overflow: "hidden",
                boxShadow:
                    "0 25px 70px rgba(0,0,0,0.78), 0 12px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
                border: "1px solid rgba(126,87,255,0.22)",
                backgroundColor: "#0a0818",
                backgroundImage:
                    "radial-gradient(circle at 18% 12%, rgba(118,87,255,0.24) 0%, transparent 26%), radial-gradient(circle at 82% 0%, rgba(255,72,160,0.22) 0%, transparent 22%), linear-gradient(185deg, #0f0a1f 0%, #0c0a1a 45%, #060510 100%)",
                color: "#f9fafb",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: -6,
                    borderRadius: "inherit",
                    background: "linear-gradient(135deg, rgba(126,87,255,0.38), rgba(255,72,160,0.32))",
                    filter: "blur(20px)",
                    opacity: 0.4,
                    zIndex: 0,
                },
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
        </Card>
    );
}
