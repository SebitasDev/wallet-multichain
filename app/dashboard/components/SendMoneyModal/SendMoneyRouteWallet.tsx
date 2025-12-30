import { Box, Stack, Typography, Button, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { SendMoneyRouteChain } from "./SendMoneyRouteChain";
import { UseFormWatch, Control } from "react-hook-form";
import { SendForm } from "@/app/lib/zod/sendSchema";
import { ChainConfig } from "@/app/types/chain";

type Props = {
    walletAlloc: any;
    wallets: any[];
    routeDetails: any[];
    isEditing: boolean;
    selected: ChainConfig;
    watch: UseFormWatch<SendForm>;
    control: Control<SendForm>;

    // Handlers
    onRemoveWallet: (addr: string) => void;
    onAddChain: (event: React.MouseEvent<HTMLElement>, walletAddr: string) => void;
    onRemoveChain: (walletAddr: string, chainId: string, id?: string) => void;
    onAmountChange: (walletAddr: string, chainId: string, val: string, id?: string) => void;
    onTokenChange: (walletAddr: string, chainId: string, val: string, id?: string) => void;
    onSimulate: (id: string, chainId: string, amount: number, token: string, sourceChainKey: string) => void;

    // Simulation State
    simulating: Record<string, boolean>;
    simulationResults: Record<string, string | null>;
    simulationErrorMessages: Record<string, string | null>;
};

export const SendMoneyRouteWallet = ({
    walletAlloc,
    wallets,
    routeDetails,
    isEditing,
    selected,
    watch,
    control,
    onRemoveWallet,
    onAddChain,
    onRemoveChain,
    onAmountChange,
    onTokenChange,
    onSimulate,
    simulating,
    simulationResults,
    simulationErrorMessages
}: Props) => {
    const currentWallet = wallets.find(w => w.address.toLowerCase() === walletAlloc.from.toLowerCase());
    const walletName = currentWallet?.name || "Unknown Wallet";
    const shortAddress = `${walletAlloc.from.slice(0, 6)}...${walletAlloc.from.slice(-4)}`;
    const walletDetail = routeDetails.find(w => w.wallet.toLowerCase() === walletAlloc.from.toLowerCase());

    const destChainId = selected.evm?.chain?.id?.toString() || "";

    return (
        <Box>
            <Accordion
                disableGutters
                elevation={0}
                defaultExpanded={true}
                sx={{
                    backgroundColor: "#ffffff",
                    borderRadius: 3,
                    border: "2px solid #000000",
                    overflow: "hidden",
                    "&::before": { display: "none" },
                    "&.Mui-expanded": { margin: 0 },
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: "#000000" }} />}
                    sx={{
                        minHeight: { xs: 48, sm: 56 },
                        px: { xs: 1.5, sm: 2 },
                        "&.Mui-expanded": {
                            minHeight: { xs: 48, sm: 56 },
                            borderBottom: "2px solid #000000",
                        },
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ width: "100%", pr: { xs: 0.5, sm: 1 }, minWidth: 0 }}
                        spacing={{ xs: 1, sm: 2 }}
                    >
                        <Box flex={1} minWidth={0} display="flex" alignItems="center" gap={1}>
                            {isEditing && (
                                <Box
                                    component="span"
                                    role="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveWallet(walletAlloc.from);
                                    }}
                                    sx={{
                                        color: "#ff4444",
                                        p: 0.5,
                                        mr: 0.5,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        "&:hover": { opacity: 0.7 }
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </Box>
                            )}
                            <Box overflow="hidden">
                                <Typography
                                    fontWeight={800}
                                    fontSize={{ xs: 13, sm: 14 }}
                                    color="#000000"
                                    sx={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    {walletName}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: "#666666",
                                        fontWeight: 600,
                                        fontSize: { xs: 11, sm: 12 },
                                        fontFamily: "monospace"
                                    }}
                                    title={walletAlloc.from}
                                >
                                    {shortAddress}
                                </Typography>
                            </Box>
                        </Box>
                        <Box textAlign="right" flexShrink={0}>
                            <Typography
                                fontSize={{ xs: 10, sm: 11 }}
                                sx={{
                                    color: "#666666",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5
                                }}
                            >
                                Total
                            </Typography>
                            <Typography
                                fontWeight={800}
                                fontSize={{ xs: 13, sm: 15 }}
                                color="#000000"
                            >
                                {formatCurrency(
                                    walletAlloc.chains.reduce((acc: number, c: any) => {
                                        const isDev = process.env.NODE_ENV === 'development';
                                        const isSameChain = destChainId === c.chainId;
                                        const isUSDC = (c.token || "USDC").toUpperCase() === "USDC";
                                        const baseFee = (isSameChain && isUSDC) ? 0.01 : 0.02;
                                        const fee = isDev ? 0 : baseFee;
                                        const price = c.price || 1;
                                        return acc + (c.amount * price) + fee;
                                    }, 0),
                                    2
                                )}
                            </Typography>
                        </Box>
                    </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: { xs: 1.5, sm: 2 }, backgroundColor: "#f5f5f5" }}>
                    <Stack spacing={1.5}>
                        {walletAlloc.chains.map((r: any) => {
                            const chainKey = CHAIN_ID_TO_KEY[r.chainId];
                            const chainConfig = NETWORKS[chainKey as keyof typeof NETWORKS] || {};

                            const existingDetail = walletDetail?.chains.find((c: any) => c.id === r.id);

                            // Validations
                            const currentChainDetail = currentWallet?.chains.find((c: any) => {
                                const cId = (c.value || c.chainId || c.id || "").toString();
                                return cId === r.chainId;
                            });
                            const chainBalance = currentChainDetail?.tokens?.[r.token || "USDC"] || 0;

                            // Calculate tokens used by other instances of this same chain
                            const otherUsedTokens = walletAlloc.chains
                                .filter((other: any) => other.chainId === r.chainId && other.id !== r.id)
                                .map((other: any) => other.token || "USDC");

                            return (
                                <SendMoneyRouteChain
                                    key={r.id || r.chainId}
                                    r={r}
                                    walletAddress={walletAlloc.from}
                                    isEditing={isEditing}
                                    existingDetail={existingDetail}
                                    chainConfig={chainConfig}
                                    chainBalance={chainBalance}
                                    destChainId={destChainId}
                                    selectedDestChainKey={watch("sendChain")}
                                    watch={watch}
                                    control={control}
                                    onRemoveChain={(addr, id) => onRemoveChain(addr, id, r.id)}
                                    onAmountChange={(addr, id, val) => onAmountChange(addr, id, val, r.id)}
                                    onTokenChange={(addr, id, val) => onTokenChange(addr, id, val, r.id)}
                                    onSimulate={onSimulate}
                                    isSimulating={simulating[r.id || r.chainId]}
                                    simulationResult={simulationResults[r.id || r.chainId]}
                                    simulationError={simulationErrorMessages[r.id || r.chainId]}
                                    otherUsedTokens={otherUsedTokens}
                                />
                            );
                        })}

                        {/* Add Chain Button */}
                        {isEditing && (
                            <Button
                                startIcon={<AddCircleIcon />}
                                onClick={(e) => onAddChain(e, walletAlloc.from)}
                                fullWidth
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    color: "#000000",
                                    border: "1px dashed #000000",
                                    borderRadius: 2
                                }}
                            >
                                Agregar Chain
                            </Button>
                        )}
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};
