import { Box, Stack, Typography, Button, TextField, Menu, MenuItem } from "@mui/material";
import { useEffect } from "react"; // [FIX] Import useEffect
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainConfig, ChainKey } from "@/app/types/chain";
import { AllocationSummary } from "@/app/dashboard/types";
import { RouteDetail } from "@/app/dashboard/hooks/transfer/useSendMoneyModal";
import { TokenSelector } from "@/app/dashboard/components/CrossChainTransferModal/TokenSelector";
import { UseFormWatch, UseFormSetValue, Control, Controller } from "react-hook-form";
import { SendForm } from "@/app/lib/zod/sendSchema";
import { SendMoneyRouteWallet } from "./SendMoneyRouteWallet";
import { SendMoneyRouteSummary } from "./SendMoneyRouteSummary";
import { useSendMoneyRoute } from "@/app/dashboard/hooks/transfer/useSendMoneyRoute";

type Props = {
    routeDetails: RouteDetail[],
    routeReady: boolean,
    routeSummary: AllocationSummary | null,
    setRouteSummary: (summary: AllocationSummary | null) => void,
    selected: ChainConfig,
    wallets: { name: string; address: string; chains: any[] }[],
    isEditing: boolean,
    setIsEditing: (isEditing: boolean) => void,
    watch: UseFormWatch<SendForm>,
    control: Control<SendForm>,
    setValue: UseFormSetValue<SendForm>,
    setHasBlockingErrors: (hasError: boolean) => void;
    setPassword: (val: string) => void;
    password: string;
    priceMap?: Record<string, number>;
};

