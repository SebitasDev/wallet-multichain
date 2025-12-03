"use client";

import { useEffect, useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AddressCard } from "./components/AddressCard";
import { TopBar } from "./components/TopBar";
import { HeroBanner } from "./components/HeroBanner";
import { AddSecretModal } from "./components/AddSecretModal";
import { SendMoneyModal } from "./components/SendMoneyModal";
import { ReceiveModal } from "./components/ReceiveModal";

import { useSendModalState } from "@/app/dashboard/store/useSendModalState";
import { useModalStore } from "@/app/store/useModalStore";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useGeneralWallet } from "@/app/dashboard/hooks/useGeneralWallet";

export default function Dashboard() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { addOpen, receiveOpen, openAdd, openReceive, closeAdd, closeReceive } = useModalStore();
    const { setSendModal } = useSendModalState();
    const { wallets } = useWalletStore();
    const walletNamesMap = wallets.reduce<Record<string, string>>((acc, w) => {
        acc[w.address.toLowerCase()] = w.name;
        return acc;
    }, {});

    const heroBg = "var(--gradient-hero)";
    useGeneralWallet();

    if (!mounted) return null;

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#141516ff" }}>
            <TopBar
                onAdd={() => openAdd()}
                onSend={() => {
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

            <HeroBanner background={heroBg} />

            <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2.5, md: 4 }, mt: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="flex-start">
                    <Button
                        component={Link}
                        href="/offramp"
                        variant="contained"
                        sx={{
                            textTransform: "none",
                            fontWeight: 800,
                            borderRadius: 2,
                            background: "linear-gradient(135deg, #0f7bff, #0ac5a8)",
                            boxShadow: "0 10px 24px rgba(15,123,255,0.3)",
                            px: 3,
                            py: 1.1,
                        }}
                    >
                        Ir a Offramp
                    </Button>
                </Stack>
            </Box>

            <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2.5, md: 4 }, pb: 6, mt: 4 }}>
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
                    {wallets.map(wallet => (
                        <Box key={wallet.address} sx={{ minWidth: 0 }}>
                            <AddressCard address={wallet.address} walletName={wallet.name} />
                        </Box>
                    ))}
                </Box>
            </Box>

            <AddSecretModal
                open={addOpen}
                onClose={() => closeAdd()}
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
