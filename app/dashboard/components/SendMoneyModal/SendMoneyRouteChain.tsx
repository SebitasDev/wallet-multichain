import { Box, Stack, Typography, IconButton, TextField, Button, CircularProgress } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { TokenSelector } from "@/app/dashboard/components/CrossChainTransferModal/TokenSelector";
import { STATUS_META } from "@/app/dashboard/components/SendMoneyModal/SendMoneyStatusConfig";
import { UseFormWatch, Control } from "react-hook-form";
import { SendForm } from "@/app/lib/zod/sendSchema";
import { useEffect } from "react";

type Props = {
    r: any; // Allocation Chain Data
    walletAddress: string;
    isEditing: boolean;
    existingDetail: any; // RouteDetail for this chain
    chainConfig: any; // Network Config
    chainBalance: number;
    destChainId: string;
    selectedDestChainKey: string;
    watch: UseFormWatch<SendForm>;
    control: Control<SendForm>;

    // Handlers
    onRemoveChain: (walletAddr: string, chainId: string) => void;
    onAmountChange: (walletAddr: string, chainId: string, val: string) => void;
    onTokenChange: (walletAddr: string, chainId: string, val: string) => void;
    onSimulate: (id: string, chainId: string, amount: number, token: string, sourceChainKey: string) => void; // [FIX] ID arg

    // Simulation State
    isSimulating: boolean;
    simulationResult: string | null;
    simulationError: string | null;
    otherUsedTokens?: string[];
};

