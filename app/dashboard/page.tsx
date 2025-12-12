"use client";

import { useEffect, useState } from "react";
import {Box, Typography } from "@mui/material";
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
import {ToastContainerCustom} from "@/app/components/atoms/ToastContainerCustom";

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
                                <Box sx={{ width: "100%", maxWidth: 600 }}>
                                    <HeroBanner />
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "stretch",
                                        gap: { xs: 1.5, md: 2 },
                                        width: "100%",
                                        maxWidth: { xs: 280, md: 300 },
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
                                            Funciones Main Wallet
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

                                    <GenerateWalletButton />
                                    <SendMoneyMainWallet />
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

                            <ToastContainerCustom/>
                        </>
                    </XOContractsProvider>
                </EmbeddedProvider>
            )}
        </Box>
    );
}
