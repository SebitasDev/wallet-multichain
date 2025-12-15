import {
    Box,
    Typography,
    IconButton,
} from "@mui/material";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { EthIcon } from "@/app/components/atoms/EthIcon";
import { StellarIcon } from "@/app/components/atoms/StellarIcon";
import { ActiveWallet } from "@/app/dashboard/hooks/useHeroBanner";
import { Dispatch, SetStateAction } from "react";

interface HeroBannerMainWalletProps {
    activeWallet: ActiveWallet;
    setActiveWallet: Dispatch<SetStateAction<ActiveWallet>>;
    burnedBalances: Record<ActiveWallet, number>;
    burnedAddresses: Record<ActiveWallet, string>;
    xoClientAlias?: string;
}

export const HeroBannerMainWallet = ({
    activeWallet,
    setActiveWallet,
    burnedBalances,
    burnedAddresses,
    xoClientAlias
}: HeroBannerMainWalletProps) => {
    return (
        <>
            <Box
                sx={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                }}
            >
                {activeWallet === "EVM" ? (<EthIcon />) : (<StellarIcon />)}
            </Box>

            {/* TOGGLE WALLET BUTTON */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                <IconButton
                    onClick={() =>
                        setActiveWallet((prev) =>
                            prev === "EVM" ? "STELLAR" : "EVM"
                        )
                    }
                    sx={{
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        px: 1.5,
                        fontSize: 12,
                        fontWeight: 700,
                        "&:hover": {
                            background: "#3CD2FF",
                        },
                    }}
                >
                    {activeWallet === "EVM" ? "→ STELLAR" : "→ EVM"}
                </IconButton>
            </Box>

            {/* MAIN WALLET SECTION */}
            <Box
                sx={{
                    background: "#f5f5f5",
                    border: "2px solid #000000",
                    borderRadius: 3,
                    p: { xs: 2, md: 2.5 },
                    mb: 2,
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontSize: { xs: 10, md: 11 },
                        fontWeight: 700,
                        color: "#666666",
                        mb: 1,
                    }}
                >
                    Main Wallet {activeWallet}
                    {activeWallet === "EVM" && xoClientAlias
                        ? ` de ${xoClientAlias}`
                        : ""}
                </Typography>

                <Typography
                    sx={{
                        fontSize: { xs: 32, sm: 38, md: 44 },
                        fontWeight: 900,
                        lineHeight: 1,
                        color: "#000000",
                        mb: 1.5,
                    }}
                >
                    {formatCurrency(burnedBalances[activeWallet])}
                </Typography>

                <Box
                    sx={{
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        py: 0.75,
                        px: 1.5,
                        display: "inline-block",
                        maxWidth: "100%",
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: { xs: 10, md: 11 },
                            fontWeight: 600,
                            color: "#000000",
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                        }}
                    >
                        {burnedAddresses[activeWallet]}
                    </Typography>
                </Box>
            </Box>
        </>
    );
};
