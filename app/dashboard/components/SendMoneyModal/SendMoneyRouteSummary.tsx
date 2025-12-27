import { Box, Stack, Typography, Divider } from "@mui/material";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { AllocationSummary } from "@/app/dashboard/types";
import { ChainConfig } from "@/app/types/chain";
import { UseFormWatch } from "react-hook-form";
import { SendForm } from "@/app/lib/zod/sendSchema";

type Props = {
    routeSummary: AllocationSummary | null;
    selected: ChainConfig;
    watch: UseFormWatch<SendForm>;
    simulationResults: Record<string, string | null>;
};

export const SendMoneyRouteSummary = ({ routeSummary, selected, watch, simulationResults }: Props) => {
    const allocations = routeSummary?.allocations || [];
    const destChainId = selected.evm?.chain?.id?.toString() || "";

    let totalPrincipal = 0;
    let totalFee = 0;
    let totalReceived = 0;

    allocations.forEach(alloc => {
        alloc.chains.forEach(c => {
            // Calculate Sent (Amount + Fee)
            const isUSDC = (c.token || "USDC").toUpperCase() === "USDC"; // Default USDC
            const isSameChain = destChainId === c.chainId;

            const isDev = process.env.NODE_ENV === 'development';
            const baseFee = (isSameChain && isUSDC) ? 0.01 : 0.02;
            const calculatedFee = isDev ? 0 : baseFee;

            totalPrincipal += c.amount;
            totalFee += calculatedFee;

            // Calculate Received
            const sourceChainKey = CHAIN_ID_TO_KEY[c.chainId];
            const destChainKey = watch("sendChain");
            const sourceConfig = NETWORKS[sourceChainKey as keyof typeof NETWORKS];
            const destConfig = NETWORKS[destChainKey as keyof typeof NETWORKS];

            const isNearSupported =
                sourceConfig?.crossChainInformation?.nearIntentInformation?.support &&
                destConfig?.crossChainInformation?.nearIntentInformation?.support;

            // Check CCTP Support
            const isCCTP =
                (sourceConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                    destConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP) &&
                isUSDC &&
                (watch("sourceToken") || "USDC").toUpperCase() === "USDC";

            if (isCCTP) {
                // CCTP Priority: Assume 1:1 (Principal)
                totalReceived += c.amount;
            } else if (isNearSupported) {
                // Use simulation result
                const simulated = parseFloat(simulationResults[c.chainId] || "0");
                totalReceived += simulated;
            } else {
                // Fallback (Direct/Other) -> Assume 1:1
                totalReceived += c.amount;
            }
        });
    });

    const totalSentTotal = totalPrincipal + totalFee;
    const diff = totalReceived - totalSentTotal;
    const isDiffPositive = diff >= 0;

    return (
        <Box
            sx={{
                mt: 1,
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                backgroundColor: "#ffffff",
                border: "2px solid #000000",
                display: "flex",
                flexDirection: "column",
                gap: 2,
            }}
        >
            <Stack spacing={1}>
                {/* ENVIA */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={700} color="#666666" fontSize={{ xs: 11, sm: 12 }}>
                        ENVIA
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="#000000" fontSize={{ xs: 12, sm: 13 }}>
                        {formatCurrency(totalPrincipal, 6)}
                    </Typography>
                </Stack>

                {/* FEE PLATAFORMA */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={700} color="#666666" fontSize={{ xs: 11, sm: 12 }}>
                        FEE PLATAFORMA
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="#ff4444" fontSize={{ xs: 12, sm: 13 }}>
                        -{formatCurrency(totalFee, 6)}
                    </Typography>
                </Stack>

                {/* RECIBE (EST.) */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={700} color="#666666" fontSize={{ xs: 11, sm: 12 }}>
                        RECIBE (EST.)
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="#00DC8C" fontSize={{ xs: 12, sm: 13 }}>
                        {formatCurrency(totalReceived, 6)} <span style={{ color: "#000000", fontSize: "11px" }}>{watch("sourceToken")}</span>
                    </Typography>
                </Stack>

                <Divider sx={{ borderStyle: "dashed", borderColor: "#cccccc" }} />

                {/* DIFERENCIA */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={800} color="#666666" fontSize={{ xs: 11, sm: 12 }}>
                        DIFERENCIA
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color={isDiffPositive ? "#00DC8C" : "#ff4444"} fontSize={{ xs: 12, sm: 13 }}>
                        {isDiffPositive ? "+" : ""}{formatCurrency(diff, 6)}
                    </Typography>
                </Stack>
            </Stack>
        </Box>
    );
};
