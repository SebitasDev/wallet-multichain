import { Box, Typography } from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WalletIcon from '@mui/icons-material/Wallet';
import { useLiveBalance } from "../../hooks/useLiveBalance";

interface BlendStatsProps {
    apy: number;
    invested: number;
    balance: number;
    timestamp?: number;
}

export const BlendStats = ({ apy, invested, balance, timestamp }: BlendStatsProps) => {
    const animatedInvested = useLiveBalance(invested, apy, timestamp);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* APY Card */}
            <Box
                sx={{
                    p: 3,
                    border: "3px solid #000",
                    borderRadius: 4,
                    boxShadow: "5px 5px 0px #000",
                    bgcolor: "#00DC8C",
                }}
            >
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: "#000",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <TrendingUpIcon sx={{ color: "#00DC8C", fontSize: 22 }} />
                    </Box>
                    <Typography
                        sx={{
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            color: "#000",
                        }}
                    >
                        Pool APY
                    </Typography>
                </Box>
                <Typography
                    sx={{
                        fontSize: { xs: 48, md: 56 },
                        fontWeight: 900,
                        color: "#000",
                        lineHeight: 1,
                    }}
                >
                    {apy}%
                </Typography>
            </Box>

            {/* Tu Inversión Card */}
            <Box
                sx={{
                    p: 3,
                    border: "3px solid #000",
                    borderRadius: 4,
                    boxShadow: "5px 5px 0px #000",
                    bgcolor: "#fff",
                }}
            >
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: "#00DC8C",
                            border: "2px solid #000",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <AccountBalanceIcon sx={{ color: "#000", fontSize: 20 }} />
                    </Box>
                    <Typography
                        sx={{
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            color: "#666",
                        }}
                    >
                        Tu Inversión
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "baseline" }}>
                    <Typography
                        component="span"
                        sx={{
                            fontSize: { xs: 28, md: 36 },
                            fontWeight: 900,
                            fontFamily: "monospace",
                            color: "#00DC8C",
                        }}
                    >
                        {animatedInvested.toFixed(12).split('.')[0]}.{animatedInvested.toFixed(12).split('.')[1]?.slice(0, 2)}
                    </Typography>
                    <Typography
                        component="span"
                        sx={{
                            fontSize: { xs: 14, md: 16 },
                            fontWeight: 700,
                            fontFamily: "monospace",
                            color: "#999",
                        }}
                    >
                        {animatedInvested.toFixed(12).split('.')[1]?.slice(2)}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        display: "inline-block",
                        mt: 1.5,
                        px: 2,
                        py: 0.5,
                        bgcolor: "#000",
                        borderRadius: 2,
                    }}
                >
                    <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: 12 }}>
                        USDC
                    </Typography>
                </Box>
            </Box>

            {/* Disponible Card */}
            <Box
                sx={{
                    p: 3,
                    border: "3px solid #000",
                    borderRadius: 4,
                    boxShadow: "5px 5px 0px #000",
                    bgcolor: "#f5f5f5",
                }}
            >
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: "#000",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <WalletIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                    <Typography
                        sx={{
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            color: "#666",
                        }}
                    >
                        Disponible
                    </Typography>
                </Box>
                <Typography
                    sx={{
                        fontSize: { xs: 28, md: 32 },
                        fontWeight: 900,
                        color: "#000",
                    }}
                >
                    {balance}
                </Typography>
                <Box
                    sx={{
                        display: "inline-block",
                        mt: 1.5,
                        px: 2,
                        py: 0.5,
                        bgcolor: "#000",
                        borderRadius: 2,
                    }}
                >
                    <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: 12 }}>
                        USDC
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};
