"use client";

import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    Button,
    Chip,
    Stack,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SendIcon from "@mui/icons-material/Send";
import DownloadIcon from "@mui/icons-material/Download";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BaseChainItem from "@/app/components/molecules/BaseChainItem";
import OptimismChainItem from "@/app/components/molecules/OptimismChainItem";
import { useMemo, useState } from "react";
import ArbitrumChainItem from "@/app/components/molecules/ArbitrumChainItem";
import { Address } from "abitype";
import { toast } from "react-toastify";
import { useWalletStore } from "@/app/store/useWalletsStore";
import UnichainChainItem from "@/app/components/molecules/UnichainChainItem";
import PolygonChainItem from "@/app/components/molecules/PolygonChainItem";
import AvalancheChainItem from "@/app/components/molecules/AvalancheChainItem";

interface IAddressCardProps {
    address: Address;
    walletName: string;
    onSend?: () => void;
    onReceive?: () => void;
}

export const AddressCard = ({
    address,
    walletName,
    onSend,
    onReceive,
}: IAddressCardProps) => {
    const [showMore, setShowMore] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const totalBalance = useWalletStore(
        (state) => state.getWalletTotalBalance(address)
    );
    const { removeWallet } = useWalletStore();

    const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;

    const copyToClipboard = async (value: string, label: string) => {
        const text = value ?? "";
        if (!text) {
            toast.error("Nothing to copy");
            return;
        }
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                toast.success(`${label} copied!`);
                return;
            }
        } catch {
            // fallback
        }
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand("copy");
            toast.success(`${label} copied!`);
        } catch {
            toast.error("Failed to copy");
        } finally {
            document.body.removeChild(textarea);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handleDeleteClick = () => {
        handleMenuClose();
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        removeWallet(address);
        setDeleteDialogOpen(false);
        toast.success("Wallet removed successfully");
    };

    const formatBalance = (balance: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(balance);
    };

    return (
        <>
            <Card
                elevation={0}
                sx={{
                    borderRadius: "16px",
                    overflow: "hidden",
                    transition: "all 0.25s ease",
                    background: "linear-gradient(145deg, #0f1729 0%, #131c2d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 40px rgba(14, 165, 233, 0.15)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                    },
                }}
            >
                {/* Accent line at top */}
                <Box
                    sx={{
                        height: "3px",
                        background: "linear-gradient(90deg, #0ea5e9 0%, #8b5cf6 100%)",
                    }}
                />

                {/* Header Section */}
                <Box sx={{ p: 2.5, pb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        {/* Left: Wallet info */}
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "12px",
                                    background: "linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <AccountBalanceWalletIcon sx={{ color: "#0ea5e9", fontSize: 24 }} />
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: "16px",
                                        color: "#f1f5f9",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {walletName}
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
                                    <Typography
                                        component="code"
                                        sx={{
                                            fontSize: "13px",
                                            color: "#94a3b8",
                                            fontFamily: "var(--font-mono), monospace",
                                        }}
                                    >
                                        {truncated}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(address, "Address");
                                        }}
                                        sx={{
                                            p: 0.5,
                                            color: "#64748b",
                                            "&:hover": { color: "#0ea5e9", background: "rgba(14, 165, 233, 0.1)" },
                                        }}
                                    >
                                        <ContentCopyIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        component="a"
                                        href={`https://etherscan.io/address/${address}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            p: 0.5,
                                            color: "#64748b",
                                            "&:hover": { color: "#0ea5e9", background: "rgba(14, 165, 233, 0.1)" },
                                        }}
                                    >
                                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </Stack>
                            </Box>
                        </Stack>

                        {/* Right: Menu */}
                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                            sx={{
                                color: "#64748b",
                                "&:hover": { color: "#f1f5f9", background: "rgba(255, 255, 255, 0.08)" },
                            }}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Stack>

                    {/* Balance Display */}
                    <Box sx={{ mt: 2.5, mb: 1 }}>
                        <Typography
                            sx={{
                                fontSize: { xs: "28px", sm: "32px" },
                                fontWeight: 800,
                                color: "#f1f5f9",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {formatBalance(totalBalance)}
                        </Typography>
                        <Chip
                            label="6 chains"
                            size="small"
                            sx={{
                                mt: 1,
                                height: "24px",
                                fontSize: "11px",
                                fontWeight: 600,
                                background: "rgba(16, 185, 129, 0.15)",
                                color: "#10b981",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                            }}
                        />
                    </Box>
                </Box>

                {/* Quick Actions */}
                <Box sx={{ px: 2.5, pb: 2 }}>
                    <Stack direction="row" spacing={1}>
                        <Button
                            size="small"
                            startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                            onClick={onSend}
                            sx={{
                                flex: 1,
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "13px",
                                py: 1,
                                borderRadius: "10px",
                                color: "#f1f5f9",
                                background: "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
                                boxShadow: "0 4px 16px rgba(14, 165, 233, 0.3)",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)",
                                    boxShadow: "0 6px 20px rgba(14, 165, 233, 0.4)",
                                },
                            }}
                        >
                            Send
                        </Button>
                        <Button
                            size="small"
                            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                            onClick={onReceive}
                            sx={{
                                flex: 1,
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "13px",
                                py: 1,
                                borderRadius: "10px",
                                color: "#94a3b8",
                                background: "rgba(255, 255, 255, 0.06)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                "&:hover": {
                                    background: "rgba(255, 255, 255, 0.1)",
                                    border: "1px solid rgba(255, 255, 255, 0.15)",
                                    color: "#f1f5f9",
                                },
                            }}
                        >
                            Receive
                        </Button>
                    </Stack>
                </Box>

                {/* Chain List */}
                <CardContent sx={{ p: 0 }}>
                    <Box
                        sx={{
                            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                            background: "rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        <BaseChainItem address={address} />
                        <Box sx={{ borderTop: "1px solid rgba(255, 255, 255, 0.04)" }} />
                        <OptimismChainItem address={address} />

                        {showMore && (
                            <>
                                <Box sx={{ borderTop: "1px solid rgba(255, 255, 255, 0.04)" }} />
                                <ArbitrumChainItem address={address} />
                                <Box sx={{ borderTop: "1px solid rgba(255, 255, 255, 0.04)" }} />
                                <UnichainChainItem address={address} />
                                <Box sx={{ borderTop: "1px solid rgba(255, 255, 255, 0.04)" }} />
                                <PolygonChainItem address={address} />
                                <Box sx={{ borderTop: "1px solid rgba(255, 255, 255, 0.04)" }} />
                                <AvalancheChainItem address={address} />
                            </>
                        )}
                    </Box>
                </CardContent>

                {/* Footer - Expand/Collapse */}
                <Box sx={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <Button
                        fullWidth
                        onClick={() => setShowMore(!showMore)}
                        endIcon={
                            <ExpandMoreIcon
                                sx={{
                                    transform: showMore ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.25s ease",
                                }}
                            />
                        }
                        sx={{
                            py: 1.5,
                            textTransform: "none",
                            color: "#64748b",
                            fontWeight: 600,
                            fontSize: "13px",
                            borderRadius: 0,
                            "&:hover": {
                                background: "rgba(255, 255, 255, 0.04)",
                                color: "#94a3b8",
                            },
                        }}
                    >
                        {showMore ? "Show less" : "Show 4 more chains"}
                    </Button>
                </Box>
            </Card>

            {/* Context Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                PaperProps={{
                    sx: {
                        background: "#1a2438",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 16px 48px rgba(0, 0, 0, 0.5)",
                        minWidth: 180,
                        mt: 1,
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        copyToClipboard(address, "Address");
                        handleMenuClose();
                    }}
                    sx={{
                        color: "#f1f5f9",
                        py: 1.25,
                        "&:hover": { background: "rgba(255, 255, 255, 0.08)" },
                    }}
                >
                    <ListItemIcon>
                        <ContentCopyIcon fontSize="small" sx={{ color: "#64748b" }} />
                    </ListItemIcon>
                    <ListItemText>Copy address</ListItemText>
                </MenuItem>
                <MenuItem
                    component="a"
                    href={`https://etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleMenuClose}
                    sx={{
                        color: "#f1f5f9",
                        py: 1.25,
                        "&:hover": { background: "rgba(255, 255, 255, 0.08)" },
                    }}
                >
                    <ListItemIcon>
                        <OpenInNewIcon fontSize="small" sx={{ color: "#64748b" }} />
                    </ListItemIcon>
                    <ListItemText>View on Etherscan</ListItemText>
                </MenuItem>
                <Box sx={{ my: 0.5, mx: 1.5, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }} />
                <MenuItem
                    onClick={handleDeleteClick}
                    sx={{
                        color: "#ef4444",
                        py: 1.25,
                        "&:hover": { background: "rgba(239, 68, 68, 0.1)" },
                    }}
                >
                    <ListItemIcon>
                        <DeleteOutlineIcon fontSize="small" sx={{ color: "#ef4444" }} />
                    </ListItemIcon>
                    <ListItemText>Remove wallet</ListItemText>
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        background: "linear-gradient(145deg, #0f1729 0%, #131c2d 100%)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "20px",
                        boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
                        maxWidth: 400,
                        mx: 2,
                    },
                }}
            >
                <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: "12px",
                                background: "rgba(239, 68, 68, 0.15)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <WarningAmberIcon sx={{ color: "#ef4444", fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "18px", color: "#f1f5f9" }}>
                                Remove wallet
                            </Typography>
                            <Typography sx={{ fontSize: "13px", color: "#94a3b8" }}>
                                This action cannot be undone
                            </Typography>
                        </Box>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2 }}>
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: "12px",
                            background: "rgba(0, 0, 0, 0.2)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                        }}
                    >
                        <Typography sx={{ fontSize: "14px", color: "#94a3b8", mb: 1 }}>
                            You&apos;re about to remove:
                        </Typography>
                        <Typography sx={{ fontWeight: 600, color: "#f1f5f9" }}>
                            {walletName}
                        </Typography>
                        <Typography
                            component="code"
                            sx={{
                                fontSize: "12px",
                                color: "#64748b",
                                fontFamily: "monospace",
                            }}
                        >
                            {truncated}
                        </Typography>
                    </Box>
                    <Typography sx={{ mt: 2, fontSize: "14px", color: "#94a3b8" }}>
                        Your funds are safe. You can re-import this wallet anytime using your seed phrase.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            color: "#94a3b8",
                            px: 2.5,
                            "&:hover": { background: "rgba(255, 255, 255, 0.08)" },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            px: 2.5,
                            borderRadius: "10px",
                            background: "#ef4444",
                            boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
                            "&:hover": {
                                background: "#dc2626",
                                boxShadow: "0 6px 20px rgba(239, 68, 68, 0.4)",
                            },
                        }}
                    >
                        Remove wallet
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
