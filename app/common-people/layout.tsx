"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { Box, CircularProgress } from "@mui/material";

export default function CommonPeopleLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { wallets } = useWalletStore();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Allow a small window for hydration
        const timer = setTimeout(() => {
            const currentWallets = useWalletStore.getState().wallets;

            if (!currentWallets || currentWallets.length === 0) {
                router.replace("/");
            } else {
                setIsChecking(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [router]); // Removed wallets dependency to prevent loops, check once on mount

    if (isChecking) {
        return (
            <Box sx={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#fff"
            }}>
                <CircularProgress sx={{ color: "#000" }} />
            </Box>
        );
    }

    return <>{children}</>;
}
