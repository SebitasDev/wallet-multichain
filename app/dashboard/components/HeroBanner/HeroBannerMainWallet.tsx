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
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useXOContracts } from "../../hooks/useXOConnect";

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
    const { resetWallet, isUsingXO } = useXOContracts();
    const canRefresh = isUsingXO || !!burnedAddresses[activeWallet];

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
                }}
            >
                {activeWallet === "EVM" ? (<EthIcon />) : (<StellarIcon />)}
            </Box>

            {/* TOGGLE WALLET BUTTON & LOAD WALLET */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1, gap: 1 }}>
                <IconButton
                    id="tour-main-import"
                    onClick={() => setLoadWalletOpen(true)}
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
                    onClick={() => {
                        const msg = isUsingXO
                            ? "¿Estás seguro? Se generará una NUEVA wallet de Stellar (tu conexión EVM actual se mantendrá)."
                            : "⚠️ ¿RESET TOTAL? Se borrará tu wallet actual y se generará una nueva (EVM + Stellar). Asegúrate de tener respaldo si te importa.";

                        if (window.confirm(msg)) {
                            resetWallet();
                        }
                    }}
                    sx={{
                        background: "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        px: 1, // Smaller padding for icon-only button
                        "&:hover": {
                            background: "#FF4444", // Danger Red
                            color: "white"
                        },
                    }}
                >
                    <RestartAltIcon sx={{ fontSize: 20 }} />
                </IconButton>

                <IconButton
                    onClick={() =>
                        setActiveWallet((prev) =>
                            prev === "EVM" ? "STELLAR" : "EVM"
                        )
                    }
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
