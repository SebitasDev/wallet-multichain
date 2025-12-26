
import { Box, Typography, Modal, IconButton, Button, Stack } from "@mui/material";
import { Close } from "@mui/icons-material";
import { ChainData } from "./ChainCard";

interface AssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    chain: ChainData | null;
}

export function AssetModal({ isOpen, onClose, chain }: AssetModalProps) {
    if (!chain) return null;

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
                    width: "100%",
                    maxWidth: 448, // max-w-md
                    bgcolor: "background.paper",
                    border: "4px solid #000000",
                    borderRadius: "24px",
                    boxShadow: "12px 12px 0px #000000",
                    overflow: "hidden",
                    outline: "none",
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        backgroundColor: "#f0f9ff",
                        p: 3,
                        borderBottom: "3px solid #000000",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                    }}
                >
                    <Box>
                        <Typography variant="h5" fontWeight={900}>
                            {chain.name} Wallet
                        </Typography>
                        <Typography fontWeight="bold" color="text.secondary">
                            Assets & Tokens
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            backgroundColor: "white",
                            border: "3px solid #000000",
                            borderRadius: 2,
                            p: 0.5,
                            "&:hover": {
                                backgroundColor: "#fef2f2", // red-50
                                borderColor: "#ef4444", // red-500
                            },
                        }}
                    >
                        <Close sx={{ fontSize: 24, color: "black", strokeWidth: 3 }} />
                    </IconButton>
                </Box>

                {/* List */}
                <Box sx={{ p: 3, maxHeight: "60vh", overflowY: "auto" }}>
                    <Box
                        sx={{
                            mb: 3,
                            backgroundColor: "black",
                            color: "white",
                            p: 2,
                            borderRadius: "12px",
                            border: "3px solid #000000",
                            boxShadow: "4px 4px 0px #666",
                        }}
                    >
                        <Typography variant="body2" fontWeight="bold" color="grey.400">
                            Total Balance
                        </Typography>
                        <Typography variant="h4" fontWeight={900}>
                            {chain.totalValue}
                        </Typography>
                    </Box>

                    <Typography variant="h6" fontWeight={900} mb={2} textTransform="uppercase" letterSpacing={1}>
                        Your Assets
                    </Typography>

                    <Stack spacing={1.5}>
                        {chain.assets.map((asset, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    p: 2,
                                    backgroundColor: "white",
                                    border: "3px solid #000000",
                                    borderRadius: "12px",
                                    transition: "transform 0.2s",
                                    "&:hover": {
                                        transform: "translate(2px, 0)",
                                    },
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1.5}>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "50%",
                                            backgroundColor: "#6366f1", // indigo-500
                                            border: "2px solid #000000",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {asset.icon ?? asset.symbol[0]}
                                    </Box>
                                    <Box>
                                        <Typography fontWeight={900} fontSize={16}>
                                            {asset.symbol}
                                        </Typography>
                                        <Typography
                                            fontWeight="bold"
                                            fontSize={12}
                                            color="text.secondary"
                                            sx={{
                                                backgroundColor: "#f3f4f6", // gray-100
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 10,
                                                width: "fit-content",
                                            }}
                                        >
                                            Token
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box textAlign="right">
                                    <Typography fontWeight={900} fontSize={16}>
                                        {asset.balance}
                                    </Typography>
                                    <Typography fontWeight="bold" color="text.secondary">
                                        {asset.value}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Stack>

                    <Box mt={3} display="flex" gap={1}>
                        <Button
                            fullWidth
                            variant="outlined"
                            sx={{
                                border: "3px solid #000000",
                                color: "black",
                                fontWeight: 900,
                                borderRadius: "12px",
                                py: 1.5,
                                textTransform: "none",
                                "&:hover": {
                                    backgroundColor: "#f3f4f6",
                                    border: "3px solid #000000",
                                },
                            }}
                        >
                            Send
                        </Button>
                        <Button
                            fullWidth
                            sx={{
                                backgroundColor: "#00DC8C",
                                color: "black",
                                border: "3px solid #000000",
                                fontWeight: 900,
                                borderRadius: "12px",
                                py: 1.5,
                                textTransform: "none",
                                "&:hover": {
                                    backgroundColor: "#00c980",
                                },
                            }}
                        >
                            Swap
                        </Button>
                    </Box>
                </Box>
            </Box >
        </Modal >
    );
}
