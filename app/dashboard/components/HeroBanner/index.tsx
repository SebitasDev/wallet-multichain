import { Box } from "@mui/material";
import { useHeroBanner } from "@/app/dashboard/hooks/useHeroBanner";
import { HeroBannerMainWallet } from "./HeroBannerMainWallet";
import { HeroBannerTotalBalance } from "./HeroBannerTotalBalance";

export function HeroBanner() {
    const {
        activeWallet,
        setActiveWallet,
        isRefreshing,
        wallets,
        xoClient,
        burnedBalances,
        burnedAddresses,
        totalAvailableBalance,
        totalFees,
        hasCalculatedTotal,
        handleRefreshBalances,
    } = useHeroBanner();

    return (
        <Box
            sx={{
                maxWidth: 600,
                width: "100%",
                position: "relative",
                overflow: "hidden",
                background: "#ffffff",
                color: "#000000",
                textAlign: "center",
                py: { xs: 3, md: 3.5 },
                px: { xs: 2.5, md: 3 },
                borderRadius: 4,
                border: "3px solid #000000",
                boxShadow: "6px 6px 0px #000000",
            }}
        >
            <HeroBannerMainWallet
                activeWallet={activeWallet}
                setActiveWallet={setActiveWallet}
                burnedBalances={burnedBalances}
                burnedAddresses={burnedAddresses}
                xoClientAlias={xoClient?.alias}
            />

            <HeroBannerTotalBalance
                isRefreshing={isRefreshing}
                handleRefreshBalances={handleRefreshBalances}
                totalAvailableBalance={totalAvailableBalance}
                totalFees={totalFees}
                walletsCount={wallets.length}
                hasCalculatedTotal={hasCalculatedTotal}
                walletsConnected={wallets.length > 0}
            />
        </Box>
    );
}
