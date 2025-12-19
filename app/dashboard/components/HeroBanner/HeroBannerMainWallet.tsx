import {
    Box,
    Typography,
    IconButton,
} from "@mui/material";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { EthIcon } from "@/app/components/atoms/EthIcon";
import { StellarIcon } from "@/app/components/atoms/StellarIcon";
import { ActiveWallet } from "@/app/dashboard/hooks/useHeroBanner";
import { Dispatch, SetStateAction, useState } from "react";
import { LoadWalletModal } from "../LoadWalletModal";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useXOContracts } from "../../hooks/useXOConnect";
import { PasswordModal } from "../../components/PasswordModal";
import { ExportWalletModal } from "../../components/ExportWalletModal";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { toast } from "react-toastify";
import CloseIcon from '@mui/icons-material/Close'; // Used if adding a close button to PasswordModal, but for now we rely on external state or maybe I need to update PasswordModal later.


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

    // EXPORT WALLET STATES
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportData, setExportData] = useState("");
    const [exportType, setExportType] = useState<"mnemonic" | "privateKey">("mnemonic");
    const [authAction, setAuthAction] = useState<"export" | "reset" | null>(null);

    const { resetWallet, isUsingXO } = useXOContracts();

    const canRefresh = isUsingXO || !!burnedAddresses[activeWallet];

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
            // 2. Try to decrypt Mnemonic first
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

            // 3. Fallback: Decrypt Private Key of Active Wallet
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

        } catch (error) {
            console.error("Export error:", error);
            toast.error("Contraseña incorrecta o error al desencriptar.");
            setPasswordModalOpen(false);
        }
    };

    return (
        <>
            <Box /* ... existing icon box ... */
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
                        setActiveWallet((prev) =>
                            prev === "EVM" ? "STELLAR" : "EVM"
                        )
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
            </Box>



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
                </Typography>

                <Typography
                    sx={{
                        fontSize: { xs: 32, sm: 38, md: 44 },
                        fontWeight: 900,
                        lineHeight: 1,
                        color: "#000000",
                        mb: 1.5,
                    }}
                >
                    {formatCurrency(burnedBalances[activeWallet])}
                </Typography>

                <Box
                    sx={{
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        py: 0.75,
                        px: 1.5,
                        display: "inline-block",
                        maxWidth: "100%",
                    }}
                >
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
                        {burnedAddresses[activeWallet]}
                    </Typography>
                </Box>
            </Box>
        </>
    );
};
