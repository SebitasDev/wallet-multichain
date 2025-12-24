import { Box, Stack, Typography, Chip } from "@mui/material";

type TransferSummaryProps = {
    watchAmount: string;
    fee: string;
    total: string;
    isCrossChain: boolean;
    token?: string;
};

export const TransferSummary = ({ watchAmount, fee, total, isCrossChain, token = "USDC" }: TransferSummaryProps) => {
    if (!watchAmount || parseFloat(watchAmount) <= 0) return null;

    return (
        <Box
            sx={{
                p: 2.5,
                bgcolor: "#f5f5f5",
                borderRadius: 3,
                border: "2px solid #000000",
            }}
        >
            <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                    <Typography color="#666666" fontWeight={600} fontSize={13}>
                        Monto:
                    </Typography>
                    <Typography fontWeight={700} fontSize={14}>
                        {watchAmount} {token}
                    </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                    <Typography color="#666666" fontWeight={600} fontSize={13}>
                        Fee facilitador:
                    </Typography>
                    <Typography color="#00DC8C" fontWeight={700} fontSize={14}>
                        {fee} {token}
                    </Typography>
                </Stack>
                <Box sx={{
                    borderTop: "2px solid #000000",
                    pt: 1.5,
                    mt: 0.5
                }}>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography color="#000000" fontWeight={800} fontSize={14}>
                            Total a firmar:
                        </Typography>
                        <Typography fontWeight={800} fontSize={15}>
                            {total} {token}
                        </Typography>
                    </Stack>
                </Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="#666666" fontWeight={600} fontSize={13}>
                        Tipo:
                    </Typography>
                    <Chip
                        label={isCrossChain ? "Cross-Chain" : "Mismo Chain"}
                        size="small"
                        sx={{
                            bgcolor: isCrossChain ? "#7852FF" : "#3CD2FF",
                            color: "#000000",
                            fontWeight: 800,
                            fontSize: 11,
                            border: "2px solid #000000",
                        }}
                    />
                </Stack>
            </Stack>
        </Box>
    );
};
