import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography, IconButton, Button, TextField, Menu, MenuItem, CircularProgress, Divider } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { ChainConfig, ChainKey } from "@/app/types/chain";
import { AllocationSummary, Wallet } from "@/app/dashboard/types";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import MoveUpIcon from '@mui/icons-material/MoveUp';
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { RouteDetail } from "@/app/dashboard/hooks/useSendMoneyModal";
import { useState, useMemo, useEffect } from "react";
import { TokenSelector } from "@/app/dashboard/components/CrossChainTransferModal/TokenSelector";
import { UseFormWatch, UseFormSetValue, Control, Controller } from "react-hook-form";
import { SendForm } from "@/app/lib/zod/sendSchema";
import { toast } from "react-toastify";

type Props = {
    routeDetails: RouteDetail[],
    routeReady: boolean,
    routeSummary: AllocationSummary | null,
    setRouteSummary: (summary: AllocationSummary | null) => void,
    selected: ChainConfig,
    wallets: { name: string; address: string; chains: any[] }[],
    isEditing: boolean,
    setIsEditing: (isEditing: boolean) => void,
    watch: UseFormWatch<SendForm>, // [RESTORED]
    control: Control<SendForm>, // [RESTORED]
    setValue: UseFormSetValue<SendForm>, // [RESTORED]
    setSimulationError: (id: string, hasError: boolean) => void;
}

export const STATUS_META = {
    idle: { label: "Pendiente", icon: <HourglassEmptyIcon />, color: "#cccccc" },
    starting: { label: "Iniciando", icon: <RocketLaunchIcon />, color: "#3CD2FF" },
    approving: { label: "Aprobando", icon: <AutorenewIcon sx={{ animation: "spin 1.2s linear infinite" }} />, color: "#7852FF" },
    burning: { label: "Quemando", icon: <LocalFireDepartmentIcon />, color: "#FF0420" },
    waiting: { label: "Esperando", icon: <HourglassBottomIcon />, color: "#FF007A" },
    minting: { label: "Minteando", icon: <AutorenewIcon sx={{ animation: "spin 1.2s linear infinite" }} />, color: "#8247E5" },
    transfer: { label: "Transfiriendo", icon: <MoveUpIcon />, color: "#28A0F0" },
    done: { label: "Completado", icon: <CheckCircleIcon />, color: "#00DC8C" },
    error: { label: "Error", icon: <ErrorIcon />, color: "#ff4444" },
} as const;