export const SendMoneyRouteChain = ({
    r,
    walletAddress,
    isEditing,
    existingDetail,
    chainConfig,
    chainBalance,
    destChainId,
    selectedDestChainKey,
    watch,
    control,
    onRemoveChain,
    onAmountChange,
    onTokenChange,
    onSimulate,
    isSimulating,
    simulationResult,
    simulationError,
    otherUsedTokens = []
}: Props) => {
    const chainKey = CHAIN_ID_TO_KEY[r.chainId];
    const label = chainConfig?.label || "Chain " + r.chainId;

    const status = existingDetail?.status || 'idle';
    const statusMeta = STATUS_META[status as keyof typeof STATUS_META];

    const isSameChain = destChainId === r.chainId;
    const isUSDC = (r.token || "USDC").toUpperCase() === "USDC";

    // Auto-correct token if invalid for this chain
    useEffect(() => {
        // Client-side only check handled by effects mostly
        const currentToken = r.token || "USDC";
        const isValid = chainConfig?.assets?.some((a: any) => a.name === currentToken);

        if (!isValid && chainConfig?.assets?.length > 0) {
            const defaultToken = chainConfig.assets[0].name;
            // Avoid infinite loop if onTokenChange triggers re-render 
            if (currentToken !== defaultToken) {
                console.log(`[AutoCorrect] Fixing invalid token ${currentToken} on ${chainConfig.label} to ${defaultToken}`);
                onTokenChange(walletAddress, r.chainId, defaultToken);
            }
        }
    }, [chainConfig, r.token, walletAddress, r.chainId, onTokenChange]);

    // [FIX] Use Price from Route (passed from parent)
    const price = r.price || 1;

    const isDev = process.env.NEXT_PUBLIC_ENVIROMENT === "development" || process.env.NODE_ENV === "development";
    const baseFee = (isSameChain && isUSDC) ? 0.01 : 0.02; // USD Value
    // Convert Fee to Token Amount
    const safePrice = price || 1;
    const feeInTokens = (isDev ? 0 : baseFee) / safePrice;

    // Add small epsilon for floating point tolerance (1.0001 factor or absolute 0.000001)
    const maxUsableRaw = Math.max(0, chainBalance - feeInTokens);
    const maxUsable = maxUsableRaw; // Display this
    // Validation Threshold (allow slightly more due to rounding diffs)
    const validationMax = maxUsableRaw * 1.0001;

    return (
        <Box
            sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 3,
                backgroundColor: "#ffffff",
                border: "2px solid #000000",
                position: "relative"
            }}
        >
            {isEditing && (
                <IconButton
                    onClick={() => onRemoveChain(walletAddress, r.chainId)}
                    sx={{
                        position: "absolute",
                        top: 5,
                        right: 5,
                        color: "#ff4444"
                    }}
                    size="small"
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            )}

            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={1.5}
                spacing={1}
                sx={{ minWidth: 0, pr: isEditing ? 3 : 0 }}
            >
                <Stack direction="row" alignItems="center" spacing={1} flex={1} minWidth={0}>
                    {existingDetail?.icon}
                    <Typography fontWeight={800} fontSize={14}>
                        {label}
                    </Typography>
                </Stack>

                {isEditing ? (
                    <Stack direction="column" alignItems="flex-end" spacing={0.5}>
                        <TextField
                            size="small"
                            type="number"
                            value={r.amount}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val > validationMax) {
                                    onAmountChange(walletAddress, r.chainId, maxUsable.toString()); // Snap to display max
                                } else {
                                    onAmountChange(walletAddress, r.chainId, e.target.value);
                                }
                            }}
                            inputProps={{ max: validationMax, step: "any" }}
                            error={parseFloat(r.amount) > validationMax}
                            sx={{ width: 140 }}
                        />
                        <Typography fontSize={10} color="#999999" fontWeight={600}>
                            Max: {formatCurrency(maxUsable, 6)}
                        </Typography>
                    </Stack>
                ) : (
                    <Typography fontWeight={800} fontSize={15}>
                        {formatCurrency(r.amount, 6)}
                    </Typography>
                )}
            </Stack>

            {/* Edit Token Selector */}
            {isEditing && chainKey ? (
                <Box mt={2}>
                    <Typography fontSize={11} fontWeight={700} color="#666666" mb={0.5}>
                        TOKEN A ENVIAR
                    </Typography>
                    <TokenSelector
                        label=""
                        name={`token_${walletAddress}_${r.id || r.chainId}` as any} // [FIX] ID collision
                        value={r.token || "USDC"} // [FIX] Controlled Value
                        defaultValue={r.token || "USDC"}
                        control={control as any}
                        chain={chainKey as any}
                        onChange={(val: string) => onTokenChange(walletAddress, r.chainId, val)}
                        allowedTokens={(() => {
                            const source = chainConfig as any;
                            // For checks, we need destination config logic. 
                            // Passed 'selectedDestChainKey' helps but we might need full dest config passed down 
                            // or access global NETWORKS with the key.
                            const destConfig = NETWORKS[selectedDestChainKey as keyof typeof NETWORKS];

                            const hasCctp = source.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                                destConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;

                            const hasNear = source.crossChainInformation?.nearIntentInformation?.support &&
                                destConfig?.crossChainInformation?.nearIntentInformation?.support;

                            const allowed = new Set<string>();
                            if (hasCctp) allowed.add("USDC");
                            if (hasNear) {
                                source.crossChainInformation?.nearIntentInformation?.assetsId?.forEach((a: any) => allowed.add(a.name));
                            }
                            // Filter out tokens used by other instances
                            otherUsedTokens.forEach(t => allowed.delete(t));

                            return allowed.size > 0 ? Array.from(allowed) : undefined;
                        })()}
                        balances={{ [r.token || "USDC"]: chainBalance }} // Simplified balance passing for now
                    />
                </Box>
            ) : (
                <Box mt={1} display="flex" alignItems="center" gap={1}>
                    {(() => {
                        let tokenSymbol = r.token || "USDC";
                        let asset = chainConfig?.assets?.find((a: any) => a.name === tokenSymbol);

                        // Fallback if token not found in chain config (e.g. state persistence issue)
                        if (!asset && chainConfig?.assets?.length > 0) {
                            asset = chainConfig.assets[0];
                            tokenSymbol = asset.name;
                        }

                        return (
                            <Box display="flex" alignItems="center" gap={0.5} sx={{ backgroundColor: "#f0f0f0", px: 1, py: 0.5, borderRadius: 1 }}>
                                {asset?.icon ? (
                                    typeof asset.icon === 'string' ? (
                                        <Box component="img" src={asset.icon} sx={{ width: 16, height: 16, borderRadius: "50%" }} />
                                    ) : (
                                        <Box sx={{ width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {asset.icon}
                                        </Box>
                                    )
                                ) : null}
                                <Typography fontSize={11} fontWeight={800} color="#000000">
                                    {tokenSymbol}
                                </Typography>
                            </Box>
                        );
                    })()}
                </Box>
            )}

            {/* Near Simulation Section */}
            {(() => {
                const sourceChainKey = CHAIN_ID_TO_KEY[r.chainId];
                const destChainKey = watch("sendChain");
                const sourceConfig = NETWORKS[sourceChainKey as keyof typeof NETWORKS];
                const destConfig = NETWORKS[destChainKey as keyof typeof NETWORKS];

                const isNearSupported =
                    sourceConfig?.crossChainInformation?.nearIntentInformation?.support &&
                    destConfig?.crossChainInformation?.nearIntentInformation?.support;

                const isCCTP =
                    sourceConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                    destConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                    (r.token || "USDC").toUpperCase() === "USDC" &&
                    (watch("sourceToken") || "USDC").toUpperCase() === "USDC";

                if (isCCTP) return null;
                if (!isNearSupported || isEditing) return null;

                return (
                    <Box mt={1} display="flex" alignItems="center" gap={1}>
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={isSimulating || !r.amount || r.amount <= 0}
                            onClick={() => onSimulate(r.id || r.chainId, r.chainId, r.amount, r.token, sourceChainKey)}
                            sx={{
                                fontSize: 10,
                                py: 0.2,
                                minWidth: "auto",
                                textTransform: "none",
                                height: 24,
                                borderColor: "#666",
                                color: "#333"
                            }}
                        >
                            {isSimulating ? <CircularProgress size={12} /> : "Simular"}
                        </Button>
                        {simulationError ? (
                            <Typography fontSize={11} color="error.main" fontWeight={600}>
                                {simulationError}
                            </Typography>
                        ) : simulationResult ? (
                            <Typography fontSize={11} color="success.main" fontWeight={600}>
                                Recibes: {simulationResult} {watch("sourceToken")}
                            </Typography>
                        ) : null}
                    </Box>
                );
            })()}

            {/* Status (Only show if not editing or static) */}
            {!isEditing && (
                <Box
                    sx={{
                        mt: 1,
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: 11,
                        fontWeight: 800,
                        backgroundColor: statusMeta?.color || "#cccccc",
                        color: "#ffffff",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5
                    }}
                >
                    {statusMeta?.icon}
                    {statusMeta?.label}
                </Box>
            )}
        </Box>
    );
};
