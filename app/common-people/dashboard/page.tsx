"use client";

import { Container, Stack, Box } from "@mui/material";
import { WalletHeader } from "../components/WalletHeader";
import { TransactionHistory } from "../components/TransactionHistory";

import { BottomNavigation } from "../components/BottomNavigation";
import { CommonSendModalsContainer } from "../components/CommonSendModalsContainer";
import { SimpleReceiveModal } from "../components/SimpleReceiveModal";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { CommonDashboardTour } from "../components/CommonDashboardTour";

export default function CommonPeopleDashboard() {
    const { receiveOpen, closeReceive } = useDashboardModalsStore();
    const wallets = useWalletStore(s => s.wallets);

    return (
        <Box sx={{
            minHeight: "100vh",
            backgroundColor: "white",
            py: 4,
            pb: { xs: 12, md: 4 }, // Reduce bottom padding on desktop
            pl: { xs: 0, md: "260px" } // Add left padding for sidebar on desktop
        }}>
            <Container maxWidth="md">
                <Stack spacing={4}>
                    <WalletHeader />

                    <TransactionHistory />
                </Stack>
            </Container>
            <BottomNavigation />
            <CommonSendModalsContainer />

            <SimpleReceiveModal
                open={receiveOpen}
                onClose={closeReceive}
            />
            <CommonDashboardTour />
        </Box>
    );
}
