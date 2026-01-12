import { Box, Typography, IconButton } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { SplitBalance } from "../SplitBalance";
import { ActiveWallet } from "@/app/dashboard/hooks/dashboard/useHeroBanner";

interface WalletAddressDisplayProps {
    activeWallet: ActiveWallet;
    xoClientAlias?: string;
    smartAccountAddress: string | null;
    cachedSmartAccount: string | null;
    ownerAddress: string | null; // EOA
    burnedAddress: string; // fallback if no EOA/SA
    isUsingMetaMask: boolean;
    mainBalance: number;
    isRefreshing: boolean;
    canRefresh: boolean;
    onRefresh: () => void;
}

export const WalletAddressDisplay = ({
    activeWallet,
    xoClientAlias,
    smartAccountAddress,
    cachedSmartAccount,
    ownerAddress,
    burnedAddress,
    isUsingMetaMask,
    mainBalance,
    isRefreshing,
    canRefresh,
    onRefresh
}: WalletAddressDisplayProps) => {
    return (
        <Box
            sx={{
                background: "#f5f5f5",
                border: "2px solid #000000",
                borderRadius: 3,
                p: { xs: 2, md: 2.5 },
                mb: 2,
                position: "relative",
            }}
        >
            <IconButton
                id="tour-main-reload"
                onClick={onRefresh}
                disabled={isRefreshing || !canRefresh}
                sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 36,
                    height: 36,
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 2,
                    transition: "all 0.2s",
                    "&:hover": {
                        background: "#3CD2FF",
                        transform: "scale(1.05)",
                    },
                    "&:disabled": {
                        background: "#e0e0e0",
                        border: "2px solid #999999",
                    },
                }}
            >
                <RefreshIcon
                    sx={{
                        fontSize: 20,
                        color: "#000000",
                        animation: isRefreshing ? "spin 1s linear infinite" : "none",
                        "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } }
                    }}
                />
            </IconButton>

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
                {smartAccountAddress && activeWallet === "EVM" && (isUsingMetaMask ? " (External Wallet Connected)" : " (Local Connected)")}
            </Typography>

            <Box sx={{ mb: 1.5 }}>
                <SplitBalance
                    amount={mainBalance}
                    mainFontSize={{ xs: 32, sm: 38, md: 44 }}
                    smallFontSize={{ xs: 20, sm: 24, md: 28 }}
                />
            </Box>

            {/* ADDRESS DISPLAY SECTION */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box
                    sx={{
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        py: 0.75,
                        px: 1.5,
                        display: "flex",
                        alignItems: "center",
                        maxWidth: "100%",
                    }}
                >
                    {activeWallet === "EVM" && (smartAccountAddress || cachedSmartAccount) && <Typography variant="caption" sx={{ fontWeight: 700, mr: 1 }}>EOA:</Typography>}

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
                        {(activeWallet === "EVM" && ownerAddress) ? ownerAddress : burnedAddress}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};
