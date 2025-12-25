import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography, IconButton, Button, TextField, Menu, MenuItem } from "@mui/material";
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
import { useState } from "react";
import { TokenSelector } from "@/app/dashboard/components/CrossChainTransferModal/TokenSelector";
import { useForm, Control } from "react-hook-form";

type Props = {
    routeDetails: RouteDetail[],
    routeReady: boolean,
    routeSummary: AllocationSummary | null,
    setRouteSummary: (summary: AllocationSummary | null) => void,
    selected: ChainConfig,
    wallets: { name: string; address: string; chains: any[] }[]
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
    { routeDetails, routeReady, routeSummary, setRouteSummary, selected, wallets }: Props
) => {
    const [isEditing, setIsEditing] = useState(false);
    const { control, watch, setValue } = useForm();

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
                        token: "USDC"
                    }
                ]
            };
        });

        updateSummary(newAllocations);
        handleCloseChainMenu();
    };


    const handleOpenWalletMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElWallet(event.currentTarget);
    };
    const handleCloseWalletMenu = () => {
        setAnchorElWallet(null);
    };

    const handleOpenChainMenu = (event: React.MouseEvent<HTMLElement>, walletAddress: string) => {
        setAnchorElChain(event.currentTarget);
        setActiveWalletForChainAdd(walletAddress);
    };
    const handleCloseChainMenu = () => {
        setAnchorElChain(null);
        setActiveWalletForChainAdd(null);
    };

    // Validation Check to Disable Save
    const hasErrors = (routeSummary?.allocations || []).some(walletAlloc => {
        return walletAlloc.chains.some(r => {
            const currentWallet = wallets.find(w => w.address.toLowerCase() === walletAlloc.from.toLowerCase());
            const currentChainDetail = currentWallet?.chains.find(c => {
                const cId = (c.value || c.chainId || c.id || "").toString();
                return cId === r.chainId;
            });
            const maxAmount = currentChainDetail?.amount || 0;

            // Check if amount is invalid
            if (r.amount > maxAmount) return true;
            return false;
        });
    });

    return (
        <Box
            sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                backgroundColor: "#f5f5f5",
                border: "2px solid #000000",
                display: "flex",
                flexDirection: "column",
                gap: 2,
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
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

            <Stack spacing={2}>
                {(routeSummary?.allocations || []).map((walletAlloc) => {
                    const walletDetail = routeDetails.find(w => w.wallet.toLowerCase() === walletAlloc.from.toLowerCase());
                    const walletName = walletDetail?.walletName || wallets.find(w => w.address.toLowerCase() === walletAlloc.from.toLowerCase())?.name || "Wallet";
                    const shortAddress = `${walletAlloc.from.slice(0, 6)}...${walletAlloc.from.slice(-4)}`;

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
                                    <Box flex={1} minWidth={0}>
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
                                                    const fee = 0.02;
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
                                        const maxAmount = currentChainDetail?.amount || 0;

                                        const destChainId = selected.evm?.chain?.id?.toString() || "";
                                        const isSameChain = destChainId === r.chainId;
                                        const isUSDC = (r.token || "USDC").toUpperCase() === "USDC";

                                        const minAmount = (isSameChain && isUSDC) ? 0.01 : 0.02;

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
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={r.amount}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (val > maxAmount) {
                                                                    handleAmountChange(walletAlloc.from, r.chainId, maxAmount.toString());
                                                                } else {
                                                                    handleAmountChange(walletAlloc.from, r.chainId, e.target.value);
                                                                }
                                                            }}
                                                            inputProps={{ max: maxAmount, step: "any" }}
                                                            helperText={
                                                                r.amount > maxAmount
                                                                    ? `Max: ${formatCurrency(maxAmount, 2)}`
                                                                    : null
                                                            }
                                                            error={r.amount > maxAmount}
                                                            sx={{ width: 140 }}
                                                        />
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
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Typography fontSize={11} fontWeight={700} color="#666666">
                                                        Token: {r.token || "USDC"}
                                                    </Typography>
                                                )}

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
                        {routeReady || "N/D"}
                    </Typography>

                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{
                            width: { xs: 20, sm: 24 },
                            height: { xs: 20, sm: 24 },
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            "& svg": {
                                width: "100%",
                                height: "100%",
                            }
                        }}>
                            {selected?.icon}
                        </Box>
                        <Typography
                            variant="body2"
                            fontWeight={700}
                            fontSize={{ xs: 12, sm: 13 }}
                            color="#000000"
                        >
                            Llega en {selected?.label || "Chain destino"}
                        </Typography>
                    </Stack>
                </Box>

                <Box
                    sx={{
                        background: "#f5f5f5",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        p: { xs: 1.5, sm: 2 },
                    }}
                >
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
                        Recibe
                    </Typography>

                    <Typography
                        fontWeight={900}
                        fontSize={{ xs: 18, sm: 24 }}
                        color="#000000"
                        sx={{ mb: 0.5 }}
                    >
                        {formatCurrency((routeSummary?.totalAmountTaken ?? 0), 6)}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: "#666666",
                            fontWeight: 600,
                            fontSize: { xs: 10, sm: 11 }
                        }}
                    >
                        Monto neto (estimado)
                    </Typography>
                </Box>
            </Box>
        </Box>
    )
}