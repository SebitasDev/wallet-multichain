"use client";

import { formatCurrency } from "@/app/utils/formatCurrency";
import { Box, Typography } from "@mui/material";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";
import { useMainWalletStore } from "@/app/store/useMainWalletStore";

type Props = {
    background: string;
};

export function HeroBanner({ background }: Props) {
    const { wallets, getAllWalletsTotalBalance } = useWalletStore();

    // XO (embedded)
    const { address: xoAddress } = useXOContracts();

    // Local fallback main wallet
    const { mainWallet, xoClient} = useMainWalletStore();

    // Main wallet (XO si existe → sino local)
    const mainAddress = xoAddress ?? mainWallet.address ?? null;

    // Balance quemado exclusivo para Main
    const burnedMainBalance = 12345.67;

    return (
        <Box
            sx={{
                position: "relative",
                overflow: "hidden",
                background,
                color: "#fff",
                textAlign: "center",
                py: { xs: 6, md: 7 },
                borderRadius: "24px",
                boxShadow:
                    "0 26px 55px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
        >
            {/* background lighting */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0, transparent 30%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.18) 0, transparent 25%)",
                    opacity: 0.7,
                }}
            />

            {/* 🔥 MAIN WALLET */}
            <Typography
                variant="body2"
                sx={{
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    fontSize: 12,
                    position: "relative",
                    color: "rgba(255,255,255,0.85)",
                }}
            >
                Main Wallet {xoClient ? ` de ${xoClient.alias}` : ""}
            </Typography>

            <Typography
                sx={{
                    fontSize: { xs: 42, md: 54 },
                    fontWeight: 900,
                    mt: 1,
                    lineHeight: 1,
                    position: "relative",
                    textShadow: "0 6px 18px rgba(0,0,0,0.18)",
                }}
            >
                {formatCurrency(burnedMainBalance)}
            </Typography>

            <Typography variant="body2" sx={{ mt: 1, fontSize: 13, opacity: 0.85 }}>
                {mainAddress ?? "--"}
            </Typography>

            <Box sx={{ mt: 4, position: "relative" }}>
                <Typography
                    variant="body2"
                    sx={{ textTransform: "uppercase", fontSize: 12, opacity: 0.85 }}
                >
                    Balance Total (Hijas)
                </Typography>

                <Typography
                    sx={{
                        fontSize: { xs: 32, md: 40 },
                        fontWeight: 800,
                        mt: 1,
                        lineHeight: 1,
                        position: "relative",
                    }}
                >
                    {getAllWalletsTotalBalance !== null ? formatCurrency(getAllWalletsTotalBalance()) : "--"}
                </Typography>

                <Typography variant="body2" sx={{ mt: 1, fontSize: 13, opacity: 0.85 }}>
                    {wallets.length} wallets hijas conectadas
                </Typography>
            </Box>
        </Box>
    );
}
