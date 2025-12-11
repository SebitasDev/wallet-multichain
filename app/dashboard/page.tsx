"use client";

import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { HeroBanner } from "./components/HeroBanner";
import { AddSecretModal } from "./components/AddSecretModal";
import { SendMoneyModal } from "./components/SendMoneyModal";
import { ReceiveModal } from "./components/ReceiveModal";
import SendIcon from "@mui/icons-material/Send";
import DownloadIcon from "@mui/icons-material/Download";
import AddIcon from "@mui/icons-material/Add";

import { AddressCard } from "./components/AddressCard";
import { useSendModalState } from "@/app/dashboard/store/useSendModalState";
import { useModalStore } from "@/app/store/useModalStore";
import { useWalletStore } from "@/app/store/useWalletsStore";

import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { PasswordModal } from "./components/PasswordModal";
import {XOContractsProvider} from "@/app/dashboard/hooks/useXOConnect";
import {EmbeddedProvider} from "@/app/dashboard/hooks/embebed";
import {GenerateWalletButton} from "@/app/dashboard/components/GenerateWalletButton";
import {SendMoneyMainWallet} from "@/app/dashboard/components/SendMoneyMainWallet";
import {CrossChainTransferModal} from "@/app/dashboard/components/CrossChainTransferModal";

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
                            <Box
                                sx={{
                                    maxWidth: 1200,
                                    width: "100%",
                                    mx: "auto",
                                    display: "flex",
                                    flexDirection: { xs: "column", sm: "row" },
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: { xs: 2.5, sm: 3 },
                                    px: { xs: 3, md: 4 },
                                    py: { xs: 2.5, md: 3 },
                                    borderRadius: { xs: 3, md: "5rem" },
                                    background: "rgba(15, 18, 40, 0.6)",
                                    backdropFilter: "blur(20px)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                }}
                            >
                                <Stack
                                    spacing={1}
                                    sx={{
                                        alignItems: { xs: "center", sm: "flex-start" },
                                        textAlign: { xs: "center", sm: "left" },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 54,
                                            height: 54,
                                            borderRadius: "50%",
                                            background: "linear-gradient(135deg, #5d2de9, #32d3ff)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#fff",
                                            fontWeight: 800,
                                            letterSpacing: 0.2,
                                        }}
                                    >
                                        M
                                    </Box>
                                    <Typography
                                        variant="h6"
                                        sx={{ fontWeight: 700, color: "#fff", letterSpacing: 0.2 }}
                                    >
                                        MultiChain Wallet
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "rgba(255,255,255,0.75)", maxWidth: 460 }}
                                    >
                                        Gestiona todas tus wallets y chains desde un solo lugar.
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: "center", sm: "flex-start" }}>
                                        {["6 chains", "3 wallets hijas", "Solo USDC"].map((chip) => (
                                            <Box
                                                key={chip}
                                                sx={{
                                                    background: "rgba(255,255,255,0.08)",
                                                    color: "#fff",
                                                    borderRadius: "999px",
                                                    fontSize: 12,
                                                    px: 1.5,
                                                    py: 0.5,
                                                }}
                                            >
                                                {chip}
                                            </Box>
                                        ))}
                                    </Stack>
                                </Stack>

                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: "16px",
                                        width: { xs: "100%", sm: "auto" },
                                        flexWrap: "wrap",
                                        rowGap: 1.5,
                                    }}
                                >
                                    <Button
                                        onClick={() => {
                                            if (!wallets[0]) {
                                                toast.error("Primero agrega una wallet de origen.");
                                                return;
                                            }
                                            setSendModal(true);
                                        }}
                                        sx={{
                                            width: 90,
                                            minWidth: 90,
                                            maxWidth: 90,
                                            height: 90,
                                            borderRadius: 18,
                                            backgroundColor: "#252525",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 0.75,
                                            textTransform: "none",
                                            boxShadow: "none",
                                            border: "none",
                                            color: "#ffffff",
                                            "&:hover": { backgroundColor: "#303030" },
                                            "&:active": { backgroundColor: "#383838" },
                                        }}
                                    >
                                        <SendIcon sx={{ fontSize: 26, color: "#BFBFBF" }} />
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 500,
                                                color: "#ffffff",
                                                textAlign: "center",
                                            }}
                                        >
                                            Enviar
                                        </Typography>
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (!wallets.length) {
                                                toast.error("Primero agrega una wallet.");
                                                return;
                                            }
                                            openReceive();
                                        }}
                                        sx={{
                                            width: 90,
                                            minWidth: 90,
                                            maxWidth: 90,
                                            height: 90,
                                            borderRadius: 18,
                                            backgroundColor: "#252525",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 0.75,
                                            textTransform: "none",
                                            boxShadow: "none",
                                            border: "none",
                                            color: "#ffffff",
                                            "&:hover": { backgroundColor: "#303030" },
                                            "&:active": { backgroundColor: "#383838" },
                                        }}
                                    >
                                        <DownloadIcon sx={{ fontSize: 26, color: "#BFBFBF" }} />
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 500,
                                                color: "#ffffff",
                                                textAlign: "center",
                                            }}
                                        >
                                            Recibir
                                        </Typography>
                                    </Button>
                                    <Button
                                        onClick={() => openAdd()}
                                        sx={{
                                            width: 90,
                                            minWidth: 90,
                                            maxWidth: 90,
                                            height: 90,
                                            borderRadius: 18,
                                            backgroundColor: "#252525",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 0.75,
                                            textTransform: "none",
                                            boxShadow: "none",
                                            border: "none",
                                            color: "#ffffff",
                                            "&:hover": { backgroundColor: "#303030" },
                                            "&:active": { backgroundColor: "#383838" },
                                        }}
                                    >
                                        <AddIcon sx={{ fontSize: 26, color: "#BFBFBF" }} />
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 500,
                                                color: "#ffffff",
                                                textAlign: "center",
                                            }}
                                        >
                                            Agregar Address
                                        </Typography>
                                    </Button>
                                </Box>
                            </Box>

                            <HeroBanner background={"var(--gradient-hero)"} />

                            <Box sx={{ textAlign: "center", mt: 3, display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                                <GenerateWalletButton />
                                <SendMoneyMainWallet />
                                <CrossChainTransferModal />
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
