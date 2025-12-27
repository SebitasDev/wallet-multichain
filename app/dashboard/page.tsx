"use client";

import { Box, Typography } from "@mui/material";
import { HeroBanner } from "./components/HeroBanner";
import { AddSecretModal } from "./components/AddSecretModal";
import { SendMoneyModal } from "./components/SendMoneyModal";
import { ReceiveModal } from "./components/ReceiveModal";
import { AddressCard } from "./components/AddressCard";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { useWalletStore } from "@/app/store/useWalletsStore";



import { CrossChainTransferModal } from "@/app/dashboard/components/CrossChainTransferModal";
import dynamic from "next/dynamic";
import { TopBar } from "@/app/dashboard/components/TopBar";
import { SidebarMainActions } from "@/app/dashboard/components/SidebarMainActions";

const DashboardTour = dynamic(
    () => import("@/app/dashboard/components/DashboardTour").then((mod) => mod.DashboardTour),
    { ssr: false }
);

export default function Dashboard() {
    const { addOpen, receiveOpen, closeAdd, closeReceive } = useDashboardModalsStore();

    // Use selectors for better performance and explicit dependency
    const wallets = useWalletStore(s => s.wallets);

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <DashboardTour />
            <TopBar />

            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 3,
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    maxWidth: 1200,
                    mx: "auto",
                }}
            >
                <Box id="dashboard-hero" sx={{ width: "100%", maxWidth: 600 }}>
                    <HeroBanner />
                </Box>

                <Box
                    id="main-wallet-actions"
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "stretch",
                        gap: { xs: 1.5, md: 2 },
                        width: "100%",
                        maxWidth: { xs: 320, md: 360 },
                        mx: { xs: "auto", md: 0 },
                    }}
                >
                    {/* Título con línea decorativa */}
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            mb: 1,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: { xs: 16, md: 18 },
                                fontWeight: 900,
                                textTransform: "uppercase",
                                letterSpacing: 1,
                                color: "#000000",
                                mb: 1,
                            }}
                        >
                            Funciones Childrens Wallets
                        </Typography>
                        <Box
                            sx={{
                                width: "100%",
                                maxWidth: 200,
                                height: 4,
                                background: "#000000",
                                borderRadius: 1,
                                boxShadow: "2px 2px 0px #00DC8C",
                            }}
                        />
                    </Box>



                    <CrossChainTransferModal trigger={<Box sx={{ display: "none" }} />} />
                    <SidebarMainActions />
                </Box>
            </Box>

            <Box
                id="wallets-list"
                sx={{
                    maxWidth: 1200,
                    mx: "auto",
                    px: { xs: 2, md: 3 },
                    mt: 4,
                    display: "flex",
                    flexWrap: { xs: "nowrap", md: "wrap" },
                    gap: { xs: 2, md: 3 },
                    justifyContent: { xs: "flex-start", md: "flex-start" },
                    overflowX: { xs: "auto", md: "visible" },
                    scrollSnapType: "x mandatory",
                    scrollPadding: { xs: 16, md: 24 },
                    WebkitOverflowScrolling: "touch",
                    "&::-webkit-scrollbar": { display: "none" },
                    pb: { xs: 2, md: 0 },
                }}
            >
                {wallets.map(w => (
                    <Box
                        key={w.address}
                        sx={{
                            flex: {
                                xs: "0 0 82%",
                                sm: "0 0 68%",
                                md: "1 1 calc(33.33% - 16px)",
                            },
                            minWidth: 0,
                            scrollSnapAlign: "start",
                            scrollSnapStop: { xs: "always", md: "unset" },
                        }}
                    >
                        <AddressCard address={w.address} walletName={w.name} />
                    </Box>
                ))}
            </Box>

            <AddSecretModal open={addOpen} onClose={closeAdd} />
            <SendMoneyModal />
            <ReceiveModal open={receiveOpen} wallets={wallets} onClose={closeReceive} />
        </Box>
    );
}
