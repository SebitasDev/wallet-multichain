import { Box } from "@mui/material";
import { EthIcon } from "@/app/components/atoms/EthIcon";
import { StellarIcon } from "@/app/components/atoms/StellarIcon";
import { ActiveWallet, useMainWalletUI } from "@/app/dashboard/hooks/dashboard/useHeroBanner";
import { Dispatch, SetStateAction, MouseEvent, useRef } from "react";
import { LoadWalletModal } from "../LoadWalletModal";
import { useEmbeddedWalletContext } from "@/app/dashboard/hooks/wallet/useEmbeddedWallet";
import { PasswordModal } from "../../components/PasswordModal";
import { ExportWalletModal } from "../../components/ExportWalletModal";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { toast } from "react-toastify";
import { useSmartAccount } from "../../hooks/useSmartAccount";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { FloatingChainInfo } from "../FloatingChainInfo";
import { useConnect, useDisconnect } from "wagmi";

// --- New Components & Hooks ---
import { useEoaBalance } from "../../hooks/wallet/useEoaBalance";
import { useWalletAutoconnect } from "../../hooks/wallet/useWalletAutoconnect";
import { WalletActions } from "./components/WalletActions";
import { WalletConnectionMenu } from "./components/WalletConnectionMenu";
import { WalletAddressDisplay } from "./components/WalletAddressDisplay";

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

    const { mainWallet } = useXOWalletStore();
    const { currentPassword } = useWalletPasswordStore();
    const { address: addressXO, resetWallet, isUsingXO, provider: embeddedProvider } = useEmbeddedWalletContext();

    // --- State Hook Overhaul ---
    const {
        loadWalletOpen, setLoadWalletOpen,
        walletAnchorEl, setWalletAnchorEl,
        selectedChain, setSelectedChain,
        passwordModalOpen, setPasswordModalOpen,
        exportModalOpen, setExportModalOpen,
        exportData,
        exportType,
        authAction, setAuthAction,
        handleAuthSuccess
    } = useMainWalletUI(activeWallet, resetWallet);

    // Hooks & Stores
    const { connectors, connect: connectWagmi } = useConnect();
    const { disconnect: disconnectWagmi } = useDisconnect();
    const hasManuallyDisconnected = useRef(false);

    // Smart Account Logic
    const {
        account,
        connectionType,
        ensureDeployed,
        ensureApproval,
        isDeployed,
        smartAccountAddress,
        ownerAddress,
        connect,
        disconnect,
        chainId,
        isConnecting
    } = useSmartAccount();

    const isUsingMetaMask = connectionType === 'metamask';

    // Derived Logic
    const canRefresh = isUsingXO || !!burnedAddresses[activeWallet];
    const config = NETWORKS[selectedChain];
    const chainIdStr = config?.evm?.chain?.id?.toString();
    const cachedSmartAccount = chainIdStr ? mainWallet.smartAccounts?.[chainIdStr]?.address : null;

    // --- Custom Hooks ---
    useWalletAutoconnect(
        activeWallet,
        smartAccountAddress,
        isConnecting,
        hasManuallyDisconnected,
        connectionType,
        currentPassword,
        selectedChain,
        connect
    );

    const eoaBalance = useEoaBalance(
        activeWallet,
        ownerAddress,
        selectedChain,
        isRefreshing ? 1 : 0
    );

    // Determine Main Balance to display
    const mainBalance = (activeWallet === "EVM" && smartAccountAddress) ? eoaBalance : burnedBalances[activeWallet];

    // --- Handlers ---
    const handleDisconnect = () => {
        hasManuallyDisconnected.current = true;
        disconnect();
    };

    const handleConnectMenuOpen = (event: MouseEvent<HTMLElement>) => {
        setWalletAnchorEl(event.currentTarget);
    };

    const handleWalletSelect = async (type: 'local' | 'external' | 'embedded', connector?: any) => {
        setWalletAnchorEl(null);
        hasManuallyDisconnected.current = false;

        if (type === 'local') {
            console.log("Restoring Local Wallet connection...");
            await connect(selectedChain, false);
        } else if (type === 'embedded') {
            console.log("Connecting Embedded Wallet...");
            await connect(selectedChain, false, embeddedProvider); // Pass provider!
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

    return (
        <>
            {/* Wallet Icon Badge */}
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

            {/* ACTION BUTTONS */}
            <WalletActions
                activeWallet={activeWallet}
                setActiveWallet={setActiveWallet}
                setSelectedChain={setSelectedChain}
                onImportClick={() => setLoadWalletOpen(true)}
                onExportClick={() => { setAuthAction("export"); setPasswordModalOpen(true); }}
                onResetClick={() => { setAuthAction("reset"); setPasswordModalOpen(true); }}
                onConnectClick={handleConnectMenuOpen}
                onDisconnectClick={handleDisconnect}
                isConnecting={isConnecting}
                smartAccountAddress={smartAccountAddress}
                currentPassword={currentPassword}
                hasManuallyDisconnectedRef={hasManuallyDisconnected}
            />

            {/* CONNECTION MENU */}
            <WalletConnectionMenu
                anchorEl={walletAnchorEl}
                open={Boolean(walletAnchorEl)}
                onClose={() => setWalletAnchorEl(null)}
                hasPassword={!!currentPassword}
                connectors={connectors}
                onSelect={handleWalletSelect}
                hideMetaMask={isUsingXO}
            />

            {/* MODALS */}
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

            {/* MAIN DISPLAY */}
            <WalletAddressDisplay
                activeWallet={activeWallet}
                xoClientAlias={xoClientAlias}
                smartAccountAddress={smartAccountAddress}
                cachedSmartAccount={cachedSmartAccount}
                ownerAddress={ownerAddress}
                burnedAddress={burnedAddresses[activeWallet]}
                isUsingMetaMask={isUsingMetaMask}
                mainBalance={mainBalance}
                isRefreshing={isRefreshing}
                canRefresh={canRefresh}
                onRefresh={onRefresh}
            />

            {/* FLOATING CHAIN INFO (EVM) */}
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
                        console.log(`[FloatingChainInfo] Switch to ${chain}`);
                        await connect(chain, isUsingMetaMask);
                    }}
                    connectedChainId={chainId}
                    isConnecting={isConnecting}
                />
            )}
        </>
    );
};
