import React, { useState, useEffect } from "react";
import {
    Box,
    Fab,
    Popover,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    IconButton,
    CircularProgress,
    Tooltip,
    Select,
    MenuItem
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { ChainKey } from "@/app/types/chain";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { Address } from "viem";
import { FACILITATOR_ADDRESS } from "@/app/facilitator/config";
import { toast } from "react-toastify";
import { AccountAbstraction } from "@1llet.xyz/erc4337-gasless-sdk";

interface FloatingChainInfoProps {
    selectedChain: ChainKey;
    isDeployed: boolean;
    ensureDeployed: () => Promise<boolean>;
    ensureApproval: (tokenAddress: Address, spender: Address, amount: bigint) => Promise<boolean>;
    account: AccountAbstraction | null;
    setSelectedChain: (chain: ChainKey) => void;
    connectedChainId: string | null;
    isConnecting?: boolean;
    smartAccountAddress: string | null; // Added prop
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const FloatingChainInfo: React.FC<FloatingChainInfoProps> = ({
    selectedChain,
    isDeployed,
    ensureDeployed,
    ensureApproval,
    account,
    setSelectedChain,
    connectedChainId,
    isConnecting = false,
    smartAccountAddress
}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [loadingDeploy, setLoadingDeploy] = useState(false);
    const [approvingToken, setApprovingToken] = useState<string | null>(null);
    const [approvals, setApprovals] = useState<Record<string, boolean>>({});

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? "floating-chain-info-popover" : undefined;

    const config = NETWORKS[selectedChain];
    const targetChainId = config?.evm?.chain?.id?.toString();
    const isChainMatching = connectedChainId === targetChainId;

    useEffect(() => {
        const checkApprovals = async () => {
            if (!account || !config || !open || !isChainMatching) return;

            const newApprovals: Record<string, boolean> = {};

            for (const asset of config.assets) {
                // Skip Native/Zero Address
                if (!asset.address || asset.address === ZERO_ADDRESS) continue;

                try {
                    const allowance = await account.getAllowance(asset.address as Address);
                    if (allowance > BigInt(0)) {
                        newApprovals[asset.address] = true;
                    } else {
                        newApprovals[asset.address] = false;
                    }
                } catch (e) {
                    // Fail silently for UI check
                    newApprovals[asset.address] = false;
                }
            }
            setApprovals(newApprovals);
        };

        checkApprovals();
    }, [account, config, open, isChainMatching]);

    const handleDeploy = async () => {
        setLoadingDeploy(true);
        try {
            await ensureDeployed();
        } catch (e) {
            console.error("Deploy failed", e);
        } finally {
            setLoadingDeploy(false);
        }
    };

    const handleApprove = async (token: { address: string; name: string }) => {
        // User requested that approvals go to the Smart Account itself
        if (!smartAccountAddress) {
            toast.error("Smart Account address missing. Please connect/deploy.");
            return;
        }

        setApprovingToken(token.address);

        // Prevent interaction if connecting
        if (isConnecting) {
            toast.warning("Reconnecting wallet... please wait.");
            setApprovingToken(null);
            return;
        }

        // Max amount
        const maxAmount = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");

        try {
            // @ts-ignore
            // Using Smart Account Address as spender per user requirement
            const success = await ensureApproval(token.address as Address, smartAccountAddress as Address, maxAmount);
            if (success) {
                setApprovals((prev) => ({ ...prev, [token.address]: true }));
            }
        } catch (e) {
            console.error("Approve failed", e);
            toast.error(`Failed to approve ${token.name}`);
        } finally {
            setApprovingToken(null);
        }
    };

    if (!config || !config.evm) return null;

    // Filter Assets: Remove Native/Zero Address
    const approvalAssets = config.assets.filter(a => a.address && a.address !== ZERO_ADDRESS);

    return (
        <>
            <Tooltip title={`Info: ${selectedChain} (Smart Account)`} arrow placement="left">
                <Fab
                    color="primary"
                    aria-label="chain-info"
                    onClick={handleClick}
                    sx={{
                        position: "fixed",
                        bottom: 80, // Above typical FABs/Bottom Nav
                        right: 20,
                        zIndex: 1300,
                        background: config.chipColor || "#000",
                        color: "#fff",
                        "&:hover": {
                            background: config.chipColor ? config.chipColor : "#333",
                            opacity: 0.9
                        }
                    }}
                >
                    {config.icon || <LanguageIcon />}
                </Fab>
            </Tooltip>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                slotProps={{
                    paper: {
                        sx: {
                            width: 340,
                            p: 2,
                            borderRadius: 3,
                            boxShadow: "0px 10px 40px rgba(0,0,0,0.2)"
                        }
                    }
                }}
            >
                {/* HEADER */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>


                        {/* Network Switcher */}
                        <Select
                            value={selectedChain}
                            onChange={(e) => setSelectedChain(e.target.value as ChainKey)}
                            variant="standard"
                            disableUnderline
                            sx={{
                                fontWeight: "bold",
                                fontSize: "1.25rem",
                                "& .MuiSelect-select": { py: 0, pr: "24px !important" },
                                "& .MuiSvgIcon-root": { fontSize: "1.5rem" }
                            }}
                        >
                            {Object.entries(NETWORKS).filter(([_, n]) => n.evm).map(([key, n]) => (
                                <MenuItem key={key} value={key}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {n.icon}
                                        <Typography fontWeight="bold">{n.label}</Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>
                    <IconButton size="small" onClick={handleClose}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {!isChainMatching && (
                    <Box sx={{ mb: 2, p: 1, bgcolor: "#fff3cd", borderRadius: 1 }}>
                        <Typography variant="caption" color="warning.main">
                            Switching to {selectedChain}... Please wait.
                        </Typography>
                    </Box>
                )}

                {/* DEPLOY STATUS */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Smart Account Status
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {isDeployed ? (
                                <CheckCircleIcon color="success" />
                            ) : (
                                <ErrorIcon color="error" />
                            )}
                            <Typography variant="body2" fontWeight="600">
                                {isDeployed ? "Desplegado (Ready)" : "No Desplegado"}
                            </Typography>
                        </Box>
                        {!isDeployed && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={loadingDeploy ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                                onClick={handleDeploy}
                                disabled={loadingDeploy || !isChainMatching || isConnecting}
                                sx={{ borderRadius: 2, textTransform: "none" }}
                            >
                                Deploy
                            </Button>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* TOKENS APPROVAL */}
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Tokens & Approvals
                    </Typography>
                    {/* ASSET LIST */}
                    {config.assets.filter(a => a.address && a.address !== ZERO_ADDRESS).length === 0 ? (
                        <Typography variant="caption" color="text.secondary">No approval needed for native assets.</Typography>
                    ) : (
                        <List dense sx={{ p: 0 }}>
                            {config.assets.filter(a => a.address && a.address !== ZERO_ADDRESS).map((token) => (
                                <ListItem key={token.name} sx={{ px: 0, py: 1, borderBottom: "1px solid #eee" }}>
                                    <ListItemAvatar>
                                        <Avatar
                                            src={typeof token.icon === 'string' ? token.icon : undefined}
                                            sx={{ width: 24, height: 24 }}
                                        >
                                            {typeof token.icon !== 'string' ? token.icon : null}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={token.name}
                                        secondary={token.address?.slice(0, 6) + "..." + token.address?.slice(-4)}
                                        primaryTypographyProps={{ fontWeight: 700, fontSize: 13 }}
                                        secondaryTypographyProps={{ fontSize: 10, fontFamily: "monospace" }}
                                    />
                                    {approvals[token.address!] ? (
                                        <CheckCircleIcon color="success" fontSize="small" />
                                    ) : (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleApprove({
                                                address: token.address!,
                                                name: token.name
                                            })}
                                            disabled={loadingDeploy || approvingToken === token.address || !isChainMatching || isConnecting}
                                            sx={{ ml: "auto", textTransform: "none", fontSize: 10, px: 1, minWidth: "auto" }}
                                        >
                                            {approvingToken === token.address ? <CircularProgress size={12} /> : "Approve"}
                                        </Button>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box >
            </Popover >
        </>
    );
};
