import {
    Box,
    Typography,
    IconButton,
    CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { SplitBalance } from "./SplitBalance";
import { formatFeeAmount } from "@/app/utils/calculateFees";

interface HeroBannerTotalBalanceProps {
    isRefreshing: boolean;
    handleRefreshBalances: () => void;
    totalAvailableBalance: number;
    totalFees: number;
    walletsCount: number;
    hasCalculatedTotal: boolean;
    walletsConnected: boolean;
}

export const HeroBannerTotalBalance = ({
    isRefreshing,
    handleRefreshBalances,
    totalAvailableBalance,
    totalFees,
    walletsCount,
    hasCalculatedTotal,
    walletsConnected
}: HeroBannerTotalBalanceProps) => {
    return (
        <Box
            sx={{
                background: "#f5f5f5",
                border: "2px solid #000000",
                borderRadius: 3,
                p: { xs: 2, md: 2.5 },
                position: "relative",
            }}
        >
            <IconButton
                onClick={handleRefreshBalances}
                disabled={isRefreshing || !walletsConnected}
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
                {isRefreshing ? (
                    <CircularProgress
                        size={18}
                        sx={{ color: "#000000" }}
                    />
                ) : (
                    <RefreshIcon
                        sx={{ fontSize: 20, color: "#000000" }}
                    />
                )}
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
                Balance Disponible (Hijas)
            </Typography>

            <Box
                sx={{
                    mb: 1.5,
                    display: "flex",
                    justifyContent: "center"
                }}
            >
                {hasCalculatedTotal ? (
                    <SplitBalance
                        amount={totalAvailableBalance}
                        mainFontSize={{ xs: 26, sm: 32, md: 36 }}
                        smallFontSize={{ xs: 16, sm: 18, md: 22 }}
                    />
                ) : (
                    "--"
                )}
            </Box>

            {/* FEES DISPLAY */}
            <Box
                sx={{
                    mt: 1,
                    mb: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                }}
            >
                <Typography
                    sx={{
                        fontSize: { xs: 10, md: 11 },
                        fontWeight: 700,
                        color: "#666666",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                    }}
                >
                    Comisión Total
                </Typography>
                <Box
                    sx={{
                        background: "#ffebee", // Light red background
                        border: "1px dashed #ff4444",
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 0.5,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: { xs: 14, md: 16 },
                            fontWeight: 800,
                            color: "#d32f2f", // Red text
                        }}
                    >
                        - {formatFeeAmount(totalFees)} USDC
                    </Typography>
                </Box>
            </Box>

            <Box
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    background: "#000000",
                    color: "#ffffff",
                    borderRadius: "999px",
                    py: 0.6,
                    px: 1.75,
                }}
            >
                <Box
                    sx={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background:
                            walletsConnected ? "#00DC8C" : "#ff4444",
                        boxShadow:
                            walletsConnected
                                ? "0 0 8px rgba(0, 220, 140, 0.6)"
                                : "0 0 8px rgba(255, 68, 68, 0.6)",
                        animation: "pulse 2.5s ease-in-out infinite",
                        "@keyframes pulse": {
                            "0%, 100%": {
                                opacity: 1,
                            },
                            "50%": {
                                opacity: 0.85,
                            },
                        },
                    }}
                />
                <Typography
                    variant="body2"
                    sx={{
                        fontSize: { xs: 11, md: 12 },
                        fontWeight: 700,
                    }}
                >
                    {walletsCount} wallets conectadas
                </Typography>
            </Box>
        </Box>
    );
};
