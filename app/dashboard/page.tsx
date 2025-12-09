"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { TopBar } from "./components/TopBar";
import { HeroBanner } from "./components/HeroBanner";
import { AddSecretModal } from "./components/AddSecretModal";
import { SendMoneyModal } from "./components/SendMoneyModal";
import { ReceiveModal } from "./components/ReceiveModal";

import { AddressCard } from "./components/AddressCard";
import { useSendModalState } from "@/app/dashboard/store/useSendModalState";
import { useModalStore } from "@/app/store/useModalStore";
import { useWalletStore } from "@/app/store/useWalletsStore";

import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { PasswordModal } from "./components/PasswordModal";
import {XOContractsProvider} from "@/app/dashboard/hooks/useXOConnect";
import {EmbeddedProvider} from "@/app/dashboard/hooks/embebed";
import {GenerateWalletButton} from "@/app/dashboard/components/GenerateWalletButton";
import {Test} from "@/app/components/test";

export default function Dashboard() {
    const [mounted, setMounted] = useState(false);
    const [askPassword, setAskPassword] = useState(true);
    const [mode, setMode] = useState<"create" | "unlock">("unlock");

    const encrypted = useWalletPasswordStore(s => s.encryptedPassword);
    const currentPassword = useWalletPasswordStore(s => s.currentPassword);

    const { addOpen, receiveOpen, openAdd, openReceive, closeAdd, closeReceive } = useModalStore();
    const { setSendModal } = useSendModalState();
    const { wallets } = useWalletStore();


    useEffect(() => {
        setMounted(true);
        if (!encrypted) {
            localStorage.removeItem("wallets");
            setMode("create");
            setAskPassword(true);
        } else {
            localStorage.removeItem("wallets");
            setMode("unlock");
            setAskPassword(true);
        }
    }, [encrypted]);

    if (!mounted) return null;

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#141516ff" }}>
            {/* MODAL DE PASSWORD */}
            <PasswordModal
                open={askPassword}
                mode={mode}
                onSuccess={() => setAskPassword(false)}
            />

            {/* 🔒 Bloquea el dashboard si no validó contraseña */}
            {!askPassword && (
                <EmbeddedProvider>
                    <XOContractsProvider password={currentPassword!}>
                        <>
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

                            <HeroBanner background={"var(--gradient-hero)"} />

                            <Box sx={{ textAlign: "center", mt: 3 }}>
                                <GenerateWalletButton />
                            </Box>

                            <Box
                                sx={{
                                    maxWidth: 1200,
                                    mx: "auto",
                                    px: { xs: 2, md: 4 },
                                    mt: 4,

                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: { xs: 2, md: 3 },
                                    justifyContent: { xs: "center", md: "flex-start" },
                                }}
                            >
                                {wallets.map(w => (
                                    <Box
                                        key={w.address}
                                        sx={{
                                            flex: {
                                                xs: "1 1 100%",
                                                sm: "1 1 calc(50% - 16px)",
                                                md: "1 1 calc(33.33% - 16px)",
                                            },
                                            minWidth: 0,
                                        }}
                                    >
                                        <AddressCard address={w.address} walletName={w.name} />
                                    </Box>
                                ))}
                            </Box>

                            <Test/>

                            <AddSecretModal open={addOpen} onClose={closeAdd} />
                            <SendMoneyModal walletNames={{}} />
                            <ReceiveModal open={receiveOpen} wallets={wallets} onClose={closeReceive} />

                            <ToastContainer position="top-right" />
                        </>
                    </XOContractsProvider>
                </EmbeddedProvider>
            )}
        </Box>
    );
}
