"use client";

import { useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Tabs,
    Tab,
    CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import {
    SavingsChainKey,
    SavingsChainKeys,
    getSavingsChainConfig,
    parseUsdcAmount,
    formatUsdcDisplay,
} from "@/app/savings/config";
import { useSavingsStore, fetchSavingsPositions } from "@/app/store/useSavingsStore";
import { NETWORKS, ChainKey } from "@/app/constants/chainsInformation";
import { WalletInfo, useWalletStore } from "@/app/store/useWalletsStore";

interface DepositSectionProps {
    walletAddress: string;
    wallet: WalletInfo | null;
    password: string;
    onOpenConfirmModal: (
        type: "deposit" | "withdraw",
        chain: SavingsChainKey,
        amount: string,
        callback: () => Promise<void>
    ) => void;
}

export function DepositSection({ walletAddress, wallet, password, onOpenConfirmModal }: DepositSectionProps) {
    const [selectedChain, setSelectedChain] = useState<SavingsChainKey>("Base");
    const [amount, setAmount] = useState("");
    const [isDepositing, setIsDepositing] = useState(false);
    const [needsApproval, setNeedsApproval] = useState(false);

    const { addDepositEntry } = useSavingsStore();
    const { unlockWallet } = useWalletStore();

    // Get USDC balance from wallet for selected chain
    const getUsdcBalance = (): string => {
        if (!wallet) return "0.00";

        const chainConfig = NETWORKS[selectedChain as ChainKey];
        if (!chainConfig) return "0.00";

        const chainId = chainConfig.chain.id.toString();
        const chainInfo = wallet.chains.find(c => c.chainId === chainId);

        if (!chainInfo) return "0.00";

        // Balance is already in human-readable format (USDC with 6 decimals already converted)
        return chainInfo.amount.toFixed(2);
    };

    const usdcBalance = getUsdcBalance();

    const handleChainChange = (_: React.SyntheticEvent, newValue: number) => {
        setSelectedChain(SavingsChainKeys[newValue]);
        setAmount("");
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Only allow valid decimal numbers
        if (/^\d*\.?\d{0,6}$/.test(value) || value === "") {
            setAmount(value);
        }
    };

    const handleMaxClick = () => {
        if (usdcBalance !== "--") {
            setAmount(usdcBalance);
        }
    };

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (!walletAddress) {
            toast.error("No wallet connected");
            return;
        }

        if (!password) {
            toast.error("Password required to sign transaction");
            return;
        }

        onOpenConfirmModal("deposit", selectedChain, amount, async () => {
            setIsDepositing(true);

            try {
                const amountBigInt = parseUsdcAmount(amount);

                // Unlock wallet to get private key
                const privateKey = await unlockWallet(walletAddress, password);

                const response = await fetch("/api/savings/deposit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chain: selectedChain,
                        amount: amountBigInt.toString(),
                        walletAddress,
                        privateKey,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    toast.success(`Deposited ${formatUsdcDisplay(amountBigInt)} to ${selectedChain}`);

                    // Add to deposit history
                    addDepositEntry({
                        chain: selectedChain,
                        amount: amountBigInt.toString(),
                        txHash: data.transactionHash,
                        type: "deposit",
                    });

                    // Refresh positions
                    await fetchSavingsPositions(walletAddress);

                    // Clear form
                    setAmount("");
                    setNeedsApproval(false);
                } else {
                    toast.error(data.errorReason || "Deposit failed");
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Deposit failed");
            } finally {
                setIsDepositing(false);
            }
        });
    };

    const getChainIcon = (chain: SavingsChainKey) => {
        return NETWORKS[chain].icon;
    };

    return (
        <Box
            sx={{
                background: "#ffffff",
                border: "3px solid #000000",
                borderRadius: 4,
                boxShadow: "6px 6px 0px #000000",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    background: "#000000",
                    color: "#ffffff",
                    px: 3,
                    py: 2,
                }}
            >
                <Typography
                    sx={{
                        fontSize: 18,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                    }}
                >
                    Deposit USDC
                </Typography>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3 }}>
                {/* Chain Tabs */}
                <Tabs
                    value={SavingsChainKeys.indexOf(selectedChain)}
                    onChange={handleChainChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        mb: 3,
                        "& .MuiTabs-indicator": {
                            display: "none",
                        },
                    }}
                >
                    {SavingsChainKeys.map((chain) => (
                        <Tab
                            key={chain}
                            label={chain}
                            sx={{
                                border: "2px solid #000000",
                                borderRadius: 2,
                                mx: 0.5,
                                minWidth: 80,
                                fontWeight: 800,
                                fontSize: 12,
                                textTransform: "uppercase",
                                color: "#000000",
                                "&.Mui-selected": {
                                    background: getSavingsChainConfig(chain).chipColor,
                                    color: "#ffffff",
                                    border: "2px solid #000000",
                                },
                                "&:hover": {
                                    background: "#f5f5f5",
                                },
                            }}
                        />
                    ))}
                </Tabs>

                {/* Balance Display */}
                <Box
                    sx={{
                        background: "#f5f5f5",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        p: 2,
                        mb: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#666666" }}>
                        Available Balance:
                    </Typography>
                </Box>

                {/* APY Display */}
                <Box
                    sx={{
                        background: "#00DC8C",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        p: 2,
                        mb: 3,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#000000" }}>
                        Current APY:
                    </Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 900, color: "#000000" }}>
                        ~4.50%
                    </Typography>
                </Box>

                {/* Amount Input */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Amount in USDC"
                        type="text"
                        InputProps={{
                            sx: {
                                borderRadius: 2,
                                background: "#ffffff",
                                border: "2px solid #000000",
                                fontWeight: 700,
                                fontSize: 16,
                                "& fieldset": { border: "none" },
                            },
                            endAdornment: (
                                <Button
                                    onClick={handleMaxClick}
                                    sx={{
                                        minWidth: "auto",
                                        px: 2,
                                        py: 0.5,
                                        background: "#000000",
                                        color: "#ffffff",
                                        fontWeight: 800,
                                        fontSize: 11,
                                        borderRadius: 1,
                                        "&:hover": {
                                            background: "#333333",
                                        },
                                    }}
                                >
                                    MAX
                                </Button>
                            ),
                        }}
                    />
                </Box>

                {/* Deposit Button */}
                <Button
                    fullWidth
                    onClick={handleDeposit}
                    disabled={isDepositing || !amount || parseFloat(amount) <= 0}
                    sx={{
                        background: "#7852FF",
                        color: "#ffffff",
                        border: "3px solid #000000",
                        borderRadius: 2,
                        boxShadow: "4px 4px 0px #000000",
                        py: 1.5,
                        fontWeight: 900,
                        fontSize: 16,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        "&:hover": {
                            background: "#6642EE",
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000",
                        },
                        "&:disabled": {
                            background: "#cccccc",
                            color: "#666666",
                            border: "3px solid #999999",
                            boxShadow: "none",
                        },
                    }}
                >
                    {isDepositing ? (
                        <CircularProgress size={24} sx={{ color: "#ffffff" }} />
                    ) : needsApproval ? (
                        "Approve USDC First"
                    ) : (
                        "Deposit"
                    )}
                </Button>

                {/* Info Text */}
                <Typography
                    sx={{
                        fontSize: 11,
                        color: "#666666",
                        textAlign: "center",
                        mt: 2,
                    }}
                >
                    Powered by Spark.fi Savings Vaults
                </Typography>
            </Box>
        </Box>
    );
}
