import { useState, useEffect, useMemo } from "react";
import { Dialog, Box, Typography, IconButton, Button, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { Close, ContentCopy, Share } from "@mui/icons-material";
import QRCode from "react-qr-code";
import { toast } from "react-toastify";
import { WalletInfo } from "@/app/store/useWalletsStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptSeed } from "@/app/utils/cripto";
import { mnemonicToSeedSync } from "@scure/bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "stellar-sdk";

interface SimpleReceiveModalProps {
    open: boolean;
    onClose: () => void;
    wallet: WalletInfo;
}

export function SimpleReceiveModal({ open, onClose, wallet }: SimpleReceiveModalProps) {
    const [network, setNetwork] = useState<"EVM" | "Stellar">("EVM");
    const [stellarAddress, setStellarAddress] = useState<string | null>(null);
    const { currentPassword } = useWalletPasswordStore();

    // Derive Stellar Address on mount/open
    useEffect(() => {
        if (!wallet || !currentPassword) return;

        try {
            const mnemonic = decryptSeed(wallet.encryptedSeed, currentPassword);
            if (mnemonic) {
                const seed = mnemonicToSeedSync(mnemonic);
                const { key } = derivePath("m/44'/148'/0'", Buffer.from(seed).toString('hex'));
                const keypair = Keypair.fromRawEd25519Seed(key);
                setStellarAddress(keypair.publicKey());
            }
        } catch (e) {
            console.error("Error deriving Stellar address", e);
        }
    }, [wallet, currentPassword]);

    const currentAddress = network === "EVM" ? wallet.address : stellarAddress;

    const handleCopy = () => {
        if (currentAddress) {
            navigator.clipboard.writeText(currentAddress);
            toast.success("Copied to clipboard!");
        }
    };

    const handleShare = () => {
        if (navigator.share && currentAddress) {
            navigator.share({
                title: 'My Wallet Address',
                text: currentAddress,
            }).catch(console.error);
        } else {
            handleCopy();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "24px",
                    overflow: "hidden",
                    border: "3px solid #000000",
                    boxShadow: "8px 8px 0px #000000",
                    background: "#f0fdf4", // green-50
                    maxWidth: "400px" // Smaller width as requested
                },
            }}
        >
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" p={3} pb={1}>
                <Typography variant="h5" fontWeight={900}>
                    Receive
                </Typography>
                <IconButton
                    onClick={onClose}
                    sx={{
                        backgroundColor: "white",
                        border: "3px solid #000000",
                        borderRadius: 2,
                        p: 0.5,
                        "&:hover": {
                            backgroundColor: "#fef2f2",
                            borderColor: "#ef4444",
                        },
                    }}
                >
                    <Close sx={{ fontSize: 24, color: "black", strokeWidth: 3 }} />
                </IconButton>
            </Box>

            {/* Content */}
            <Box p={3} display="flex" flexDirection="column" alignItems="center" gap={3}>

                {/* Network Toggle */}
                <ToggleButtonGroup
                    value={network}
                    exclusive
                    onChange={(e, val) => val && setNetwork(val)}
                    aria-label="network alignment"
                    sx={{
                        backgroundColor: "white",
                        border: "3px solid #000000",
                        borderRadius: "12px",
                        boxShadow: "4px 4px 0px #000000",
                        "& .MuiToggleButton-root": {
                            border: "none",
                            borderRadius: "8px",
                            mx: 0.5,
                            my: 0.5,
                            fontWeight: 900,
                            color: "text.secondary",
                            textTransform: "none",
                            px: 3,
                            "&.Mui-selected": {
                                backgroundColor: "#000000",
                                color: "white",
                                "&:hover": {
                                    backgroundColor: "#333",
                                }
                            }
                        }
                    }}
                >
                    <ToggleButton value="EVM">EVM</ToggleButton>
                    <ToggleButton value="Stellar">Stellar</ToggleButton>
                </ToggleButtonGroup>

                {/* QR Code Container */}
                <Box
                    sx={{
                        p: 2,
                        backgroundColor: "white",
                        border: "3px solid #000000",
                        borderRadius: "16px",
                        boxShadow: "4px 4px 0px rgba(0,0,0,0.1)",
                    }}
                >
                    {currentAddress ? (
                        <QRCode
                            value={currentAddress}
                            size={200}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                    ) : (
                        <Box width={200} height={200} display="flex" alignItems="center" justifyContent="center">
                            Loading...
                        </Box>
                    )}
                </Box>

                {/* Address Box */}
                <Box
                    onClick={handleCopy}
                    sx={{
                        width: "100%",
                        backgroundColor: "white",
                        border: "3px solid #000000",
                        borderRadius: "12px",
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        "&:hover": {
                            backgroundColor: "#f9fafb"
                        }
                    }}
                >
                    <Typography
                        fontFamily="monospace"
                        fontWeight="bold"
                        fontSize={14}
                        sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            mr: 1
                        }}
                    >
                        {currentAddress}
                    </Typography>
                    <ContentCopy sx={{ fontSize: 20, color: "text.secondary" }} />
                </Box>

                {/* Share Button */}
                <Button
                    fullWidth
                    onClick={handleShare}
                    startIcon={<Share />}
                    sx={{
                        backgroundColor: "#0052FF", // Brand Blue
                        color: "white",
                        border: "3px solid #000000",
                        borderRadius: "12px",
                        fontWeight: 900,
                        py: 1.5,
                        textTransform: "uppercase",
                        boxShadow: "4px 4px 0px #000000",
                        "&:hover": {
                            backgroundColor: "#0040cc",
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000"
                        },
                        "&:active": {
                            transform: "translate(4px, 4px)",
                            boxShadow: "none"
                        }
                    }}
                >
                    Share Address
                </Button>

            </Box>
        </Dialog>
    );
}
