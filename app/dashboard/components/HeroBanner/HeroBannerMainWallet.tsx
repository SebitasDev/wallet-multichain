import {
    Box,
    Typography,
    IconButton,
    Button,
    Menu,
    MenuItem,
    CircularProgress,
    Tooltip,
    Divider,
    ListItemIcon,
    ListItemText
} from "@mui/material";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { SplitBalance } from "./SplitBalance";
import { EthIcon } from "@/app/components/atoms/EthIcon";
import { StellarIcon } from "@/app/components/atoms/StellarIcon";
import { ActiveWallet } from "@/app/dashboard/hooks/dashboard/useHeroBanner";
import { Dispatch, SetStateAction, useState, MouseEvent, useEffect, useRef } from "react";
import { LoadWalletModal } from "../LoadWalletModal";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useXOContracts } from "../../hooks/wallet/useXOConnect";
import { PasswordModal } from "../../components/PasswordModal";
import { ExportWalletModal } from "../../components/ExportWalletModal";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { toast } from "react-toastify";
import CloseIcon from '@mui/icons-material/Close';
import { useSmartAccount } from "../../hooks/useSmartAccount";
import { ChainKey } from "@/app/types/chain";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { getBalanceFromChain } from "@/app/hooks/useGetBalanceFromChain";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { FloatingChainInfo } from "../FloatingChainInfo";
import { useConnect, useAccount, useDisconnect } from "wagmi";

interface HeroBannerMainWalletProps {
    activeWallet: ActiveWallet;
    setActiveWallet: Dispatch<SetStateAction<ActiveWallet>>;
    burnedBalances: Record<ActiveWallet, number>;
    burnedAddresses: Record<ActiveWallet, string>;
    xoClientAlias?: string;
    isRefreshing: boolean;
    onRefresh: () => void;
}

