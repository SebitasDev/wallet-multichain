import { Box, IconButton, Button, CircularProgress, Tooltip } from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { MouseEvent, Dispatch, SetStateAction } from "react";
import { ActiveWallet } from "@/app/dashboard/hooks/dashboard/useHeroBanner";
import { ChainKey } from "@/app/types/chain";

interface WalletActionsProps {
    activeWallet: ActiveWallet;
    setActiveWallet: Dispatch<SetStateAction<ActiveWallet>>;
    setSelectedChain: (chain: ChainKey) => void;
    // Handlers
    onImportClick: () => void;
    onExportClick: () => void;
    onResetClick: () => void;
    onConnectClick: (e: MouseEvent<HTMLElement>) => void;
    onDisconnectClick: () => void;
    // State
    isConnecting: boolean;
    smartAccountAddress: string | null;
    currentPassword: string | null;
    hasManuallyDisconnectedRef: React.MutableRefObject<boolean>;
}

export const WalletActions = ({
    activeWallet,
    setActiveWallet,
    setSelectedChain,
    onImportClick,
    onExportClick,
    onResetClick,
    onConnectClick,
    onDisconnectClick,
    isConnecting,
    smartAccountAddress,
    currentPassword,
    hasManuallyDisconnectedRef
}: WalletActionsProps) => {

    const handleToggleWallet = () => {
        setActiveWallet((prev) => {
            const newWallet = prev === "EVM" ? "STELLAR" : "EVM";
            if (newWallet === "EVM") {
                setSelectedChain("Base");
                hasManuallyDisconnectedRef.current = false;
            }
            return newWallet;
        });
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: { xs: "space-between", sm: "flex-end" },
                mb: 1,
                gap: 1,
                "& > button": {
                    flex: { xs: "1 1 45%", sm: "initial" },
                    minWidth: "auto",
                    whiteSpace: "nowrap"
                }
            }}
        >
            <IconButton
                id="tour-main-import"
                onClick={onImportClick}
                sx={{
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 2,
                    px: 1.5,
                    fontSize: 11,
                    fontWeight: 700,
                    "&:hover": { background: "#00DC8C" },
                }}
            >
                <FileUploadIcon sx={{ fontSize: 16, mr: 0.5 }} />
                IMPORTAR
            </IconButton>

            <IconButton
                id="tour-main-export"
                onClick={onExportClick}
                sx={{
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 2,
                    px: 1.5,
                    fontSize: 11,
                    fontWeight: 700,
                    "&:hover": { background: "#00DC8C" },
                }}
            >
                <FileDownloadIcon sx={{ fontSize: 16, mr: 0.5 }} />
                EXPORTAR
            </IconButton>

            <IconButton
                onClick={onResetClick}
                sx={{
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 2,
                    px: 1.5,
                    fontSize: 11,
                    fontWeight: 700,
                    "&:hover": {
                        background: "#FF4444",
                        color: "white"
                    },
                }}
            >
                <RestartAltIcon sx={{ fontSize: 16, mr: 0.5 }} />
                RESETEAR
            </IconButton>

            <IconButton
                onClick={handleToggleWallet}
                sx={{
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 2,
                    px: 1.5,
                    fontSize: 12,
                    fontWeight: 700,
                    "&:hover": { background: "#3CD2FF" },
                }}
            >
                {activeWallet === "EVM" ? "→ STELLAR" : "→ EVM"}
            </IconButton>

            {activeWallet === "EVM" && (
                <>
                    {/* Main Connect/Disconnect Button */}
                    <Button
                        onClick={smartAccountAddress ? onDisconnectClick : onConnectClick}
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
                        {isConnecting
                            ? "Conectando..."
                            : smartAccountAddress
                                ? "Desconectar"
                                : (currentPassword ? "Reconectar Local" : "External Wallet")
                        }
                    </Button>

                    {/* Secondary External Wallet Button (if Local-ready but disconnected) */}
                    {!smartAccountAddress && currentPassword && !isConnecting && (
                        <Tooltip title="Conectar con External Wallet">
                            <IconButton
                                onClick={onConnectClick}
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
    );
};
