
"use client";

import { Box } from "@mui/material";
import { AddressCard } from "./components/AddressCard";
import { TopBar } from "./components/TopBar";
import { HeroBanner } from "./components/HeroBanner";
import { AddSecretModal } from "./components/AddSecretModal";
import { SendMoneyModal } from "./components/SendMoneyModal";
import { ReceiveModal } from "./components/ReceiveModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {useSendModalState} from "@/app/dashboard/store/useSendModalState";
import {useModalStore} from "@/app/store/useModalStore";
import {useWalletStore} from "@/app/store/useWalletsStore";
import {useGeneralWallet} from "@/app/dashboard/hooks/useGeneralWallet";

export default function Dashboard() {
    const { addOpen, receiveOpen, openAdd, openReceive, closeAdd, closeReceive } = useModalStore();
    const { setSendModal } = useSendModalState();
    const { wallets } = useWalletStore();
    const walletNamesMap = wallets.reduce<Record<string, string>>((acc, w) => {
        acc[w.address.toLowerCase()] = w.name;
        return acc;
    }, {});
    const heroBg = "var(--gradient-hero)";
    useGeneralWallet();

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#141516ff" }}>
            <TopBar
                onAdd={() => {
                    openAdd();
                }}
                onSend={() => {
                    //resetSendFields();
                    //setFromAddress(wallets[0]?.address ?? "");
                    if (!wallets[0]) {
                        toast.error("Primero agrega una wallet de origen.");
                        return;
                    }
                    setSendModal(true);
                }}
                onReceive={() => {
                    if (!wallets.length) {
                        toast.error("Primero agrega una wallet.");
                        return;
                    }
                    openReceive();
                }}
            />

            <HeroBanner background={heroBg}/>

            <Box
                sx={{
                    maxWidth: 1200,
                    mx: "auto",
                    px: { xs: 2.5, md: 4 },
                    pb: 6,
                    mt: 4,
                }}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(auto-fit, minmax(340px, 1fr))",
                        },
                        gap: { xs: 2.5, md: 3 },
                        alignItems: "start",
                    }}
                >
                    {wallets.map((wallet) => (
                        <Box key={wallet.address} sx={{ minWidth: 0 }}>
                            <AddressCard address={wallet.address} walletName={wallet.name}/>
                        </Box>
                    ))}
                </Box>
            </Box>

            <AddSecretModal
                open={addOpen}
                onClose={() => {
                    closeAdd();
                }}
            />
            <SendMoneyModal
                walletNames={walletNamesMap}
            />
            <ReceiveModal
                open={receiveOpen}
                wallets={wallets as any}
                onClose={() => closeReceive()}
            />
            <ToastContainer position="top-right" />
        </Box>
    );
}