export const SendMoneyModalRoute = (
    { routeDetails, routeReady, routeSummary, setRouteSummary, selected, wallets, isEditing, setIsEditing, watch, control, setValue, setSimulationError }: Props
) => {

    // Simulation State
    const [simulating, setSimulating] = useState<Record<string, boolean>>({});
    const [simulationResults, setSimulationResults] = useState<Record<string, string | null>>({});
    const [simulationErrorMessages, setSimulationErrorMessages] = useState<Record<string, string | null>>({}); // [NEW] Local error messages

    const handleSimulate = async (chainId: string, amount: number, token: string, sourceChainKey: string) => {
        if (!amount || amount <= 0) return;

        setSimulating(prev => ({ ...prev, [chainId]: true }));
        setSimulationResults(prev => ({ ...prev, [chainId]: null }));
        setSimulationErrorMessages(prev => ({ ...prev, [chainId]: null }));
        setSimulationError(chainId, true); // Block action while loading

        try {
            const destChainKey = watch("sendChain");

            // Determine Fee to Match Execution Logic
            // Backend subtracts Fee from "amount".
            // Since User pays "amount + Fee" (total), we must simulate "amount + Fee".
            // Logic must match `useSendMoneyModal.ts` (Execution) and `route.ts` (Backend)

            const isDev = process.env.NODE_ENV === 'development';

            // Assume Cross-Chain (Near usually is).
            // Same-chain Near is unlikely but handled. 
            // If destChainKey === sourceChainKey -> 0.01.
            // Else -> 0.02.
            const baseFee = (sourceChainKey === destChainKey) ? 0.01 : 0.02;
            const fee = isDev ? 0 : baseFee;

            const totalAmountToSimulate = (amount + fee).toFixed(6);

            const response = await fetch("/api/bridge/quote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceChain: sourceChainKey,
                    targetChain: destChainKey,
                    amount: totalAmountToSimulate,
                    token: watch("sourceToken") || "USDC", // The destination token requested
                    sourceToken: token // The source token being sent
                })
            });

            const data = await response.json();

            if (data.success && data.estimatedReceived) {
                setSimulationResults(prev => ({ ...prev, [chainId]: data.estimatedReceived }));
                setSimulationError(chainId, false);
            } else {
                const errorMsg = data.error || "Simulation failed";
                setSimulationErrorMessages(prev => ({ ...prev, [chainId]: errorMsg }));
                setSimulationError(chainId, true); // Block confirmation
                // toast.error(errorMsg); // Optional: toast as well? Maybe too noisy if shown inline.
            }
        } catch (error) {
            console.error("Simulation error:", error);
            setSimulationErrorMessages(prev => ({ ...prev, [chainId]: "Failed to simulate" }));
            setSimulationError(chainId, true); // Block
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

                    // Prevent simulation if CCTP is available (Priority)
                    if (isCCTP) {
                        // We might want to clear any existing simulation error/state if it was there?
                        // But mainly we just don't trigger it.
                        return;
                    }

                    if (isNearSupported && chain.amount > 0 && !simulationResults[chain.chainId] && !simulating[chain.chainId]) {
                        handleSimulate(chain.chainId, chain.amount, chain.token || "USDC", sourceChainKey);
                    }
                });
            });
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [routeSummary, watch("sendChain"), watch("sourceToken")]); // Dependencies trigger the effect


    // Add Wallet State
    const [anchorElWallet, setAnchorElWallet] = useState<null | HTMLElement>(null);

    // Add Chain State (Specific to a wallet)
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

        // Clear simulation state on change
        setSimulationResults(prev => ({ ...prev, [chainId]: null }));
        setSimulationErrorMessages(prev => ({ ...prev, [chainId]: null }));
        setSimulationError(chainId, true); // Block until re-simulated
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

        // Clear simulation state on change
        setSimulationResults(prev => ({ ...prev, [chainId]: null }));
        setSimulationErrorMessages(prev => ({ ...prev, [chainId]: null }));
        setSimulationError(chainId, true); // Block until re-simulated
        updateSummary(newAllocations);
    };

    const handleAddWallet = (wallet: { name: string; address: string; chains: any[] }) => {
        if (!routeSummary) return;

        // Check if already exists
        if (routeSummary.allocations.some(a => a.from.toLowerCase() === wallet.address.toLowerCase())) {
            handleCloseWalletMenu();
            return;
        }

        const newAllocations = [
            ...routeSummary.allocations,
            {
                from: wallet.address,
                chains: [] // Starts empty, user needs to add chain
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

            // Check if chain already exists
            if (alloc.chains.some(c => c.chainId === chainId)) return alloc;

            return {
                ...alloc,
                chains: [
                    ...alloc.chains,
                    {
                        chainId: chainId,
                        amount: 0,
                        token: "USDC" // Default token
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
            const chainBalance = currentChainDetail?.amount || 0; // Use amount for consistency with UI
            const destChainId = selected.evm?.chain?.id?.toString() || "";
            const isSameChain = destChainId === r.chainId;
            const isUSDC = (r.token || "USDC").toUpperCase() === "USDC";

            const isDev = process.env.NODE_ENV === 'development';
            const baseFee = (isSameChain && isUSDC) ? 0.01 : 0.02;
            const fee = isDev ? 0 : baseFee;
            const maxUsable = Math.max(0, chainBalance - fee);

            // Check if amount is invalid
            if (r.amount <= 0 || r.amount > maxUsable + 1e-9) return true;

            // Check if simulation is required (Near) but not done or failed
            const sourceChainKey = CHAIN_ID_TO_KEY[r.chainId];
            const destChainKey = watch("sendChain"); // This uses the form watch, make sure it's available
            const sourceConfig = NETWORKS[sourceChainKey as keyof typeof NETWORKS];
            const destConfig = NETWORKS[destChainKey as keyof typeof NETWORKS];

            const isNearSupported =
                sourceConfig?.crossChainInformation?.nearIntentInformation?.support &&
                destConfig?.crossChainInformation?.nearIntentInformation?.support;

            // Check CCTP (Exempt from simulation)
            const isCCTP =
                sourceConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                destConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                (r.token || "USDC").toUpperCase() === "USDC";

            if (isCCTP) return false; // CCTP routes don't need simulation check

            if (isNearSupported && !isEditing) {
                if (!simulationResults[r.chainId]) return true; // Block if not simulated
            }

            return false;
        });
    });

    // ... existing code ...

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

            <Stack spacing={5} pb={8}>
                {(routeSummary?.allocations || []).map((walletAlloc) => {
                    const currentWallet = wallets.find(w => w.address.toLowerCase() === walletAlloc.from.toLowerCase());
                    const walletName = currentWallet?.name || "Unknown Wallet";
                    const walletBalanceTotal = currentWallet?.chains.reduce((acc, chain) => acc + (chain.usdAmount || 0), 0) || 0;
                    const shortAddress = `${walletAlloc.from.slice(0, 6)}...${walletAlloc.from.slice(-4)}`;
                    const walletDetail = routeDetails.find(w => w.wallet.toLowerCase() === walletAlloc.from.toLowerCase());

                    return (
                        <Accordion
                            key={walletAlloc.from}
                            disableGutters
                            elevation={0}
                            defaultExpanded={true}
                            sx={{
                                backgroundColor: "#ffffff",
                                borderRadius: 3,
                                border: "2px solid #000000",
                                overflow: "hidden",
                                "&::before": { display: "none" },
                                "&.Mui-expanded": {
                                    margin: 0,
                                },
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
                                {/* Header Content */}
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
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation(); // Prevent accordion toggle
                                                    handleRemoveWallet(walletAlloc.from);
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
                                                    const destChainId = selected.evm?.chain?.id?.toString() || "";
                                                    const isSameChain = destChainId === c.chainId;
                                                    const isUSDC = (c.token || "USDC").toUpperCase() === "USDC";
                                                    const baseFee = (isSameChain && isUSDC) ? 0.01 : 0.02;
                                                    const fee = isDev ? 0 : baseFee;
                                                    return acc + c.amount + fee;
                                                }, 0),
                                                6
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
                                        const label = (chainConfig as any).label || "Chain " + r.chainId;

                                        // Status logic
                                        const existingDetail = walletDetail?.chains.find((c: any) => c.id === r.chainId);
                                        const status = existingDetail?.status || 'idle';
                                        const statusMeta = STATUS_META[status as keyof typeof STATUS_META];

                                        // Validations
                                        const currentWallet = wallets.find(w => w.address.toLowerCase() === walletAlloc.from.toLowerCase());
                                        const currentChainDetail = currentWallet?.chains.find(c => {
                                            const cId = (c.value || c.chainId || c.id || "").toString();
                                            return cId === r.chainId;
                                        });
                                        const chainBalance = currentChainDetail?.amount || 0;
                                        const destChainId = selected.evm?.chain?.id?.toString() || "";
                                        const isSameChain = destChainId === r.chainId;
                                        const isUSDC = (r.token || "USDC").toUpperCase() === "USDC"; // Default USDC if no token

                                        const fee = (isSameChain && isUSDC) ? 0.01 : 0.02;
                                        const maxUsable = Math.max(0, chainBalance - fee);

                                        return (
                                            <Box
                                                key={r.chainId}
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
                                                        onClick={() => handleRemoveChain(walletAlloc.from, r.chainId)}
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
                                                                    if (val > maxUsable) {
                                                                        handleAmountChange(walletAlloc.from, r.chainId, maxUsable.toString());
                                                                    } else {
                                                                        handleAmountChange(walletAlloc.from, r.chainId, e.target.value);
                                                                    }
                                                                }}
                                                                inputProps={{ max: maxUsable, step: "any" }}
                                                                error={r.amount > maxUsable}
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
                                                            name={`token_${walletAlloc.from}_${r.chainId}` as any}
                                                            control={control as any}
                                                            chain={chainKey as any}
                                                            onChange={(val: string) => handleTokenChange(walletAlloc.from, r.chainId, val)}
                                                            allowedTokens={(() => {
                                                                const source = chainConfig as any;
                                                                const dest = selected;

                                                                const hasCctp = source.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                                                                    dest.evm && // Dest must be EVM for CCTP here? Or just check circle info
                                                                    dest.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;

                                                                const hasNear = source.crossChainInformation?.nearIntentInformation?.support &&
                                                                    dest.crossChainInformation?.nearIntentInformation?.support;

                                                                const allowed = new Set<string>();
                                                                if (hasCctp) allowed.add("USDC");
                                                                if (hasNear) {
                                                                    source.crossChainInformation?.nearIntentInformation?.assetsId?.forEach((a: any) => allowed.add(a.name));
                                                                }

                                                                return allowed.size > 0 ? Array.from(allowed) : undefined;
                                                            })()}
                                                            balances={{
                                                                [r.token || "USDC"]: chainBalance // Pass known balance. For others it will be hidden.
                                                            }}
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Box mt={1} display="flex" alignItems="center" gap={1}>
                                                        {(() => {
                                                            const tokenSymbol = r.token || "USDC";
                                                            const asset = chainConfig?.assets?.find((a: any) => a.name === tokenSymbol);
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

                                                    // Check CCTP (Same logic as TokenSelector)
                                                    const isCCTP =
                                                        sourceConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                                                        destConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                                                        (r.token || "USDC").toUpperCase() === "USDC";

                                                    // If CCTP is supported, don't show Near simulation button
                                                    if (isCCTP) return null;

                                                    if (!isNearSupported || isEditing) return null;

                                                    return (
                                                        <Box mt={1} display="flex" alignItems="center" gap={1}>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                disabled={simulating[r.chainId] || !r.amount || r.amount <= 0}
                                                                onClick={() => handleSimulate(r.chainId, r.amount, r.token, sourceChainKey)}
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
                                                                {simulating[r.chainId] ? <CircularProgress size={12} /> : "Simular"}
                                                            </Button>
                                                            {simulationErrorMessages[r.chainId] ? (
                                                                <Typography fontSize={11} color="error.main" fontWeight={600}>
                                                                    {simulationErrorMessages[r.chainId]}
                                                                </Typography>
                                                            ) : simulationResults[r.chainId] ? (
                                                                <Typography fontSize={11} color="success.main" fontWeight={600}>
                                                                    Recibes: {simulationResults[r.chainId]} {watch("sourceToken")}
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
                                    })}

                                    {/* Add Chain Button */}
                                    {isEditing && (
                                        <Button
                                            startIcon={<AddCircleIcon />}
                                            onClick={(e) => handleOpenChainMenu(e, walletAlloc.from)}
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
                    );
                })}

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

                    // Compatibility Check
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
                        <MenuItem key={chainId} onClick={() => handleAddChain(activeWalletForChainAdd, chain)}>
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
                            {/* Address */}
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

                            {/* Chain */}
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
                                    </TextField>
                                )}
                            />

                            {/* Token */}
                            <TokenSelector
                                label="Token"
                                name="sourceToken"
                                control={control as any}
                                chain={watch("sendChain")}
                            />
                        </Stack>
                    )}
                </Box>

                <Box
                    sx={{
                        background: "#f5f5f5",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        p: { xs: 1.5, sm: 2 },
                    }}
                >
                    {(() => {
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
                                        destConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP) && isUSDC;

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
                            <Stack spacing={1}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" fontWeight={700} color="#666666" fontSize={{ xs: 11, sm: 12 }}>
                                        ENVIA
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color="#000000" fontSize={{ xs: 12, sm: 13 }}>
                                        {formatCurrency(totalPrincipal, 6)}
                                    </Typography>
                                </Stack>

                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" fontWeight={700} color="#666666" fontSize={{ xs: 11, sm: 12 }}>
                                        FEE PLATAFORMA
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color="#ff4444" fontSize={{ xs: 12, sm: 13 }}>
                                        -{formatCurrency(totalFee, 6)}
                                    </Typography>
                                </Stack>

                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" fontWeight={700} color="#666666" fontSize={{ xs: 11, sm: 12 }}>
                                        RECIBE (EST.)
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color="#00DC8C" fontSize={{ xs: 12, sm: 13 }}>
                                        {formatCurrency(totalReceived, 6)} <span style={{ color: "#000000", fontSize: "11px" }}>USDC</span>
                                    </Typography>
                                </Stack>

                                <Divider sx={{ borderStyle: "dashed", borderColor: "#cccccc" }} />

                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" fontWeight={800} color="#666666" fontSize={{ xs: 11, sm: 12 }}>
                                        DIFERENCIA
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color={isDiffPositive ? "#00DC8C" : "#ff4444"} fontSize={{ xs: 12, sm: 13 }}>
                                        {isDiffPositive ? "+" : ""}{formatCurrency(diff, 6)}
                                    </Typography>
                                </Stack>
                            </Stack>
                        );
                    })()}
                </Box>
            </Box>
        </Box>
    )
}