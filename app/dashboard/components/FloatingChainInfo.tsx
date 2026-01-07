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
    Tooltip
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
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const FloatingChainInfo: React.FC<FloatingChainInfoProps> = ({
    selectedChain,
    isDeployed,
    ensureDeployed,
    ensureApproval,
    account
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

    useEffect(() => {
        const checkApprovals = async () => {
            if (!account || !config || !open) return;

            const newApprovals: Record<string, boolean> = {};

            for (const asset of config.assets) {
                // Skip Native/Zero Address
                if (!asset.address || asset.address === ZERO_ADDRESS) continue;

                try {
                    const allowance = await account.getAllowance(asset.address as Address);
                    if (allowance > BigInt(0)) {
                        newApprovals[asset.name] = true;
                    } else {
                        newApprovals[asset.name] = false;
                    }
                } catch (e) {
                    // Fail silently for UI check
                    newApprovals[asset.name] = false;
                }
            }
            setApprovals(newApprovals);
        };

        checkApprovals();
    }, [account, config, open]);

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

    const handleApprove = async (tokenName: string, tokenAddress: Address, decimals: number) => {
        setApprovingToken(tokenName);
        try {
            // Approve max uint256
            const maxAmount = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");
            await ensureApproval(tokenAddress, FACILITATOR_ADDRESS, maxAmount);
            toast.success(`Approved ${tokenName} for Facilitator`);
            setApprovals(prev => ({ ...prev, [tokenName]: true }));
        } catch (e) {
            console.error("Approval failed", e);
            toast.error(`Failed to approve ${tokenName}`);
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
                        {config.icon}
                        <Typography variant="h6" fontWeight="bold">{selectedChain}</Typography>
                    </Box>
                    <IconButton size="small" onClick={handleClose}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Divider sx={{ mb: 2 }} />

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
                                disabled={loadingDeploy}
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
                    {approvalAssets.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">No approval needed for native assets.</Typography>
                    ) : (
                        <List dense sx={{ p: 0 }}>
                            {approvalAssets.map((asset) => {
                                const isApproved = approvals[asset.name];
                                return (
                                    <ListItem
                                        key={asset.name}
                                        secondaryAction={
                                            isApproved ? (
                                                <Tooltip title="Approved for Facilitator">
                                                    <CheckCircleIcon color="success" fontSize="small" />
                                                </Tooltip>
                                            ) : (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                    startIcon={approvingToken === asset.name ? <CircularProgress size={12} /> : <VerifiedUserIcon />}
                                                    onClick={() => handleApprove(asset.name, asset.address as Address, asset.decimals)}
                                                    disabled={approvingToken === asset.name || !account} // Disable if no account
                                                    sx={{
                                                        fontSize: 10,
                                                        minWidth: "auto",
                                                        px: 1,
                                                        py: 0.5,
                                                        borderRadius: 2,
                                                        textTransform: "none"
                                                    }}
                                                >
                                                    Approve
                                                </Button>
                                            )
                                        }
                                        sx={{
                                            border: "1px solid #eee",
                                            borderRadius: 2,
                                            mb: 1
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 36 }}>
                                            <Avatar sx={{ width: 24, height: 24, background: "transparent" }} src="">
                                                {asset.icon}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={asset.name}
                                            secondary={asset.address ? (asset.address.slice(0, 6) + "..." + asset.address.slice(-4)) : ""}
                                            primaryTypographyProps={{ fontWeight: 600, fontSize: 13 }}
                                            secondaryTypographyProps={{ fontSize: 10, fontFamily: "monospace" }}
                                        />
                                    </ListItem>
                                )
                            })}
                        </List>
                    )}
                </Box>
            </Popover>
        </>
    );
};
