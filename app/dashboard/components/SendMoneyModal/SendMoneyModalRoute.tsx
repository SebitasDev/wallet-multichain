import { Box, Stack, Typography, Button, TextField, Menu, MenuItem, CircularProgress, Divider } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { STELLAR } from "@/app/constants/chais/NoEvm/Stellar";
import { ChainConfig, ChainKey } from "@/app/types/chain";
import { AllocationSummary } from "@/app/dashboard/types";
import { RouteDetail } from "@/app/dashboard/hooks/transfer/useSendMoneyModal";
import { useState, useEffect } from "react";
import { TokenSelector } from "@/app/dashboard/components/CrossChainTransferModal/TokenSelector";
import { UseFormWatch, UseFormSetValue, Control, Controller } from "react-hook-form";
import { SendForm } from "@/app/lib/zod/sendSchema";
import { SendMoneyRouteWallet } from "./SendMoneyRouteWallet";
import { SendMoneyRouteSummary } from "./SendMoneyRouteSummary";
import { bridgeApi } from "@/app/services/api";

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
    setSimulationError: (id: string, hasError: boolean) => void;
}

export const SendMoneyModalRoute = (
    { routeDetails, routeReady, routeSummary, setRouteSummary, selected, wallets, isEditing, setIsEditing, watch, control, setValue, setSimulationError }: Props
) => {

    // Simulation State
    const [simulating, setSimulating] = useState<Record<string, boolean>>({});
    const [simulationResults, setSimulationResults] = useState<Record<string, string | null>>({});
    const [simulationErrorMessages, setSimulationErrorMessages] = useState<Record<string, string | null>>({});

    const handleSimulate = async (chainId: string, amount: number, token: string, sourceChainKey: string) => {
        if (!amount || amount <= 0) return;

        setSimulating(prev => ({ ...prev, [chainId]: true }));
        setSimulationResults(prev => ({ ...prev, [chainId]: null }));
        setSimulationErrorMessages(prev => ({ ...prev, [chainId]: null }));
        setSimulationError(chainId, true);

        try {
            const destChainKey = watch("sendChain");

            const isDev = process.env.NODE_ENV === 'development';
            const baseFee = (sourceChainKey === destChainKey) ? 0.01 : 0.02;
            const fee = isDev ? 0 : baseFee;

            const totalAmountToSimulate = (amount + fee).toFixed(6);

            const data = await bridgeApi.getQuote({
                sourceChain: sourceChainKey,
                targetChain: destChainKey,
                amount: totalAmountToSimulate,
                token: watch("sourceToken") || "USDC",
                sourceToken: token
            });

            if (data.success && data.estimatedReceived) {
                setSimulationResults(prev => ({ ...prev, [chainId]: data.estimatedReceived }));
                setSimulationError(chainId, false);
            } else {
                const errorMsg = data.error || "Simulation failed";
                setSimulationErrorMessages(prev => ({ ...prev, [chainId]: errorMsg }));
                setSimulationError(chainId, true);
            }
        } catch (error) {
            console.error("Simulation error:", error);
            setSimulationErrorMessages(prev => ({ ...prev, [chainId]: "Failed to simulate" }));
            setSimulationError(chainId, true);
        } finally {
            setSimulating(prev => ({ ...prev, [chainId]: false }));
        }
    };

    // Auto-Simulate Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!routeSummary) return;
            const destChainKey = watch("sendChain");

            routeSummary.allocations.forEach(alloc => {
                alloc.chains.forEach(chain => {
                    const sourceChainKey = CHAIN_ID_TO_KEY[chain.chainId];
                    const sourceConfig = NETWORKS[sourceChainKey as keyof typeof NETWORKS];
                    const destConfig = NETWORKS[destChainKey as keyof typeof NETWORKS];

                    const isNearSupported =
                        sourceConfig?.crossChainInformation?.nearIntentInformation?.support &&
                        destConfig?.crossChainInformation?.nearIntentInformation?.support;

                    const isCCTP =
                        sourceConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                        destConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                        (chain.token || "USDC").toUpperCase() === "USDC";

                    if (isCCTP) {
                        return;
                    }

                    if (isNearSupported && chain.amount > 0 && !simulationResults[chain.chainId] && !simulating[chain.chainId]) {
                        handleSimulate(chain.chainId, chain.amount, chain.token || "USDC", sourceChainKey);
                    }
                });
            });
        }, 800);

        return () => clearTimeout(timer);
    }, [routeSummary, watch("sendChain"), watch("sourceToken")]);


    // Add Wallet State
    const [anchorElWallet, setAnchorElWallet] = useState<null | HTMLElement>(null);

    // Add Chain State 
    const [anchorElChain, setAnchorElChain] = useState<null | HTMLElement>(null);
    const [activeWalletForChainAdd, setActiveWalletForChainAdd] = useState<string | null>(null);

    const updateSummary = (newAllocations: AllocationSummary["allocations"]) => {
        if (!routeSummary) return;
        setRouteSummary({
            ...routeSummary,
            allocations: newAllocations,
            totalAmountTaken: newAllocations.reduce((sum, a) => sum + a.chains.reduce((s, c) => s + c.amount, 0), 0)
        });
    }

    const handleRemoveWallet = (walletAddress: string) => {
        if (!routeSummary) return;

        const newAllocations = routeSummary.allocations.filter(
            alloc => alloc.from.toLowerCase() !== walletAddress.toLowerCase()
        );

        updateSummary(newAllocations);
    };

    const handleRemoveChain = (walletAddress: string, chainId: string) => {
        if (!routeSummary) return;

        const newAllocations = routeSummary.allocations.map(alloc => {
            if (alloc.from.toLowerCase() !== walletAddress.toLowerCase()) return alloc;
            return {
                ...alloc,
                chains: alloc.chains.filter(c => c.chainId !== chainId)
            };
        }).filter(alloc => alloc.chains.length > 0);

        updateSummary(newAllocations);
    };

    const handleTokenChange = (walletAddress: string, chainId: string, newToken: string) => {
        if (!routeSummary) return;

        const newAllocations = routeSummary.allocations.map(alloc => {
            if (alloc.from.toLowerCase() !== walletAddress.toLowerCase()) return alloc;
            return {
                ...alloc,
                chains: alloc.chains.map(c => c.chainId === chainId ? { ...c, token: newToken } : c)
            };
        });

        setSimulationResults(prev => ({ ...prev, [chainId]: null }));
        setSimulationErrorMessages(prev => ({ ...prev, [chainId]: null }));
        setSimulationError(chainId, true);
        updateSummary(newAllocations);
    };

    const handleAmountChange = (walletAddress: string, chainId: string, newAmount: string) => {
        if (!routeSummary) return;

        const amount = parseFloat(newAmount) || 0;

        const newAllocations = routeSummary.allocations.map(alloc => {
            if (alloc.from.toLowerCase() !== walletAddress.toLowerCase()) return alloc;
            return {
                ...alloc,
                chains: alloc.chains.map(c => c.chainId === chainId ? { ...c, amount: amount } : c)
            };
        });

        setSimulationResults(prev => ({ ...prev, [chainId]: null }));
        setSimulationErrorMessages(prev => ({ ...prev, [chainId]: null }));
        setSimulationError(chainId, true);
        updateSummary(newAllocations);
    };

    const handleAddWallet = (wallet: { name: string; address: string; chains: any[] }) => {
        if (!routeSummary) return;

        if (routeSummary.allocations.some(a => a.from.toLowerCase() === wallet.address.toLowerCase())) {
            handleCloseWalletMenu();
            return;
        }

        const newAllocations = [
            ...routeSummary.allocations,
            {
                from: wallet.address,
                chains: []
            }
        ];

        updateSummary(newAllocations);
        handleCloseWalletMenu();
    };

    const handleAddChain = (walletAddress: string, chain: any) => {
        if (!routeSummary) return;

        const chainId = (chain.evm?.chain?.id || chain.value || chain.chainId || chain.id).toString();

        const newAllocations = routeSummary.allocations.map(alloc => {
            if (alloc.from.toLowerCase() !== walletAddress.toLowerCase()) return alloc;

            if (alloc.chains.some(c => c.chainId === chainId)) return alloc;

            return {
                ...alloc,
                chains: [
                    ...alloc.chains,
                    {
                        chainId: chainId,
                        amount: 0,
                        token: "USDC"
                    }
                ]
            };
        });

        updateSummary(newAllocations);
        handleCloseChainMenu();
    };

    const handleCloseWalletMenu = () => {
        setAnchorElWallet(null);
    };

    const handleCloseChainMenu = () => {
        setAnchorElChain(null);
        setActiveWalletForChainAdd(null);
    };

    const handleOpenChainMenu = (event: React.MouseEvent<HTMLElement>, walletAddress: string) => {
        setAnchorElChain(event.currentTarget);
        setActiveWalletForChainAdd(walletAddress);
    };

    const handleOpenWalletMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElWallet(event.currentTarget);
    };

    // Validation Check to Disable Save
    const hasErrors = (routeSummary?.allocations || []).some(walletAlloc => {
        return walletAlloc.chains.some(r => {
            const currentWallet = wallets.find(w => w.address.toLowerCase() === walletAlloc.from.toLowerCase());
            const currentChainDetail = currentWallet?.chains.find(c => {
                const cId = (c.value || c.chainId || c.id || "").toString();
                return cId === r.chainId;
            });
            const chainBalance = currentChainDetail?.amount || 0;
            const destChainId = selected.evm?.chain?.id?.toString() || "";
            const isSameChain = destChainId === r.chainId;
            const isUSDC = (r.token || "USDC").toUpperCase() === "USDC";

            const isDev = process.env.NODE_ENV === 'development';
            const baseFee = (isSameChain && isUSDC) ? 0.01 : 0.02;
            const fee = isDev ? 0 : baseFee;
            const maxUsable = Math.max(0, chainBalance - fee);

            if (r.amount <= 0 || r.amount > maxUsable + 1e-9) return true;

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
                (r.token || "USDC").toUpperCase() === "USDC";

            if (isCCTP) return false;

            if (isNearSupported && !isEditing) {
                if (!simulationResults[r.chainId]) return true;
            }

            return false;
        });
    });

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
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography
                    fontWeight={800}
                    fontSize={{ xs: 13, sm: 15 }}
                    sx={{
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: "#000000"
                    }}
                >
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
                    sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        color: (isEditing && hasErrors) ? "#999999" : (isEditing ? "#00DC8C" : "#000000")
                    }}
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

                {/* Add Wallet Button */}
                {isEditing && (
                    <Button
                        startIcon={<AddCircleIcon />}
                        onClick={handleOpenWalletMenu}
                        fullWidth
                        sx={{
                            p: 2,
                            textTransform: "none",
                            fontWeight: 800,
                            color: "#000000",
                            backgroundColor: "#ffffff",
                            border: "2px dashed #000000",
                            borderRadius: 3,
                        }}
                    >
                        Agregar Wallet
                    </Button>
                )}
            </Stack>

            {/* WALLET MENU */}
            <Menu
                anchorEl={anchorElWallet}
                open={Boolean(anchorElWallet)}
                onClose={handleCloseWalletMenu}
            >
                {wallets.filter(w => !routeSummary?.allocations.some(a => a.from.toLowerCase() === w.address.toLowerCase())).map((wallet) => (
                    <MenuItem key={wallet.address} onClick={() => handleAddWallet(wallet)}>
                        <Typography fontWeight={700}>{wallet.name} ({wallet.address.slice(0, 6)}...)</Typography>
                    </MenuItem>
                ))}
            </Menu>

            {/* CHAIN MENU */}
            <Menu
                anchorEl={anchorElChain}
                open={Boolean(anchorElChain)}
                onClose={handleCloseChainMenu}
            >
                {activeWalletForChainAdd && Object.values(NETWORKS).filter(n => {
                    if (!n.evm) return false;

                    const dest = selected;
                    const source = n;

                    const hasCctp = source.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                        dest.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;

                    const hasNear = source.crossChainInformation?.nearIntentInformation?.support &&
                        dest.crossChainInformation?.nearIntentInformation?.support;

                    return hasCctp || hasNear;
                }).map((chain) => {
                    const chainId = chain.evm?.chain.id.toString();
                    const label = chain.label;

                    return (
                        <MenuItem key={chainId} onClick={() => handleAddChain(activeWalletForChainAdd!, chain)}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                {chain.icon}
                                <Typography fontWeight={700}>{label}</Typography>
                            </Stack>
                        </MenuItem>
                    );
                })}
            </Menu>

            {/* RESUMEN FINAL */}
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
                <Box>
                    <Typography
                        fontWeight={800}
                        fontSize={{ xs: 11, sm: 13 }}
                        sx={{
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "#666666",
                            mb: 0.5
                        }}
                    >
                        Destinatario
                    </Typography>

                    {!isEditing ? (
                        <>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "#000000",
                                    fontWeight: 600,
                                    fontSize: { xs: 11, sm: 12 },
                                    fontFamily: "monospace",
                                    mb: 1.5,
                                    wordBreak: "break-all",
                                    overflowWrap: "break-word"
                                }}
                            >
                                {watch("toAddress") || "N/D"}
                            </Typography>

                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{
                                    width: { xs: 20, sm: 24 },
                                    height: { xs: 20, sm: 24 },
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    "& svg": { width: "100%", height: "100%" }
                                }}>
                                    {NETWORKS[watch("sendChain") as ChainKey]?.icon || selected?.icon}
                                </Box>
                                <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    fontSize={{ xs: 12, sm: 13 }}
                                    color="#000000"
                                >
                                    Llega en {NETWORKS[watch("sendChain") as ChainKey]?.label || selected?.label || "Chain destino"}
                                </Typography>

                                <Stack direction="row" alignItems="center" spacing={0.8} ml={1}>
                                    <Box sx={{
                                        width: 16,
                                        height: 16,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        "& svg": { width: "100%", height: "100%" }
                                    }}>
                                        {(() => {
                                            const cKey = watch("sendChain") as ChainKey;
                                            const tName = watch("sourceToken");
                                            const assets = NETWORKS[cKey]?.assets;
                                            const asset = assets?.find(a => a.name === tName);
                                            return asset?.icon;
                                        })()}
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        fontSize={{ xs: 12, sm: 13 }}
                                        color="#666666"
                                    >
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
                                    <TextField
                                        {...field}
                                        fullWidth
                                        size="small"
                                        label="Address Destino"
                                        placeholder="0x..."
                                        InputProps={{
                                            sx: { fontFamily: "monospace", fontSize: 13, background: "#ffffff" }
                                        }}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="sendChain"
                                render={({ field }) => (
                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Chain"
                                        {...field}
                                        InputProps={{ sx: { background: "#ffffff" } }}
                                    >
                                        {Object.entries(NETWORKS).filter(([k, cfg]) => !!cfg.evm).map(([key, cfg]) => (
                                            <MenuItem key={key} value={key}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Box sx={{ width: 20, height: 20, display: "flex", "& svg": { width: "100%" } }}>
                                                        {cfg.icon}
                                                    </Box>
                                                    <Typography fontSize={13} fontWeight={600}>{cfg.label}</Typography>
                                                </Stack>
                                            </MenuItem>
                                        ))}
                                        {/* STELLAR OPTION */}
                                        <MenuItem key="Stellar" value="Stellar">
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Box sx={{ width: 20, height: 20, display: "flex", "& svg": { width: "100%" } }}>
                                                    {STELLAR.icon}
                                                </Box>
                                                <Typography fontSize={13} fontWeight={600}>{STELLAR.label}</Typography>
                                            </Stack>
                                        </MenuItem>
                                    </TextField>
                                )}
                            />

                            <TokenSelector
                                label="Token"
                                name="sourceToken"
                                control={control as any}
                                chain={watch("sendChain")}
                            />
                        </Stack>
                    )}
                </Box>

                <SendMoneyRouteSummary
                    routeSummary={routeSummary}
                    selected={selected}
                    watch={watch}
                    simulationResults={simulationResults}
                />
            </Box>
        </Box>
    )
}