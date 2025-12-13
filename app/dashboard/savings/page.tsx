"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { TopBar } from "@/app/dashboard/components/TopBar";
import { ToastContainerCustom } from "@/app/components/atoms/ToastContainerCustom";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { useWalletStore, WalletInfo } from "@/app/store/useWalletsStore";
import { PasswordModal } from "@/app/dashboard/components/PasswordModal";
import { SavingsSummaryCard } from "./components/SavingsSummaryCard";
import { DepositSection } from "./components/DepositSection";
import { PositionsTable } from "./components/PositionsTable";
import { DistributionChart } from "./components/DistributionChart";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { useSavingsStore, fetchSavingsPositions } from "@/app/store/useSavingsStore";
import { SavingsChainKey } from "@/app/savings/config";

export default function SavingsPage() {
    const [mounted, setMounted] = useState(false);
    const [askPassword, setAskPassword] = useState(true);
    const [mode, setMode] = useState<"create" | "unlock">("unlock");
    const [selectedWalletAddress, setSelectedWalletAddress] = useState<string>("");

    // Confirmation modal state
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalType, setConfirmModalType] = useState<"deposit" | "withdraw">("deposit");
    const [confirmModalChain, setConfirmModalChain] = useState<SavingsChainKey>("Base");
    const [confirmModalAmount, setConfirmModalAmount] = useState("");
    const [confirmModalCallback, setConfirmModalCallback] = useState<(() => Promise<void>) | null>(null);
    const [confirmModalLoading, setConfirmModalLoading] = useState(false);

    const encrypted = useWalletPasswordStore((s) => s.encryptedPassword);
    const currentPassword = useWalletPasswordStore((s) => s.currentPassword);
    const { wallets, unlockWallet } = useWalletStore();
    const { positions, loading } = useSavingsStore();

    // Get selected wallet
    const selectedWallet = wallets.find(w => w.address === selectedWalletAddress) || (wallets.length > 0 ? wallets[0] : null);

    useEffect(() => {
        setMounted(true);
        if (!encrypted) {
            setMode("create");
            setAskPassword(true);
        } else {
            setMode("unlock");
            setAskPassword(true);
        }
    }, [encrypted]);

    // Set initial selected wallet
    useEffect(() => {
        if (!askPassword && wallets.length > 0 && !selectedWalletAddress) {
            setSelectedWalletAddress(wallets[0].address);
        }
    }, [askPassword, wallets, selectedWalletAddress]);

    // Fetch positions when wallet is available
    useEffect(() => {
        if (!askPassword && selectedWallet) {
            fetchSavingsPositions(selectedWallet.address);

            // Poll every 10 seconds
            const interval = setInterval(() => {
                fetchSavingsPositions(selectedWallet.address);
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [askPassword, selectedWallet]);

    const handleOpenConfirmModal = (
        type: "deposit" | "withdraw",
        chain: SavingsChainKey,
        amount: string,
        callback: () => Promise<void>
    ) => {
        setConfirmModalType(type);
        setConfirmModalChain(chain);
        setConfirmModalAmount(amount);
        setConfirmModalCallback(() => callback);
        setConfirmModalOpen(true);
    };

    const handleConfirmModalClose = () => {
        setConfirmModalOpen(false);
        setConfirmModalLoading(false);
    };

    const handleConfirmModalConfirm = async () => {
        if (confirmModalCallback) {
            setConfirmModalLoading(true);
            try {
                await confirmModalCallback();
            } finally {
                setConfirmModalLoading(false);
                setConfirmModalOpen(false);
            }
        }
    };

    if (!mounted) return null;

    return (
        <Box sx={{ minHeight: "100vh", pb: 4 }}>
            {/* Password Modal */}
            <PasswordModal
                open={askPassword}
                mode={mode}
                onSuccess={() => setAskPassword(false)}
            />

            {!askPassword && (
                <>
                    <TopBar />

                    <Box
                        sx={{
                            maxWidth: 1200,
                            mx: "auto",
                            px: { xs: 2, md: 3 },
                            mt: 2,
                        }}
                    >
                        {/* Page Header */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                mb: 3,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: { xs: 24, md: 32 },
                                    fontWeight: 900,
                                    textTransform: "uppercase",
                                    letterSpacing: 2,
                                    color: "#000000",
                                    mb: 1,
                                }}
                            >
                                USDC Savings
                            </Typography>
                            <Box
                                sx={{
                                    width: "100%",
                                    maxWidth: 300,
                                    height: 4,
                                    background: "#000000",
                                    borderRadius: 1,
                                    boxShadow: "2px 2px 0px #00DC8C",
                                }}
                            />
                            <Typography
                                sx={{
                                    fontSize: 14,
                                    color: "#666666",
                                    mt: 1,
                                    textAlign: "center",
                                }}
                            >
                                Earn yield on your USDC with Spark.fi Savings Vaults
                            </Typography>
                        </Box>

                        {/* Wallet Selector */}
                        {wallets.length > 0 && (
                            <Box
                                sx={{
                                    background: "#ffffff",
                                    border: "3px solid #000000",
                                    borderRadius: 4,
                                    boxShadow: "6px 6px 0px #000000",
                                    p: 2,
                                    mb: 3,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: 14,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Wallet Activa:
                                </Typography>
                                <FormControl size="small" sx={{ minWidth: 300 }}>
                                    <Select
                                        value={selectedWalletAddress || (wallets[0]?.address || "")}
                                        onChange={(e) => setSelectedWalletAddress(e.target.value)}
                                        sx={{
                                            fontWeight: 700,
                                            border: "2px solid #000000",
                                            borderRadius: 2,
                                            "& .MuiOutlinedInput-notchedOutline": {
                                                border: "none",
                                            },
                                        }}
                                    >
                                        {wallets.map((wallet) => (
                                            <MenuItem key={wallet.address} value={wallet.address}>
                                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                                                        {wallet.name}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 11, color: "#666666" }}>
                                                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {selectedWallet && (
                                    <Box
                                        sx={{
                                            background: "#00DC8C",
                                            border: "2px solid #000000",
                                            borderRadius: 2,
                                            px: 2,
                                            py: 0.5,
                                        }}
                                    >
                                        <Typography sx={{ fontWeight: 800, fontSize: 12 }}>
                                            Balance Total: ${selectedWallet.chains.reduce((acc, c) => acc + c.amount, 0).toFixed(2)} USDC
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Summary Card */}
                        <SavingsSummaryCard />

                        {/* Main Content: Deposit + Positions */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: { xs: "column", md: "row" },
                                gap: 3,
                                mt: 3,
                            }}
                        >
                            {/* Deposit Section */}
                            <Box sx={{ flex: { xs: "1", md: "0 0 400px" } }}>
                                <DepositSection
                                    walletAddress={selectedWallet?.address || ""}
                                    wallet={selectedWallet}
                                    password={currentPassword || ""}
                                    onOpenConfirmModal={handleOpenConfirmModal}
                                />
                            </Box>

                            {/* Positions Table */}
                            <Box sx={{ flex: 1 }}>
                                <PositionsTable
                                    onOpenConfirmModal={handleOpenConfirmModal}
                                />
                            </Box>
                        </Box>

                        {/* Distribution Chart */}
                        {positions.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <DistributionChart />
                            </Box>
                        )}
                    </Box>

                    {/* Confirmation Modal */}
                    <ConfirmationModal
                        open={confirmModalOpen}
                        type={confirmModalType}
                        chain={confirmModalChain}
                        amount={confirmModalAmount}
                        isLoading={confirmModalLoading}
                        onClose={handleConfirmModalClose}
                        onConfirm={handleConfirmModalConfirm}
                    />

                    <ToastContainerCustom />
                </>
            )}
        </Box>
    );
}
