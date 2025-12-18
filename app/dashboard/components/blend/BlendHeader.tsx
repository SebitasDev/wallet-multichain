import { Box, Typography } from "@mui/material";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface BlendHeaderProps {
    address: string;
}

export const BlendHeader = ({ address }: BlendHeaderProps) => {
    return (
        <Box mb={4}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <Box display="flex" alignItems="center" gap={1} mb={2} sx={{ color: 'text.secondary', cursor: 'pointer' }}>
                    <ArrowBackIcon fontSize="small" />
                    <Typography variant="body2">Volver al Dashboard</Typography>
                </Box>
            </Link>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Blend Lending
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Gana rendimiento con tu USDC en Stellar
            </Typography>
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: 'rgba(0, 220, 140, 0.1)',
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    mt: 1
                }}
            >
                <AccountBalanceWalletIcon sx={{ fontSize: 16, color: '#00DC8C' }} />
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {address}
                </Typography>
            </Box>
        </Box>
    );
};