export const HeroBannerMainWallet = ({
    activeWallet,
    setActiveWallet,
    burnedBalances,
    burnedAddresses,
    xoClientAlias,
    isRefreshing,
    onRefresh
}: HeroBannerMainWalletProps) => {
    const [loadWalletOpen, setLoadWalletOpen] = useState(false);
    const [walletAnchorEl, setWalletAnchorEl] = useState<null | HTMLElement>(null);

    // EXPORT WALLET STATES
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportData, setExportData] = useState("");
    const [exportType, setExportType] = useState<"mnemonic" | "privateKey">("mnemonic");
    const [authAction, setAuthAction] = useState<"export" | "reset" | null>(null);

    // SMART ACCOUNT HOOK
    const [chainAnchorEl, setChainAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedChain, setSelectedChain] = useState<ChainKey>("Base");
    const [eoaBalance, setEoaBalance] = useState<number>(0);

    // State for local refresh spinner
    const [isRefreshingLocal, setIsRefreshingLocal] = useState(false);

    // Wagmi Hooks
    const { connectors, connect: connectWagmi } = useConnect();
    const { disconnect: disconnectWagmi } = useDisconnect();
    const { isConnected: isWagmiConnected } = useAccount();


    // Get Smart Account Hook
    const {
        account,
        connectionType, // Explicit connection mode
        ensureDeployed,
        ensureApproval,
        isDeployed,
        smartAccountAddress,
        ownerAddress,
        connect,
        getBalance,
        disconnect,
        chainId,
        isConnecting
    } = useSmartAccount();

    const currentChainId = chainId;

    const { resetWallet, isUsingXO } = useXOContracts();

    const canRefresh = isUsingXO || !!burnedAddresses[activeWallet];

    // Store selectors for auto-connect
    const {
        mainWallet,
        // activeWallet, // Already destructured from props
        // setActiveWallet, // Already destructured from props
        metaMaskConnection,
        getActiveAddress
    } = useXOWalletStore();

    // Access smartAccounts from mainWallet
    const smartAccounts = mainWallet.smartAccounts;

    const {
        currentPassword
    } = useWalletPasswordStore();

    // Prevent auto-connect loop after manual disconnect
    const hasManuallyDisconnected = useRef(false);

    // Get cached SA for display fallback
    const config = NETWORKS[selectedChain];
    const chainIdStr = config?.evm?.chain?.id?.toString();
    const cachedSmartAccount = chainIdStr ? smartAccounts?.[chainIdStr]?.address : null;

    // Determine connection mode using the explicit state from hook
    const isUsingMetaMask = connectionType === 'metamask';

    // Auto-connect Wallet (Local or MetaMask) based on persisted state
    useEffect(() => {
        const autoConnect = async () => {
            console.log("[HeroBanner] Auto-connect Check:", {
                activeWallet,
                hasSmartAccountAddress: !!smartAccountAddress,
                hasPassword: !!currentPassword,
                isConnecting,
                connectionType,
                manualDisconnect: hasManuallyDisconnected.current
            });

            if (
                activeWallet === "EVM" && !smartAccountAddress && !isConnecting && !hasManuallyDisconnected.current
            ) {
                if (connectionType === 'metamask') {
                    console.log("[HeroBanner] Auto-reconnecting MetaMask...");
                    await connect(selectedChain, true);
                } else if (currentPassword) {
                    // Default to local if password exists and not explicitly metamask
                    console.log("[HeroBanner] Auto-connecting Local Wallet SDK...");
                    await connect(selectedChain, false);
                }
            }
        };
        autoConnect();
    }, [activeWallet, smartAccountAddress, currentPassword, isConnecting, selectedChain, connectionType, hasManuallyDisconnected, connect]);
    useEffect(() => {
        const fetchEoaBalance = async () => {
            if (activeWallet === "EVM" && ownerAddress) {
                const evmChains = Object.values(NETWORKS).filter(net => net.evm);

                const balancePromises = evmChains.map(async (config) => {
                    const usdcAsset = config.assets.find(a => a.name === "USDC");
                    if (usdcAsset && config.evm) {
                        try {
                            const result = await getBalanceFromChain(
                                config.evm.chain,
                                ownerAddress as `0x${string}`,
                                usdcAsset.address as `0x${string}`,
                                usdcAsset.decimals
                            );
                            if (!result.error) {
                                return parseFloat(result.balance);
                            }
                        } catch (e) {
                            console.error(`[HeroBanner] Error fetching balance for ${config.label}:`, e);
                        }
                    }
                    return 0;
                });

                const balances = await Promise.all(balancePromises);
                const totalBalance = balances.reduce((acc, curr) => acc + curr, 0);

                setEoaBalance(totalBalance);
            }
        };

        fetchEoaBalance();
    }, [activeWallet, ownerAddress, chainId, selectedChain]); // Refetch if chain changes (might indicate update) or wallet changes


    const displayAddress = (activeWallet === "EVM" && smartAccountAddress)
        ? smartAccountAddress
        : burnedAddresses[activeWallet];

    // Determine which balance to show prominently
    // If connected via MetaMask/EVM, we prioritizing showing the EOA balance if that's what user requested ("Eoa address and balance")
    // or we can show both.
    // For SplitBalance, we will use EOA balance if connected, otherwise burnedBalances (Local).
    const mainBalance = (activeWallet === "EVM" && smartAccountAddress) ? eoaBalance : burnedBalances[activeWallet];

    const handleChainSelect = async (chain: ChainKey) => {
        setChainAnchorEl(null);
        setSelectedChain(chain);
        if (activeWallet === "STELLAR") {
            setActiveWallet("EVM");
        }
        await connect(chain, true); // Use MetaMask
    };

    const handleChainAnchorClick = (event: MouseEvent<HTMLElement>) => {
        setChainAnchorEl(event.currentTarget);
    };

    const handleDisconnect = () => {
        hasManuallyDisconnected.current = true;
        disconnect();
    };

    const handleConnectClick = (event: MouseEvent<HTMLElement>) => {
        setWalletAnchorEl(event.currentTarget);
    };

    const handleWalletSelect = async (type: 'local' | 'external', connector?: any) => {
        setWalletAnchorEl(null);
        hasManuallyDisconnected.current = false;

        if (type === 'local') {
            console.log("Restoring Local Wallet connection...");
            await connect(selectedChain, false);
        } else {
            try {
                if (connector) {
                    disconnectWagmi();
                    connectWagmi({ connector });
                }
                await connect(selectedChain, true);
            } catch (e) {
                console.error("Connection failed:", e);
                toast.error("Failed to connect wallet");
            }
        }
    };

    const handleAuthSuccess = async () => {
        // 1. Get password
        const { currentPassword } = useWalletPasswordStore.getState();

        if (authAction === "reset") {
            // Perform Reset
            setPasswordModalOpen(false);
            resetWallet();
            return;
        }

        // Default: Export Logic
        const { mainWallet } = useXOWalletStore.getState();

        if (!currentPassword || !mainWallet) {
            toast.error("Error: No se encontró la información de la wallet.");
            setPasswordModalOpen(false);
            return;
        }

        try {
            // 2. Try to decrypt Mnemonic first (Default)
            if (mainWallet.encryptedMnemonic && mainWallet.salt && mainWallet.iv) {
                try {
                    const mnemonic = await decryptPrivateKey(
                        mainWallet.encryptedMnemonic,
                        currentPassword,
                        mainWallet.salt,
                        mainWallet.iv
                    );
                    if (mnemonic) {
                        setExportData(mnemonic);
                        setExportType("mnemonic");
                        setPasswordModalOpen(false);
                        setExportModalOpen(true);
                        return;
                    }
                } catch (e) {
                    console.warn("Could not decrypt mnemonic, falling back to private key", e);
                }
            }

            // 3. Fallback: Private Key of Active Wallet
            let encryptedKey = null;
            if (activeWallet === "EVM") encryptedKey = mainWallet.encryptedPrivateKey;
            else encryptedKey = mainWallet.encryptedPrivateKeyStellar;

            if (encryptedKey && mainWallet.salt && mainWallet.iv) {
                const pk = await decryptPrivateKey(
                    encryptedKey,
                    currentPassword,
                    mainWallet.salt,
                    mainWallet.iv
                );
                setExportData(pk);
                setExportType("privateKey");
                setPasswordModalOpen(false);
                setExportModalOpen(true);
            } else {
                toast.error("No se encontró clave privada para esta wallet.");
                setPasswordModalOpen(false);
            }

            toast.error("No se encontró clave privada ni frase semilla.");
            setPasswordModalOpen(false);

        } catch (error) {
            console.error("Export error:", error);
            toast.error("Contraseña incorrecta o error al desencriptar.");
            setPasswordModalOpen(false);
        }
    };

    return (
        <>
            <Box
                sx={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    background: "#ffffff",
                    zIndex: 2,
                }}
            >
                {activeWallet === "EVM" ? (<EthIcon />) : (<StellarIcon />)}
            </Box>

            {/* TOGGLE WALLET BUTTON & LOAD WALLET */}
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap", // Allow wrapping
                    justifyContent: { xs: "space-between", sm: "flex-end" }, // Space out on mobile/tablet
                    mb: 1,
                    gap: 1,
                    "& > button": {
                        flex: { xs: "1 1 45%", sm: "initial" }, // Near 50% width on mobile, auto on desktop
                        minWidth: "auto",
                        whiteSpace: "nowrap" // Prevent text wrapping inside button
                    }
                }}
            >
                <IconButton
                    id="tour-main-import"
                    onClick={() => setLoadWalletOpen(true)}
                    /* ... sx props ... */
                    sx={{
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        px: 1.5,
                        fontSize: 11,
                        fontWeight: 700,
                        "&:hover": {
                            background: "#00DC8C", // Branding Green
                        },
                    }}
                >
                    <FileUploadIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    IMPORTAR
                </IconButton>

                <IconButton
                    id="tour-main-export"
                    onClick={() => {
                        setAuthAction("export");
                        setPasswordModalOpen(true);
                    }}
                    /* ... sx props ... */
                    sx={{
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        px: 1.5,
                        fontSize: 11,
                        fontWeight: 700,
                        "&:hover": {
                            background: "#00DC8C",
                        },
                    }}
                >
                    <FileDownloadIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    EXPORTAR
                </IconButton>

                <IconButton
                    onClick={() => {
                        setAuthAction("reset");
                        setPasswordModalOpen(true);
                    }}
                    sx={{
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        px: 1.5,
                        fontSize: 11,
                        fontWeight: 700,
                        "&:hover": {
                            background: "#FF4444", // Danger Red
                            color: "white"
                        },
                    }}
                >
                    <RestartAltIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    RESETEAR
                </IconButton>

                <IconButton
                    onClick={() =>
                        setActiveWallet((prev) => {
                            const newWallet = prev === "EVM" ? "STELLAR" : "EVM";
                            // Enforce Base default when switching to EVM
                            if (newWallet === "EVM") {
                                setSelectedChain("Base");
                                hasManuallyDisconnected.current = false; // Allow auto-connect again
                            }
                            return newWallet;
                        })
                    }
                    /* ... sx props ... */
                    sx={{
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        px: 1.5,
                        fontSize: 12,
                        fontWeight: 700,
                        "&:hover": {
                            background: "#3CD2FF",
                        },
                    }}
                >
                    {activeWallet === "EVM" ? "→ STELLAR" : "→ EVM"}
                </IconButton>

                {activeWallet === "EVM" && (
                    <>
                        {/* Standard Button (Disconnect / Connect Local / Connect MM if no password) */}
                        <Button
                            onClick={smartAccountAddress ? handleDisconnect : handleConnectClick}
                            disabled={isConnecting}
                            sx={{
                                background: smartAccountAddress ? "#00DC8C" : "#ffffff",
                                border: "2px solid #000000",
                                borderRadius: 2,
                                px: 1.5,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#000000",
                                textTransform: "none",
                                "&:hover": {
                                    background: smartAccountAddress ? "#00CC7C" : "#f0f0f0",
                                },
                            }}
                            startIcon={isConnecting ? <CircularProgress size={16} /> : <AccountBalanceWalletIcon />}
                        >
                            {isConnecting ? "Conectando..." : smartAccountAddress ? "Desconectar" : (currentPassword ? "Reconectar Local" : "External Wallet")}
                        </Button>

                        {/* Explicit External Wallet Connect Button (Only if disconnected & using Local) */}
                        {!smartAccountAddress && currentPassword && !isConnecting && (
                            <Tooltip title="Conectar con External Wallet">
                                <IconButton
                                    onClick={handleConnectClick}
                                    sx={{
                                        ml: 1,
                                        background: "#ffffff",
                                        border: "2px solid #000000",
                                        borderRadius: 2,
                                        p: "5px",
                                        "&:hover": { background: "#f0f0f0" }
                                    }}
                                >
                                    <AccountBalanceWalletIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </>
                )}
            </Box>

            <Menu
                anchorEl={chainAnchorEl}
                open={Boolean(chainAnchorEl)}
                onClose={() => setChainAnchorEl(null)}
            >
                {["Base", "Optimism", "Arbitrum", "Polygon", "GNOSIS", "Avalanche", "BNB"].map((chain) => (
                    <MenuItem key={chain} onClick={() => handleChainSelect(chain as ChainKey)}>
                        {chain}
                    </MenuItem>
                ))}
            </Menu>

            <Menu
                anchorEl={walletAnchorEl}
                open={Boolean(walletAnchorEl)}
                onClose={() => setWalletAnchorEl(null)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                {currentPassword && (
                    <div>
                        <MenuItem onClick={() => handleWalletSelect('local')}>
                            <ListItemIcon>
                                <AccountBalanceWalletIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Local Wallet</ListItemText>
                        </MenuItem>
                        <Divider />
                    </div>
                )}

                {connectors.map((connector) => (
                    <MenuItem key={connector.uid || connector.id} onClick={() => handleWalletSelect('external', connector)}>
                        <ListItemIcon>
                            {/* Try to show specific icon if available or generic */}
                            <Box
                                component="img"
                                src={connector.icon || "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"}
                                sx={{ width: 20, height: 20, objectFit: 'contain' }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {(!connector.icon) && <AccountBalanceWalletIcon fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText>{connector.name}</ListItemText>
                    </MenuItem>
                ))}

                {connectors.length === 0 && (
                    <MenuItem disabled>No external wallets found</MenuItem>
                )}
            </Menu>

            <LoadWalletModal open={loadWalletOpen} onClose={() => setLoadWalletOpen(false)} />

            <PasswordModal
                open={passwordModalOpen}
                mode="unlock"
                title={authAction === "reset" ? "Nueva Wallet" : undefined}
                description={authAction === "reset" ? "Ingresa tu contraseña. Se generarán nuevas llaves (EVM + Stellar). ¡Respalda las actuales antes!" : undefined}
                onSuccess={handleAuthSuccess}
                onClose={() => setPasswordModalOpen(false)}
            />

            <ExportWalletModal
                open={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                data={exportData}
                type={exportType}
            />

            {/* MAIN WALLET SECTION */}
            <Box
                sx={{
                    background: "#f5f5f5",
                    border: "2px solid #000000",
                    borderRadius: 3,
                    p: { xs: 2, md: 2.5 },
                    mb: 2,
                    position: "relative",
                }}
            >
                <IconButton
                    id="tour-main-reload"
                    onClick={onRefresh}
                    disabled={isRefreshing || !canRefresh}
                    sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 36,
                        height: 36,
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        transition: "all 0.2s",
                        "&:hover": {
                            background: "#3CD2FF",
                            transform: "scale(1.05)",
                        },
                        "&:disabled": {
                            background: "#e0e0e0",
                            border: "2px solid #999999",
                        },
                    }}
                >
                    <RefreshIcon sx={{ fontSize: 20, color: "#000000", animation: isRefreshing ? "spin 1s linear infinite" : "none", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />
                </IconButton>

                <Typography
                    variant="body2"
                    sx={{
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontSize: { xs: 10, md: 11 },
                        fontWeight: 700,
                        color: "#666666",
                        mb: 1,
                    }}
                >
                    Main Wallet {activeWallet}
                    {activeWallet === "EVM" && xoClientAlias
                        ? ` de ${xoClientAlias}`
                        : ""}
                    {smartAccountAddress && activeWallet === "EVM" && (isUsingMetaMask ? " (External Wallet Connected)" : " (Local Connected)")}
                </Typography>

                <Box sx={{ mb: 1.5 }}>
                    <SplitBalance
                        amount={mainBalance}
                        mainFontSize={{ xs: 32, sm: 38, md: 44 }}
                        smallFontSize={{ xs: 20, sm: 24, md: 28 }}
                    />
                </Box>

                {/* ADDRESS DISPLAY SECTION */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>

                    {/* 1. Smart Account (Secondary) */}
                    {
                        activeWallet === "EVM" && (smartAccountAddress || cachedSmartAccount) && (
                            <Box
                                sx={{
                                    background: "transparent",
                                    px: 0.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                }}
                            >
                                <Typography variant="caption" sx={{ fontWeight: 700, mr: 1, color: "#666" }}>SA:</Typography>
                                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#666" }}>
                                    {smartAccountAddress || cachedSmartAccount}
                                </Typography>
                            </Box>
                        )
                    }

                    {/* 2. Main Address (EOA or Local) */}
                    <Box
                        sx={{
                            background: "#ffffff",
                            border: "2px solid #000000",
                            borderRadius: 2,
                            py: 0.75,
                            px: 1.5,
                            display: "flex",
                            alignItems: "center",
                            maxWidth: "100%",
                        }}
                    >
                        {/* Label only if connected to avoid confusion, or always? User said "EOA address". */}
                        {activeWallet === "EVM" && (smartAccountAddress || cachedSmartAccount) && <Typography variant="caption" sx={{ fontWeight: 700, mr: 1 }}>EOA:</Typography>}

                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: { xs: 10, md: 11 },
                                fontWeight: 600,
                                color: "#000000",
                                fontFamily: "monospace",
                                wordBreak: "break-all",
                            }}
                        >
                            {/* If connected, show Owner Address (EOA). If not, show Local Address (burnedAddress) */}
                            {(activeWallet === "EVM" && ownerAddress) ? ownerAddress : burnedAddresses[activeWallet]}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* FLOATING ACTION BUTTON FOR CHAIN INFO (EVM ONLY) */}
            {activeWallet === "EVM" && (
                <FloatingChainInfo
                    selectedChain={selectedChain}
                    isDeployed={isDeployed}
                    ensureDeployed={ensureDeployed}
                    ensureApproval={ensureApproval}
                    account={account}
                    smartAccountAddress={smartAccountAddress}
                    setSelectedChain={async (chain) => {
                        setSelectedChain(chain);
                        // Trigger re-connection logic immediately using SAME method as current
                        console.log(`[FloatingChainInfo] Switching to ${chain}... Method: ${isUsingMetaMask ? 'MetaMask' : 'Local'}`);
                        await connect(chain, isUsingMetaMask);
                    }}
                    connectedChainId={chainId}
                    isConnecting={isConnecting}
                />
            )}
        </>
    );
};
