"use client";

import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import DownloadIcon from "@mui/icons-material/Download";
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { toast } from "react-toastify";

export const SidebarMainActions = () => {
    const { wallets } = useWalletStore();
    const { setSendModal } = useSendMoneyStore();
    const { openAdd, openReceive } = useDashboardModalsStore();

    const handleSend = () => {
        if (!wallets[0]) return toast.error("Primero agrega una wallet de origen.");
        setSendModal(true);
    };

    const handleReceive = () => {
        if (!wallets.length) return toast.error("Primero agrega una wallet.");
        openReceive();
    };

    const handleAdd = () => {
        openAdd();
    };

    const buttonSx = {
        width: "100%",
        height: 70,
        borderRadius: 3,
        border: "3px solid #000000",
        boxShadow: "4px 4px 0px #000000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 0.5,
        textTransform: "none",
        color: "#fff",
        transition: "all 0.2s",
        "&:hover": {
            transform: "translate(2px, 2px)",
            boxShadow: "2px 2px 0px #000000",
        },
    };

    return (
        <Box sx={{
            display: "flex",
            flexDirection: "row", // Horizontal
            gap: 2,
            width: "100%",
            flexWrap: "wrap", // Wrap on very small screens
        }}>
            {/* ENVIAR */}
            <Button
                onClick={handleSend}
                sx={{
                    flex: 1, // Fixed width -> Flex 1
                    ...buttonSx,
                    backgroundColor: "#7852FF",
                    "&:hover": {
                        ...buttonSx["&:hover"],
                        backgroundColor: "#6342E6",
                    },
                }}
            >
                <SendIcon sx={{ fontSize: 24, color: "white" }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Enviar</Typography>
            </Button>

            {/* RECIBIR */}
            <Button
                onClick={handleReceive}
                sx={{
                    flex: 1,
                    ...buttonSx,
                    backgroundColor: "#3CD2FF",
                    color: "#000",
                    "&:hover": {
                        ...buttonSx["&:hover"],
                        backgroundColor: "#2CC2EF",
                    },
                }}
            >
                <DownloadIcon sx={{ fontSize: 24, color: "#000000" }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Recibir</Typography>
            </Button>

            {/* AGREGAR ADDRESS */}
            <Button
                onClick={handleAdd}
                sx={{
                    flex: 1,
                    ...buttonSx,
                    backgroundColor: "#00DC8C",
                    color: "#000",
                    "&:hover": {
                        ...buttonSx["&:hover"],
                        backgroundColor: "#00CC7C",
                    },
                }}
            >
                <AddIcon sx={{ fontSize: 24, color: "#000000" }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Agregar Address</Typography>
            </Button>
        </Box>
    );
};
