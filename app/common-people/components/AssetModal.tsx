
import { Box, Typography, Modal, IconButton, Button, Stack } from "@mui/material";
import { useMemo } from "react";
import { Close } from "@mui/icons-material";
import { ChainData } from "./ChainCard";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore"; // [NEW]

interface AssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    chain: ChainData | null;
}

export function AssetModal({ isOpen, onClose, chain }: AssetModalProps) {
    const { openCrossChain } = useDashboardModalsStore();
    const { setSendModal } = useSendMoneyStore(); // [NEW]

    const sortedAssets = useMemo(() => {
        if (!chain) return [];
        return [...chain.assets].sort((a, b) => {
            // Parse balances (remove potential commas, though usually formatting happens later)
            // Assuming balance is a number string here based on typical usage
            const balanceA = parseFloat(a.balance.replace(/,/g, ''));
            const balanceB = parseFloat(b.balance.replace(/,/g, ''));
            const hasBalanceA = balanceA > 0;
            const hasBalanceB = balanceB > 0;

            if (hasBalanceA && !hasBalanceB) return -1;
            if (!hasBalanceA && hasBalanceB) return 1;
            return 0; // Keep original order if both have balance or both don't
        });
    }, [chain]);

    if (!chain) return null;

    const handleSwap = () => {
        openCrossChain({
            initialSourceChain: chain.networkKey,
            lockSourceChain: true,
            initialDestChain: chain.networkKey,
            lockDestChain: true // Locked per user request
        });
    };

    // [NEW] Handle Send
    const handleSend = () => {
        // Open Send Modal with Current Chain pre-selected
        // We don't force a token (undefined) so it defaults to USDC or user choice
        setSendModal(true, chain.networkKey, undefined, true);
        onClose(); // Optional: Close this modal to avoid stacking
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            aria-labelledby="asset-modal-title"
            aria-describedby="asset-modal-description"
        >
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "95%",
                    maxWidth: 420,
                    bgcolor: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: "24px",
                    boxShadow: "8px 8px 0px rgba(0,0,0,1)",
                    overflow: "hidden",
                    outline: "none",
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        p: 3,
                        pb: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
                                {chain.name}
                            </Typography>
                            {/* Optional Badge if needed */}
                        </Stack>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                            Wallet Assets
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            backgroundColor: "#f3f4f6",
                            borderRadius: "12px",
                            p: 1,
                            transition: "all 0.2s",
                            "&:hover": {
                                backgroundColor: "#e5e7eb",
                                transform: "rotate(90deg)"
                            },
                        }}
                    >
                        <Close sx={{ fontSize: 20, color: "black" }} />
                    </IconButton>
                </Box>

                {/* Content */}
                <Box sx={{ p: 3, pt: 0, maxHeight: "65vh", overflowY: "auto" }}>

                    {/* Balance Card */}
                    <Box
                        sx={{
                            mb: 2,
                            background: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)",
                            color: "white",
                            p: 2,
                            borderRadius: "16px",
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                        }}
                    >
                        {/* Decorative circle */}
                        <Box sx={{
                            position: "absolute",
                            top: -20,
                            right: -20,
                            width: 80,
                            height: 80,
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: "50%"
                        }} />

                        <Typography variant="caption" fontWeight={500} color="rgba(255,255,255,0.6)" mb={0}>
                            Total Balance
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.03em", display: "flex", alignItems: "baseline" }}>
                            {chain.formattedBalance ? (
                                <>
                                    <span style={{ fontSize: "0.6em", marginRight: 4, position: "relative", top: -6 }}>{chain.formattedBalance.symbol}</span>
                                    <span>{chain.formattedBalance.integer}</span>
                                    <span style={{ fontSize: "0.6em", position: "relative", top: -6 }}>.{chain.formattedBalance.decimal}</span>
                                    {chain.formattedBalance.code && (
                                        <span style={{ fontSize: "0.4em", marginLeft: 4, fontWeight: 700, position: "relative", top: -6 }}>{chain.formattedBalance.code}</span>
                                    )}
                                </>
                            ) : chain.totalValue}
                        </Typography>
                    </Box>

                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={2} sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem" }}>
                        Your Tokens
                    </Typography>

                    <Stack spacing={2}>
                        {sortedAssets.map((asset, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    p: 2,
                                    borderRadius: "16px",
                                    border: "1px solid #e5e7eb",
                                    transition: "all 0.2s",
                                    cursor: "pointer",
                                    "&:hover": {
                                        borderColor: "#000",
                                        backgroundColor: "#fafafa",
                                        transform: "translateY(-2px)",
                                        boxShadow: "4px 4px 0px #000000"
                                    },
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: "14px",
                                            backgroundColor: "#f3f4f6",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "black",
                                            fontWeight: "bold",
                                            fontSize: "1.2rem",
                                            border: "1px solid #e5e7eb"
                                        }}
                                    >
                                        {asset.icon ?? asset.symbol[0]}
                                    </Box>
                                    <Box>
                                        <Typography fontWeight={700} fontSize={16}>
                                            {asset.symbol}
                                        </Typography>
                                        <Typography
                                            fontWeight={500}
                                            fontSize={13}
                                            color="text.secondary"
                                        >
                                            Token
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box textAlign="right">
                                    <Typography fontWeight={700} fontSize={16}>
                                        {asset.balance}
                                    </Typography>
                                    <Typography fontWeight={500} fontSize={13} color="text.secondary" sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                                        {asset.formattedValue ? (
                                            <>
                                                <span>{asset.formattedValue.symbol}{asset.formattedValue.integer}.{asset.formattedValue.decimal}</span>
                                                {asset.formattedValue.code && <span style={{ fontSize: "0.8em", opacity: 0.7 }}>{asset.formattedValue.code}</span>}
                                            </>
                                        ) : asset.value}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Stack>

                    <Box mt={4} display="flex" gap={2}>
                        <Button
                            onClick={handleSend} // [NEW] Attached
                            fullWidth
                            variant="contained"
                            sx={{
                                backgroundColor: "black",
                                color: "white",
                                fontWeight: 700,
                                borderRadius: "14px",
                                py: 1.5,
                                textTransform: "none",
                                fontSize: "1rem",
                                boxShadow: "none",
                                border: "2px solid transparent",
                                "&:hover": {
                                    backgroundColor: "#333",
                                    boxShadow: "none",
                                },
                            }}
                        >
                            Send
                        </Button>
                        <Button
                            onClick={handleSwap}
                            fullWidth
                            sx={{
                                backgroundColor: "#00DC8C",
                                color: "black",
                                border: "2px solid black",
                                fontWeight: 800,
                                borderRadius: "14px",
                                py: 1.5,
                                textTransform: "none",
                                fontSize: "1rem",
                                boxShadow: "4px 4px 0px #000000",
                                "&:hover": {
                                    backgroundColor: "#00c980",
                                    transform: "translate(2px, 2px)",
                                    boxShadow: "2px 2px 0px #000000"
                                },
                                "&:active": {
                                    transform: "translate(4px, 4px)",
                                    boxShadow: "none"
                                }
                            }}
                        >
                            Swap
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
}