export const SendMoneyModalRoute = (
    { routeDetails, routeReady, routeSummary, setRouteSummary, selected, wallets, isEditing, setIsEditing, watch, control, setValue, setHasBlockingErrors, priceMap, password, setPassword }: Props
) => {

    const {
        // ... hook values ...
        simulating,
        simulationResults,
        simulationErrorMessages,
        anchorElWallet,
        anchorElChain,
        activeWalletForChainAdd,
        hasErrors,
        handleSimulate,
        handleRemoveWallet,
        handleRemoveChain,
        handleTokenChange,
        handleAmountChange,
        handleAddWallet,
        handleAddChain,
        handleCloseWalletMenu,
        handleCloseChainMenu,
        handleOpenChainMenu,
        handleOpenWalletMenu
    } = useSendMoneyRoute({
        routeSummary,
        setRouteSummary,
        selected,
        wallets,
        isEditing,
        watch,
        setSimulationError: () => { }, // [Legacy] No longer used by parent, but hook requires it. We can refactor hook later.
        priceMap
    });

    // [FIX] Sync Blocking Errors to Parent
    // If ANY chain is simulating (loading) OR has validation errors -> Block Parent
    const isSimulating = Object.values(simulating).some(Boolean);
    useEffect(() => {
        setHasBlockingErrors(hasErrors || isSimulating);
    }, [hasErrors, isSimulating, setHasBlockingErrors]);

    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                borderRadius: 2,
                overflowY: "auto",
                border: "2px solid #000000",
                position: "relative",
                backgroundColor: "#f5f5f5",
                p: { xs: 1.5, sm: 2 },
                flex: 1
            }}
        >
            {/* ... Header and List ... */}

            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography fontWeight={800} fontSize={{ xs: 13, sm: 15 }} sx={{ textTransform: "uppercase", letterSpacing: 0.5, color: "#000000" }}>
                    Ruta encontrada
                </Typography>
                <Button
                    startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                    onClick={() => {
                        if (isEditing && hasErrors) return;
                        setIsEditing(!isEditing);
                    }}
                    disabled={isEditing && hasErrors}
                    size="small"
                    sx={{ textTransform: "none", fontWeight: 700, color: (isEditing && hasErrors) ? "#999999" : (isEditing ? "#00DC8C" : "#000000") }}
                >
                    {isEditing ? "Guardar" : "Editar"}
                </Button>
            </Stack>

            <Stack spacing={2} pb={4}>
                {(routeSummary?.allocations || []).map((walletAlloc) => (
                    <SendMoneyRouteWallet
                        key={walletAlloc.from}
                        walletAlloc={walletAlloc}
                        wallets={wallets}
                        routeDetails={routeDetails}
                        isEditing={isEditing}
                        selected={selected}
                        watch={watch}
                        control={control}
                        onRemoveWallet={handleRemoveWallet}
                        onAddChain={handleOpenChainMenu}
                        onRemoveChain={handleRemoveChain}
                        onAmountChange={handleAmountChange}
                        onTokenChange={handleTokenChange}
                        onSimulate={handleSimulate}
                        simulating={simulating}
                        simulationResults={simulationResults}
                        simulationErrorMessages={simulationErrorMessages}
                    />
                ))}

                {isEditing && (
                    <Button
                        startIcon={<AddCircleIcon />}
                        onClick={handleOpenWalletMenu}
                        fullWidth
                        sx={{ p: 2, textTransform: "none", fontWeight: 800, color: "#000000", backgroundColor: "#ffffff", border: "2px dashed #000000", borderRadius: 3 }}
                    >
                        Agregar Wallet
                    </Button>
                )}
            </Stack>

            {/* WALLET MENU */}
            <Menu anchorEl={anchorElWallet} open={Boolean(anchorElWallet)} onClose={handleCloseWalletMenu}>
                {wallets.filter(w => !routeSummary?.allocations.some(a => a.from.toLowerCase() === w.address.toLowerCase())).map((wallet) => (
                    <MenuItem key={wallet.address} onClick={() => handleAddWallet(wallet)}>
                        <Typography fontWeight={700}>{wallet.name} ({wallet.address.slice(0, 6)}...)</Typography>
                    </MenuItem>
                ))}
            </Menu>

            {/* CHAIN MENU */}
            <Menu anchorEl={anchorElChain} open={Boolean(anchorElChain)} onClose={handleCloseChainMenu}>
                {activeWalletForChainAdd && Object.values(NETWORKS).filter(n => {
                    if (!n.evm) return false;
                    const dest = selected;
                    const source = n;
                    const hasCctp = source.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP && dest.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;
                    const hasNear = source.crossChainInformation?.nearIntentInformation?.support && dest.crossChainInformation?.nearIntentInformation?.support;
                    return hasCctp || hasNear;
                }).map((chain) => {
                    const chainId = chain.evm?.chain.id.toString();
                    return (
                        <MenuItem key={chainId} onClick={() => handleAddChain(activeWalletForChainAdd!, chain)}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                {chain.icon}
                                <Typography fontWeight={700}>{chain.label}</Typography>
                            </Stack>
                        </MenuItem>
                    );
                })}
            </Menu>

            <Box sx={{ mt: 1, p: { xs: 2, sm: 2.5 }, borderRadius: 3, backgroundColor: "#ffffff", border: "2px solid #000000", display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                    <Typography fontWeight={800} fontSize={{ xs: 11, sm: 13 }} sx={{ textTransform: "uppercase", letterSpacing: 0.5, color: "#666666", mb: 0.5 }}>
                        Destinatario
                    </Typography>

                    {!isEditing ? (
                        <>
                            <Typography variant="body2" sx={{ color: "#000000", fontWeight: 600, fontSize: { xs: 11, sm: 12 }, fontFamily: "monospace", mb: 1.5, wordBreak: "break-all", overflowWrap: "break-word" }}>
                                {watch("toAddress") || "N/D"}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ width: { xs: 20, sm: 24 }, height: { xs: 20, sm: 24 }, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, "& svg": { width: "100%", height: "100%" } }}>
                                    {NETWORKS[watch("sendChain") as ChainKey]?.icon || selected?.icon}
                                </Box>
                                <Typography variant="body2" fontWeight={700} fontSize={{ xs: 12, sm: 13 }} color="#000000">
                                    Llega en {NETWORKS[watch("sendChain") as ChainKey]?.label || selected?.label || "Chain destino"}
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={0.8} ml={1}>
                                    <Box sx={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", "& svg": { width: "100%", height: "100%" } }}>
                                        {(() => {
                                            const cKey = watch("sendChain") as ChainKey;
                                            const tName = watch("sourceToken");
                                            const assets = NETWORKS[cKey]?.assets;
                                            const asset = assets?.find(a => a.name === tName);
                                            return asset?.icon;
                                        })()}
                                    </Box>
                                    <Typography variant="body2" fontWeight={700} fontSize={{ xs: 12, sm: 13 }} color="#666666">
                                        {watch("sourceToken")}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </>
                    ) : (
                        <Stack spacing={2} mt={1}>
                            <Controller
                                control={control}
                                name="toAddress"
                                render={({ field }) => (
                                    <TextField {...field} fullWidth size="small" label="Address Destino" placeholder="0x..." InputProps={{ sx: { fontFamily: "monospace", fontSize: 13, background: "#ffffff" } }} />
                                )}
                            />
                            <Controller
                                control={control}
                                name="sendChain"
                                render={({ field }) => (
                                    <TextField select fullWidth size="small" label="Chain" {...field} InputProps={{ sx: { background: "#ffffff" } }}>
                                        {Object.entries(NETWORKS).filter(([k, cfg]) => !!cfg.evm).map(([key, cfg]) => (
                                            <MenuItem key={key} value={key}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Box sx={{ width: 20, height: 20, display: "flex", "& svg": { width: "100%" } }}>{cfg.icon}</Box>
                                                    <Typography fontSize={13} fontWeight={600}>{cfg.label}</Typography>
                                                </Stack>
                                            </MenuItem>
                                        ))}
                                        {/* STELLAR OPTION */}
                                        <MenuItem key="Stellar" value="Stellar">
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Box sx={{ width: 20, height: 20, display: "flex", "& svg": { width: "100%" } }}>{NETWORKS["Stellar"]?.icon || null}</Box>
                                                <Typography fontSize={13} fontWeight={600}>{NETWORKS["Stellar"]?.label || "Stellar"}</Typography>
                                            </Stack>
                                        </MenuItem>
                                    </TextField>
                                )}
                            />
                            <TokenSelector label="Token" name="sourceToken" control={control as any} chain={watch("sendChain")} />
                        </Stack>
                    )}
                </Box>

                <SendMoneyRouteSummary routeSummary={routeSummary} selected={selected} watch={watch} simulationResults={simulationResults} />

                {/* PASSWORD FIELD (Step 2) */}
                <Box mt={2}>
                    <Typography fontWeight={700} fontSize={13} sx={{ mb: 1, textTransform: "uppercase", letterSpacing: 0.5, color: "#666666" }}>
                        Wallet Password
                    </Typography>
                    {/* [FIX] Explicit Controlled Input to avoid RHF state sync issues */}
                    <TextField
                        fullWidth
                        size="medium"
                        type="password"
                        placeholder="••••••••"
                        value={password || ""}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            sx: { borderRadius: 2, background: "#ffffff", border: "2px solid #000000", fontWeight: 600, "&:hover": { background: "#ffffff" }, "&.Mui-focused": { background: "#ffffff" } },
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};