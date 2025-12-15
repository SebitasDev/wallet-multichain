import {
    Box,
    Stack,
    TextField,
    Typography,
    MenuItem,
    DialogContent
} from "@mui/material";
import QRCode from "react-qr-code";
import { WalletInfo } from "@/app/store/useWalletManager";

// Helper types for chains from the hook
interface Chain {
    id: string;
    label: string;
    icon: React.ComponentType;
}

interface ReceiveModalContentProps {
    wallets: WalletInfo[];
    selectedWallet: string;
    setSelectedWallet: (val: string) => void;
    chains: Chain[];
    selectedChain: string;
    setSelectedChain: (val: string) => void;
    currentChain: Chain;
    qrValue: string;
    currentAddress: string;
}

export const ReceiveModalContent = ({
    wallets,
    selectedWallet,
    setSelectedWallet,
    chains,
    selectedChain,
    setSelectedChain,
    currentChain,
    qrValue,
    currentAddress
}: ReceiveModalContentProps) => {
    return (
        <DialogContent
            sx={{
                px: 3,
                py: 3,
                background: "#ffffff",
            }}
        >
            <Stack spacing={2.5}>
                {/* SELECTORS */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            fontWeight={700}
                            fontSize={13}
                            sx={{
                                mb: 1,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                color: "#666666"
                            }}
                        >
                            Wallet
                        </Typography>
                        <TextField
                            select
                            fullWidth
                            size="medium"
                            value={selectedWallet}
                            onChange={(e) => setSelectedWallet(e.target.value)}
                            InputProps={{
                                sx: {
                                    borderRadius: 2,
                                    background: "#f5f5f5",
                                    border: "2px solid #000000",
                                    fontWeight: 600,
                                    "&:hover": {
                                        background: "#ffffff",
                                    },
                                    "&.Mui-focused": {
                                        background: "#ffffff",
                                    }
                                },
                            }}
                        >
                            {wallets.map((w) => (
                                <MenuItem key={w.address} value={w.address}>
                                    <Typography fontWeight={600}>
                                        {w.name} — {w.address.slice(0, 6)}...{w.address.slice(-4)}
                                    </Typography>
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography
                            fontWeight={700}
                            fontSize={13}
                            sx={{
                                mb: 1,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                color: "#666666"
                            }}
                        >
                            Chain
                        </Typography>
                        <TextField
                            select
                            fullWidth
                            size="medium"
                            value={selectedChain}
                            onChange={(e) => setSelectedChain(e.target.value)}
                            InputProps={{
                                sx: {
                                    borderRadius: 2,
                                    background: "#f5f5f5",
                                    border: "2px solid #000000",
                                    fontWeight: 600,
                                    "&:hover": {
                                        background: "#ffffff",
                                    },
                                    "&.Mui-focused": {
                                        background: "#ffffff",
                                    }
                                },
                            }}
                        >
                            {chains.map((c) => {
                                const Icon = c.icon;
                                return (
                                    <MenuItem key={c.id} value={c.id}>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <Box sx={{
                                                width: 24,
                                                height: 24,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                "& svg": {
                                                    width: "100%",
                                                    height: "100%",
                                                }
                                            }}>
                                                <Icon />
                                            </Box>
                                            <Typography fontWeight={600}>{c.label}</Typography>
                                        </Stack>
                                    </MenuItem>
                                );
                            })}
                        </TextField>
                    </Box>
                </Stack>

                {/* CHAIN INFO */}
                <Box
                    sx={{
                        p: 2,
                        borderRadius: 3,
                        background: "#f5f5f5",
                        border: "2px solid #000000",
                        textAlign: "center",
                    }}
                >
                    <Stack direction="row" justifyContent="center" alignItems="center" spacing={1.5}>
                        <Box sx={{
                            width: 28,
                            height: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            "& svg": {
                                width: "100%",
                                height: "100%",
                            }
                        }}>
                            <currentChain.icon />
                        </Box>
                        <Typography fontWeight={800} fontSize={16}>{currentChain?.label}</Typography>
                    </Stack>
                    <Typography variant="body2" color="#666666" fontWeight={600} sx={{ mt: 1, fontSize: 13 }}>
                        Usa esta dirección solo en redes compatibles.
                    </Typography>
                </Box>

                {/* QR CODE */}
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 3,
                            background: "#f5f5f5",
                            border: "2px solid #000000",
                            display: "inline-flex",
                        }}
                    >
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                background: "#fff",
                                display: "inline-flex",
                            }}
                        >
                            <QRCode value={qrValue} size={140} fgColor="#000000" />
                        </Box>
                    </Box>
                </Box>

                {/* ADDRESS */}
                <Box
                    sx={{
                        textAlign: "center",
                        px: 2,
                        py: 1.5,
                        borderRadius: 3,
                        background: "#f5f5f5",
                        border: "2px solid #000000",
                        wordBreak: "break-all",
                    }}
                >
                    <Typography
                        fontWeight={700}
                        fontSize={13}
                        sx={{
                            mb: 0.5,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "#666666"
                        }}
                    >
                        Tu dirección
                    </Typography>
                    <Typography
                        fontWeight={800}
                        color="#000000"
                        sx={{
                            fontSize: 14,
                            fontFamily: "monospace",
                        }}
                    >
                        {currentAddress || "0x..."}
                    </Typography>
                </Box>
            </Stack>
        </DialogContent>
    );
};
