"use client";
import { useState, useEffect } from "react";
import { Box, Button, Typography, MenuItem, Select, CircularProgress, Stack, Chip, ToggleButtonGroup, ToggleButton, IconButton, Tooltip } from "@mui/material";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { toast } from "react-toastify";
import { useSmartAccount } from "../hooks/useSmartAccount";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LogoutIcon from '@mui/icons-material/Logout';

export const SmartAccountManager = () => {
    const [selectedChain, setSelectedChain] = useState<ChainKey | "">("");
    const [statusMessage, setStatusMessage] = useState("");
    const [connectionMode, setConnectionMode] = useState<"metamask" | "seed">("metamask");
    const [connectedOwner, setConnectedOwner] = useState<string | null>(null);
    const {
        mainWallet,
        setMainWallet,
        metaMaskConnection,
        setMetaMaskConnection,
        disconnectMetaMask,
        getActiveAddress
    } = useXOWalletStore();

    const {
        account: accountInstance,
        smartAccountAddress,
        isDeployed,
        isConnecting,
        isDeploying,
        error,
        connect,
        ensureDeployed,
        disconnect
    } = useSmartAccount();

    // Get owner address - prioritize MetaMask if connected
    const ownerAddress = metaMaskConnection.isConnected
        ? metaMaskConnection.address
        : (connectedOwner || mainWallet.address);

    // Update status message based on state
    useEffect(() => {
        if (error) {
            setStatusMessage(`Error: ${error}`);
        } else if (isConnecting) {
            setStatusMessage("Connecting...");
        } else if (isDeploying) {
            setStatusMessage("Deploying Account...");
        } else if (smartAccountAddress) {
            setStatusMessage(isDeployed ? "Account Deployed" : "Account Not Deployed");
        }
    }, [error, isConnecting, isDeploying, smartAccountAddress, isDeployed]);

    const handleConnectWithSeed = async () => {
        if (!selectedChain) return;
        setStatusMessage("Connecting with Private Key...");

        const config = NETWORKS[selectedChain];
        if (!config || !config.evm) {
            toast.error("Invalid chain config (No EVM)");
            return;
        }

        const result = await connect(selectedChain, false);
        if (result) {
            setConnectedOwner(result.getOwner());
        } else {
            setStatusMessage("Connection failed");
        }
    };

    const handleConnectWithMetaMask = async () => {
        if (!selectedChain) return;
        setStatusMessage("Connecting with MetaMask...");

        const config = NETWORKS[selectedChain];
        if (!config || !config.evm) {
            toast.error("Invalid chain config (No EVM)");
            return;
        }

        // Check if MetaMask is available
        if (typeof window === "undefined" || !window.ethereum) {
            toast.error("MetaMask not detected. Please install MetaMask.");
            setStatusMessage("MetaMask not found");
            return;
        }

        const result = await connect(selectedChain, true);
        if (result) {
            const owner = result.getOwner();
            setConnectedOwner(owner);

            // Store MetaMask connection
            if (owner) {
                setMetaMaskConnection(owner, config.evm.chain.id.toString());
                toast.success("MetaMask connected!");
            }
        } else {
            setStatusMessage("MetaMask connection failed");
        }
    };

    const handleSwitchAccount = async () => {
        if (typeof window === "undefined" || !window.ethereum) {
            toast.error("MetaMask not detected");
            return;
        }

        try {
            // Request account switch via MetaMask
            await window.ethereum.request({
                method: "wallet_requestPermissions",
                params: [{ eth_accounts: {} }]
            });

            // Get new accounts
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts"
            }) as string[];

            if (accounts && accounts.length > 0) {
                const newAddress = accounts[0];
                setConnectedOwner(newAddress);

                if (selectedChain) {
                    const config = NETWORKS[selectedChain];
                    if (config?.evm) {
                        setMetaMaskConnection(newAddress, config.evm.chain.id.toString());
                    }
                }

                // Reconnect with new account
                if (selectedChain) {
                    disconnect();
                    setStatusMessage("Reconnecting with new account...");
                    await handleConnectWithMetaMask();
                }

                toast.success(`Switched to ${newAddress.slice(0, 6)}...${newAddress.slice(-4)}`);
            }
        } catch (err: any) {
            console.error("Switch account error:", err);
            toast.error("Failed to switch account");
        }
    };

    const handleDisconnectMetaMask = () => {
        disconnectMetaMask();
        disconnect();
        setConnectedOwner(null);
        setStatusMessage("");
        toast.info("MetaMask disconnected");
    };

    const handleConnect = async () => {
        if (connectionMode === "metamask") {
            await handleConnectWithMetaMask();
        } else {
            await handleConnectWithSeed();
        }
    };

    const handleDeploy = async () => {
        if (!accountInstance) return;
        setStatusMessage("Deploying Account...");

        const success = await ensureDeployed();
        if (success) {
            setStatusMessage("Account Deployed!");
        } else {
            setStatusMessage("Deployment Failed");
        }
    };

    const handleChainChange = (chainKey: ChainKey) => {
        setSelectedChain(chainKey);
        disconnect();
        setConnectedOwner(null);
        setStatusMessage("");
    };

    const loading = isConnecting || isDeploying;

    // Check if can connect with seed
    const canConnectWithSeed = mainWallet.encryptedPrivateKey;

    // Filter chains that support ERC-4337
    const erc4337Chains = Object.keys(NETWORKS).filter(k => {
        const config = NETWORKS[k as ChainKey];
        return config.evm?.erc4337 === true;
    });

    const isMetaMaskMode = connectionMode === "metamask";
    const isConnectedWithMetaMask = metaMaskConnection.isConnected && smartAccountAddress;

    return (
        <Box sx={{ p: 3, border: "2px solid black", borderRadius: 4, my: 4, bgcolor: "white", boxShadow: "4px 4px 0px black" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={800} textTransform="uppercase">Smart Account Manager (AA)</Typography>
                {isConnectedWithMetaMask && (
                    <Chip
                        icon={<AccountBalanceWalletIcon />}
                        label="MetaMask Connected"
                        color="warning"
                        size="small"
                        sx={{ fontWeight: 700 }}
                    />
                )}
            </Stack>

            {/* Connection Mode Toggle */}
            <Stack spacing={2} mb={2}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Connection Method:</Typography>
                <ToggleButtonGroup
                    value={connectionMode}
                    exclusive
                    onChange={(_, newMode) => newMode && setConnectionMode(newMode)}
                    size="small"
                    sx={{ mb: 1 }}
                >
                    <ToggleButton value="metamask" sx={{ textTransform: "none", fontWeight: 700 }}>
                        <AccountBalanceWalletIcon sx={{ mr: 1 }} /> MetaMask
                    </ToggleButton>
                    <ToggleButton value="seed" disabled={!canConnectWithSeed} sx={{ textTransform: "none", fontWeight: 700 }}>
                        <VpnKeyIcon sx={{ mr: 1 }} /> Seed/PK
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2} alignItems="center">
                <Select
                    value={selectedChain}
                    onChange={(e) => handleChainChange(e.target.value as ChainKey)}
                    displayEmpty
                    size="small"
                    sx={{ minWidth: 200, bgcolor: "white", borderRadius: 2 }}
                >
                    <MenuItem value="" disabled>Select Network (AA Enabled)</MenuItem>
                    {erc4337Chains.map(key => (
                        <MenuItem key={key} value={key}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                {NETWORKS[key as ChainKey].icon}
                                <Typography fontWeight={600}>{NETWORKS[key as ChainKey].label}</Typography>
                            </Stack>
                        </MenuItem>
                    ))}
                </Select>

                <Button
                    variant="contained"
                    onClick={handleConnect}
                    disabled={!selectedChain || loading || (connectionMode === "seed" && !canConnectWithSeed)}
                    size="large"
                    sx={{
                        fontWeight: 800,
                        border: "2px solid black",
                        boxShadow: "2px 2px 0px black",
                        textTransform: "none",
                        bgcolor: isMetaMaskMode ? "#F6851B" : "#00DC8C",
                        color: isMetaMaskMode ? "white" : "black",
                        "&:hover": { bgcolor: isMetaMaskMode ? "#E2761B" : "#00C47C" }
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> :
                        isMetaMaskMode ? "Connect MetaMask" : "Connect with Seed"}
                </Button>

                {/* MetaMask Action Buttons */}
                {isConnectedWithMetaMask && (
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Switch Account">
                            <IconButton
                                onClick={handleSwitchAccount}
                                sx={{
                                    border: "2px solid black",
                                    borderRadius: 2,
                                    bgcolor: "#FFE4B5",
                                    "&:hover": { bgcolor: "#FFD89B" }
                                }}
                            >
                                <SwapHorizIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Disconnect MetaMask">
                            <IconButton
                                onClick={handleDisconnectMetaMask}
                                sx={{
                                    border: "2px solid black",
                                    borderRadius: 2,
                                    bgcolor: "#FFB4B4",
                                    "&:hover": { bgcolor: "#FF9B9B" }
                                }}
                            >
                                <LogoutIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                )}
            </Stack>

            {connectionMode === "seed" && !canConnectWithSeed && (
                <Typography color="error" mb={2} fontSize={14}>
                    No seed wallet configured. Use MetaMask or set up a wallet with seed phrase.
                </Typography>
            )}

            {erc4337Chains.length === 0 && (
                <Typography color="warning.main" mb={2} fontSize={14}>
                    No chains with ERC-4337 support configured.
                </Typography>
            )}

            {statusMessage && <Typography mb={2} fontWeight={700} color="text.secondary" sx={{ bgcolor: "#eee", p: 1, borderRadius: 1 }}>STATUS: {statusMessage}</Typography>}

            {smartAccountAddress && (
                <Stack spacing={2} sx={{ bgcolor: "#f4f4f5", p: { xs: 2, sm: 3 }, borderRadius: 3, border: "2px solid #000" }}>
                    <Stack spacing={0.5}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">OWNER (EOA)</Typography>
                        <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: "break-all", bgcolor: "white", p: 1, borderRadius: 1, border: "1px solid #ddd" }}>{ownerAddress}</Typography>
                    </Stack>

                    <Stack spacing={0.5}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">SMART ACCOUNT (ADDRESS)</Typography>
                        <Typography variant="body1" fontFamily="monospace" fontWeight={700} sx={{ wordBreak: "break-all", bgcolor: "white", p: 1, borderRadius: 1, border: "1px solid #ddd" }}>{smartAccountAddress}</Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">DEPLOYMENT STATE:</Typography>
                        <Chip
                            label={isDeployed ? "DEPLOYED" : "NOT DEPLOYED"}
                            color={isDeployed ? "success" : "warning"}
                            sx={{ fontWeight: 800, border: "1px solid black", color: "black", bgcolor: isDeployed ? "#4ade80" : "#facc15" }}
                        />
                    </Stack>

                    {!isDeployed && (
                        <Box pt={1}>
                            <Button
                                variant="contained"
                                onClick={handleDeploy}
                                disabled={loading}
                                fullWidth
                                sx={{
                                    py: 1.5,
                                    fontWeight: 800,
                                    border: "2px solid black",
                                    boxShadow: "4px 4px 0px black",
                                    textTransform: "none",
                                    bgcolor: "white",
                                    color: "black",
                                    "&:hover": { bgcolor: "#f5f5f5" },
                                    "&:active": { boxShadow: "0px 0px 0px black", transform: "translate(4px, 4px)" }
                                }}
                            >
                                Deploy Smart Account (Create)
                            </Button>
                            <Typography variant="caption" color="text.secondary" mt={1} display="block">
                                * Requires Generic Wallet funds to pay for gas or Paymaster support.
                            </Typography>
                        </Box>
                    )}
                </Stack>
            )}
        </Box>
    );
};
