import { Card, CardContent, Box, Typography } from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
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
        <Card elevation={0} sx={{ border: "1px solid #eee", height: 'fit-content' }}>
            <CardContent>
                <Box mb={3}>
                    <Typography variant="overline" color="text.secondary">Pool APY</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                        <TrendingUpIcon sx={{ color: "#00DC8C" }} />
                        <Typography variant="h3" fontWeight="bold" color="#00DC8C">
                            {apy}%
                        </Typography>
                    </Box>
                </Box>

                <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">Tu Inversión</Typography>
                    <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                        {animatedInvested.toFixed(12)} USDC
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="body2" color="text.secondary">Disponible</Typography>
                    <Typography variant="h6">{balance} USDC</Typography>
                </Box>
            </CardContent>
        </Card>
    );
};
