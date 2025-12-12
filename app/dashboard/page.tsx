"use client";

import { useEffect, useState } from "react";
import {Box } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { HeroBanner } from "./components/HeroBanner";
import { AddSecretModal } from "./components/AddSecretModal";
import { SendMoneyModal } from "./components/SendMoneyModal";
import { ReceiveModal } from "./components/ReceiveModal";
import { AddressCard } from "./components/AddressCard";
import { useModalStore } from "@/app/store/useModalStore";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { PasswordModal } from "./components/PasswordModal";
import {XOContractsProvider} from "@/app/dashboard/hooks/useXOConnect";
import {EmbeddedProvider} from "@/app/dashboard/hooks/embebed";
import {GenerateWalletButton} from "@/app/dashboard/components/GenerateWalletButton";
import {SendMoneyMainWallet} from "@/app/dashboard/components/SendMoneyMainWallet";
import {CrossChainTransferModal} from "@/app/dashboard/components/CrossChainTransferModal";
import {TopBar} from "@/app/dashboard/components/TopBar";

export default function Dashboard() {
    const [mounted, setMounted] = useState(false);
    const [askPassword, setAskPassword] = useState(true);
    const [mode, setMode] = useState<"create" | "unlock">("unlock");

    const encrypted = useWalletPasswordStore(s => s.encryptedPassword);
    const currentPassword = useWalletPasswordStore(s => s.currentPassword);

    const { addOpen, receiveOpen, closeAdd, closeReceive } = useModalStore();
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
        <Box sx={{ minHeight: "100vh"}}>
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

                            <TopBar />

                            <HeroBanner/>

                            <Box
                                sx={{
                                    mt: 3,
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 2,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Box sx={{ flex: "0 0 auto" }}>
                                    <GenerateWalletButton />
                                </Box>
                                <Box sx={{ flex: "0 0 auto" }}>
                                    <SendMoneyMainWallet />
                                </Box>
                                <Box sx={{ flex: "0 0 auto" }}>
                                    <CrossChainTransferModal />
                                </Box>
                            </Box>

                            <Box
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
