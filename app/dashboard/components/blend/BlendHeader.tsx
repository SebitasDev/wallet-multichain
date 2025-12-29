import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';

interface BlendHeaderProps {
    address: string;
    backPath?: string;
}

export const BlendHeader = ({ address, backPath = "/dashboard" }: BlendHeaderProps) => {
    return (
        <Box mb={4}>
            {/* Back Button */}
            <Link href={backPath} style={{ textDecoration: 'none' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    sx={{
                        mb: 3,
                        border: "2px solid #000",
                        borderRadius: 2,
                        bgcolor: "#fff",
                        color: "#000",
                        fontWeight: 700,
                        px: 2,
                        py: 1,
                        boxShadow: "3px 3px 0px #000",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            bgcolor: "#f5f5f5",
                            boxShadow: "4px 4px 0px #000",
                            transform: "translate(-1px, -1px)",
                        },
                    }}
                >
                    Volver al Dashboard
                </Button>
            </Link>

            {/* Hero Banner */}
            <Box
                sx={{
                    p: { xs: 3, md: 4 },
                    border: "3px solid #000",
                    borderRadius: 4,
                    boxShadow: "6px 6px 0px #000",
                    bgcolor: "#00DC8C",
                    color: "#000",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", sm: "center" },
                    gap: 2,
                }}
            >
                <Box>
                    <Typography
                        sx={{
                            fontSize: { xs: 28, md: 36 },
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: 2,
                            lineHeight: 1.1,
                        }}
                    >
                        Yield Farming
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: { xs: 14, md: 16 },
                            fontWeight: 600,
                            mt: 1,
                            opacity: 0.8,
                        }}
                    >
                        Gana rendimiento con tu USDC en Stellar
                    </Typography>
                </Box>
                <SavingsIcon sx={{ fontSize: { xs: 50, md: 70 }, opacity: 0.3 }} />
            </Box>

            {/* Wallet Address Badge */}
            <Box
                sx={{
                    mt: 3,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1.5,
                    bgcolor: "#fff",
                    border: "2px solid #000",
                    borderRadius: 3,
                    px: 2.5,
                    py: 1.5,
                    boxShadow: "4px 4px 0px #000",
                }}
            >
                <AccountBalanceWalletIcon sx={{ fontSize: 20, color: "#000" }} />
                <Typography
                    sx={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: { xs: 11, md: 13 },
                        letterSpacing: 0.5,
                        wordBreak: "break-all",
                    }}
                >
                    {address}
                </Typography>
            </Box>
        </Box>
    );
};
