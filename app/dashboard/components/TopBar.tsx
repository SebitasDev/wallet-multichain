"use client";

import {Avatar, Box, Button, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import DownloadIcon from "@mui/icons-material/Download";
import SavingsIcon from "@mui/icons-material/Savings";
import {useModalStore} from "@/app/store/useModalStore";
import {useSendModalState} from "@/app/dashboard/store/useSendModalState";
import {useWalletStore} from "@/app/store/useWalletsStore";
import {toast } from "react-toastify";
import { useRouter } from "next/navigation";

export function TopBar() {
    const router = useRouter();
    const { openAdd, openReceive } = useModalStore();
    const { setSendModal } = useSendModalState();
    const { wallets } = useWalletStore();
    return (
        <Box
            sx={{
                width: "100%",
                mx: "auto",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: "center",
                gap: { xs: 2.5, sm: 3 },
                px: { xs: 3, md: 4 },
                py: { xs: 2.5, md: 3 },
                background: "#ffffff",
                border: "3px solid #000000",
                borderRadius: 4,
                boxShadow: "6px 6px 0px #000000",
                mb: 2,
                mt: 1
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center">
                {/* Avatar */}
                <Avatar
                    src="https://i.postimg.cc/0jx6tjVZ/photo-5033044889268063043-y.jpg"
                    sx={{
                        width: 54,
                        height: 54,
                        border: "2px solid #000000",
                    }}
                />

                {/* Badges */}
                <Stack spacing={1}>
                    <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        justifyContent={{ xs: "flex-start", sm: "flex-start" }}
                    >
                        {[
                            { text: "6 chains", bgColor: "#f5f5f5" },
                            { text: "$0.01 Fee", bgColor: "#f5f5f5" },
                        ].map((chip) => (
                            <Box
                                key={chip.text}
                                sx={{
                                    background: chip.bgColor,
                                    color: "#000000",
                                    borderRadius: "999px",
                                    fontSize: 12,
                                    px: 1.6,
                                    py: 0.6,
                                    fontWeight: 600,
                                    border: "2px solid #000000",
                                }}
                            >
                                {chip.text}
                            </Box>
                        ))}
                    </Stack>
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
                {/* ENVIAR */}
                <Button
                    onClick={() => {
                        if (!wallets[0]) return toast.error("Primero agrega una wallet de origen.");
                        setSendModal(true);
                    }}
                    sx={{
                        width: 90,
                        height: 90,
                        borderRadius: 3,
                        backgroundColor: "#7852FF",
                        border: "3px solid #000000",
                        boxShadow: "4px 4px 0px #000000",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 0.75,
                        textTransform: "none",
                        color: "#fff",
                        transition: "all 0.2s",
                        "&:hover": {
                            backgroundColor: "#6342E6",
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000",
                        },
                    }}
                >
                    <SendIcon sx={{ fontSize: 28, color: "white" }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Enviar</Typography>
                </Button>

                {/* RECIBIR */}
                <Button
                    onClick={() => {
                        if (!wallets.length) return toast.error("Primero agrega una wallet.");
                        openReceive();
                    }}
                    sx={{
                        width: 90,
                        height: 90,
                        borderRadius: 3,
                        backgroundColor: "#3CD2FF",
                        border: "3px solid #000000",
                        boxShadow: "4px 4px 0px #000000",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 0.75,
                        textTransform: "none",
                        color: "#000",
                        transition: "all 0.2s",
                        "&:hover": {
                            backgroundColor: "#2CC2EF",
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000",
                        },
                    }}
                >
                    <DownloadIcon sx={{ fontSize: 28, color: "#000000" }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Recibir</Typography>
                </Button>

                {/* AGREGAR ADDRESS */}
                <Button
                    onClick={() => openAdd()}
                    sx={{
                        width: 90,
                        height: 90,
                        borderRadius: 3,
                        backgroundColor: "#00DC8C",
                        border: "3px solid #000000",
                        boxShadow: "4px 4px 0px #000000",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 0.75,
                        textTransform: "none",
                        color: "#000",
                        transition: "all 0.2s",
                        "&:hover": {
                            backgroundColor: "#00CC7C",
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000",
                        },
                    }}
                >
                    <AddIcon sx={{ fontSize: 28, color: "#000000" }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 600, textAlign: "center" }}>
                        Agregar Address
                    </Typography>
                </Button>

                {/* SAVINGS */}
                <Button
                    onClick={() => router.push("/dashboard/savings")}
                    sx={{
                        width: 90,
                        height: 90,
                        borderRadius: 3,
                        backgroundColor: "#FFD700",
                        border: "3px solid #000000",
                        boxShadow: "4px 4px 0px #000000",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 0.75,
                        textTransform: "none",
                        color: "#000",
                        transition: "all 0.2s",
                        "&:hover": {
                            backgroundColor: "#E6C200",
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000",
                        },
                    }}
                >
                    <SavingsIcon sx={{ fontSize: 28, color: "#000000" }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 600, textAlign: "center" }}>
                        Savings
                    </Typography>
                </Button>
            </Box>

        </Box>
    );
}