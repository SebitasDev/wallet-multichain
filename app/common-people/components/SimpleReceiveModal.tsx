import { useState, useEffect, useMemo } from "react";
import { Dialog, Box, Typography, IconButton, Button, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { Close, ContentCopy, Share } from "@mui/icons-material";
import QRCode from "react-qr-code";
import { toast } from "react-toastify";
import { WalletInfo } from "@/app/store/useWalletsStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { decryptSeed, decryptPrivateKey } from "@/app/utils/cripto";
import { mnemonicToSeedSync } from "@scure/bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "stellar-sdk";

interface SimpleReceiveModalProps {
    open: boolean;
    onClose: () => void;
    wallet?: WalletInfo; // optional
}

export function SimpleReceiveModal({ open, onClose, wallet }: SimpleReceiveModalProps) {
    const [network, setNetwork] = useState<"EVM" | "Stellar">("EVM");
    const [stellarAddress, setStellarAddress] = useState<string | null>(null);
    const { currentPassword } = useWalletPasswordStore();
    const xoMainWallet = useXOWalletStore(s => s.mainWallet);

    // Determine effective address source
    const effectiveEvmAddress = wallet?.address || xoMainWallet.address;
    const effectiveEncryptedSeed = wallet?.encryptedSeed || xoMainWallet.encryptedMnemonic;

    // Derive Stellar Address on mount/open
    useEffect(() => {
        const derive = async () => {
            if (!currentPassword) return;

            // Prefer explicitly stored stellar address if available (fastest)
            if (!wallet && xoMainWallet.addressStellar) {
                setStellarAddress(xoMainWallet.addressStellar);
            }

            try {
                let mnemonic: string | null = null;

                if (wallet) {
                    mnemonic = decryptSeed(wallet.encryptedSeed, currentPassword);
                } else if (xoMainWallet.encryptedMnemonic && xoMainWallet.salt && xoMainWallet.iv) {
                    mnemonic = await decryptPrivateKey(
                        xoMainWallet.encryptedMnemonic,
                        currentPassword,
                        xoMainWallet.salt,
                        xoMainWallet.iv
                    );
                }

                if (mnemonic) {
                    const seed = mnemonicToSeedSync(mnemonic);
                    const { key } = derivePath("m/44'/148'/0'", Buffer.from(seed).toString('hex'));
                    const keypair = Keypair.fromRawEd25519Seed(key);
                    setStellarAddress(keypair.publicKey());
                }
            } catch (e) {
                console.error("Error deriving Stellar address", e);
            }
        };

        derive();
    }, [wallet, currentPassword, xoMainWallet]);

    const currentAddress = network === "EVM" ? effectiveEvmAddress : stellarAddress;

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
                    maxWidth: "500px" // Wider as requested
                },
            }}
        >
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" p={2} pb={0}>
                <Typography variant="h5" fontWeight={900}>
                    Receive
                </Typography>
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
                    <Close sx={{ fontSize: 24, color: "black" }} />
                </IconButton>
            </Box>

            {/* Content */}
            <Box px={3} pb={3} pt={1} display="flex" flexDirection="column" alignItems="center" gap={4}>

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
                        py: 1,
                        px: 2,
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
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            mr: 1,
                            lineHeight: 1.6,
                            fontSize: 12,
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
