import {Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {formatCurrency} from "@/app/utils/formatCurrency";
import {CHAIN_ID_TO_KEY, ChainConfig, ChainKey, NETWORKS} from "@/app/constants/chainsInformation";
import {AllocationSummary} from "@/app/dashboard/types";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import MoveUpIcon from '@mui/icons-material/MoveUp';
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import {RouteDetail} from "@/app/dashboard/hooks/useSendMoney";

type Props = {
    routeDetails: RouteDetail[],
    routeReady: boolean,
    routeSummary: AllocationSummary | null,
    selected: ChainConfig
}

export const STATUS_META = {
    idle:      { label: "Pendiente",      icon: <HourglassEmptyIcon />, color: "#cccccc" },
    starting:  { label: "Iniciando",      icon: <RocketLaunchIcon />, color: "#3CD2FF" },
    approving: { label: "Aprobando",      icon: <AutorenewIcon sx={{ animation: "spin 1.2s linear infinite" }} />, color: "#7852FF" },
    burning:   { label: "Quemando",       icon: <LocalFireDepartmentIcon />, color: "#FF0420" },
    waiting:   { label: "Esperando",      icon: <HourglassBottomIcon />, color: "#FF007A" },
    minting:   { label: "Minteando",      icon: <AutorenewIcon sx={{ animation: "spin 1.2s linear infinite" }} />, color: "#8247E5" },
    transfer:   { label: "Transfiriendo", icon: <MoveUpIcon />, color: "#28A0F0" },
    done:      { label: "Completado",     icon: <CheckCircleIcon />, color: "#00DC8C" },
    error:     { label: "Error",          icon: <ErrorIcon />, color: "#ff4444" },
} as const;


export const FinishRoute = (
    { routeDetails, routeReady, routeSummary, selected } : Props
) => {
    return (
        <Box
            sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                backgroundColor: "#f5f5f5",
                border: "2px solid #000000",
                display: "flex",
                flexDirection: "column",
                gap: 2,
            }}
        >
            <Typography
                fontWeight={800}
                fontSize={{ xs: 13, sm: 15 }}
                sx={{
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: "#000000"
                }}
            >
                Ruta encontrada
            </Typography>

            <Stack spacing={2}>
                {routeDetails.map((wallet) => {
                    const shortAddress = `${wallet.wallet.slice(0, 6)}...${wallet.wallet.slice(-4)}`;

                    return (
                        <Accordion
                            key={wallet.wallet}
                            disableGutters
                            elevation={0}
                            sx={{
                                backgroundColor: "#ffffff",
                                borderRadius: 3,
                                border: "2px solid #000000",
                                overflow: "hidden",
                                "&::before": { display: "none" },
                                "&.Mui-expanded": {
                                    margin: 0,
                                },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={{ color: "#000000" }} />}
                                sx={{
                                    minHeight: { xs: 48, sm: 56 },
                                    px: { xs: 1.5, sm: 2 },
                                    "&.Mui-expanded": {
                                        minHeight: { xs: 48, sm: 56 },
                                        borderBottom: "2px solid #000000",
                                    },
                                }}
                            >
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    sx={{ width: "100%", pr: { xs: 0.5, sm: 1 }, minWidth: 0 }}
                                    spacing={{ xs: 1, sm: 2 }}
                                >
                                    <Box flex={1} minWidth={0}>
                                        <Typography
                                            fontWeight={800}
                                            fontSize={{ xs: 13, sm: 14 }}
                                            color="#000000"
                                            sx={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap"
                                            }}
                                        >
                                            Wallet
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "#666666",
                                                fontWeight: 600,
                                                fontSize: { xs: 11, sm: 12 },
                                                fontFamily: "monospace"
                                            }}
                                            title={wallet.wallet}
                                        >
                                            {shortAddress}
                                        </Typography>
                                    </Box>
                                    <Box textAlign="right" flexShrink={0}>
                                        <Typography
                                            fontSize={{ xs: 10, sm: 11 }}
                                            sx={{
                                                color: "#666666",
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                letterSpacing: 0.5
                                            }}
                                        >
                                            Total
                                        </Typography>
                                        <Typography
                                            fontWeight={800}
                                            fontSize={{ xs: 13, sm: 15 }}
                                            color="#000000"
                                        >
                                            {formatCurrency(
                                                wallet.chains.reduce((acc, c) => {
                                                    const chainKey = CHAIN_ID_TO_KEY[c.id];
                                                    const fee = chainKey ? NETWORKS[chainKey as ChainKey].aproxFromFee : 0;
                                                    return acc + c.amount + fee;
                                                }, 0) + 0.01
                                            )}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: { xs: 1.5, sm: 2 }, backgroundColor: "#f5f5f5" }}>
                                <Stack spacing={1.5}>
                                    {wallet.chains.map((r) => {
                                        const network = Object.values(NETWORKS).find(n => n.chain.id.toString() === r.id);
                                        const fee = (network?.aproxFromFee ?? 0) + 0.01;
                                        const statusMeta = STATUS_META[r.status];

                                        return (
                                            <Box
                                                key={r.id}
                                                sx={{
                                                    p: { xs: 1.5, sm: 2 },
                                                    borderRadius: 3,
                                                    backgroundColor: "#ffffff",
                                                    border: "2px solid #000000",
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                    mb={1.5}
                                                    spacing={1}
                                                    sx={{ minWidth: 0 }}
                                                >
                                                    <Stack direction="row" alignItems="center" spacing={1} flex={1} minWidth={0}>
                                                        <Box sx={{
                                                            width: { xs: 24, sm: 28 },
                                                            height: { xs: 24, sm: 28 },
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            flexShrink: 0,
                                                            "& svg": {
                                                                width: "100%",
                                                                height: "100%",
                                                            }
                                                        }}>
                                                            {r.icon}
                                                        </Box>
                                                        <Typography
                                                            fontWeight={800}
                                                            fontSize={{ xs: 13, sm: 14 }}
                                                            color="#000000"
                                                            sx={{
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap"
                                                            }}
                                                        >
                                                            {r.label}
                                                        </Typography>
                                                    </Stack>

                                                    <Typography
                                                        fontWeight={800}
                                                        fontSize={{ xs: 13, sm: 15 }}
                                                        color="#000000"
                                                        sx={{ flexShrink: 0 }}
                                                    >
                                                        {formatCurrency(
                                                            r.amount +
                                                            ((CHAIN_ID_TO_KEY[r.id]
                                                                ? NETWORKS[CHAIN_ID_TO_KEY[r.id] as ChainKey].aproxFromFee
                                                                : 0) || 0) + 0.01
                                                        )}
                                                    </Typography>
                                                </Stack>

                                                {/* Status */}
                                                <Box
                                                    sx={{
                                                        px: { xs: 1.2, sm: 1.5 },
                                                        py: { xs: 0.6, sm: 0.75 },
                                                        borderRadius: 2,
                                                        border: "2px solid #000000",
                                                        fontSize: { xs: 11, sm: 12 },
                                                        fontWeight: 800,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        backgroundColor: statusMeta?.color || "#cccccc",
                                                        color: r.status === 'idle' ? "#000000" : "#ffffff",
                                                        mb: r.message ? 1 : 0,
                                                    }}
                                                >
                                                    {statusMeta?.icon}
                                                    {statusMeta?.label}
                                                </Box>

                                                {r.message && (
                                                    <Typography
                                                        fontSize={{ xs: 11, sm: 12 }}
                                                        sx={{
                                                            color: "#666666",
                                                            fontWeight: 600,
                                                            mt: 1,
                                                            wordBreak: "break-word"
                                                        }}
                                                    >
                                                        {r.message}
                                                    </Typography>
                                                )}

                                                {/* Fee info */}
                                                <Typography
                                                    mt={1.5}
                                                    variant="body2"
                                                    fontSize={{ xs: 10, sm: 11 }}
                                                    sx={{
                                                        color: "#666666",
                                                        fontWeight: 700,
                                                        textTransform: "uppercase",
                                                        letterSpacing: 0.5
                                                    }}
                                                >
                                                    Fee estimada: {formatCurrency(fee)}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
            </Stack>

            {/* RESUMEN FINAL */}
            <Box
                sx={{
                    mt: 1,
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 3,
                    backgroundColor: "#ffffff",
                    border: "2px solid #000000",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                <Box>
                    <Typography
                        fontWeight={800}
                        fontSize={{ xs: 11, sm: 13 }}
                        sx={{
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "#666666",
                            mb: 0.5
                        }}
                    >
                        Destinatario
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: "#000000",
                            fontWeight: 600,
                            fontSize: { xs: 11, sm: 12 },
                            fontFamily: "monospace",
                            mb: 1.5,
                            wordBreak: "break-all",
                            overflowWrap: "break-word"
                        }}
                    >
                        {routeReady || "N/D"}
                    </Typography>

                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{
                            width: { xs: 20, sm: 24 },
                            height: { xs: 20, sm: 24 },
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            "& svg": {
                                width: "100%",
                                height: "100%",
                            }
                        }}>
                            {selected?.icon}
                        </Box>
                        <Typography
                            variant="body2"
                            fontWeight={700}
                            fontSize={{ xs: 12, sm: 13 }}
                            color="#000000"
                        >
                            Llega en {selected?.label || "Chain destino"}
                        </Typography>
                    </Stack>
                </Box>

                <Box
                    sx={{
                        background: "#f5f5f5",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        p: { xs: 1.5, sm: 2 },
                    }}
                >
                    <Typography
                        fontWeight={800}
                        fontSize={{ xs: 11, sm: 13 }}
                        sx={{
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "#666666",
                            mb: 0.5
                        }}
                    >
                        Recibe
                    </Typography>

                    <Typography
                        fontWeight={900}
                        fontSize={{ xs: 18, sm: 24 }}
                        color="#000000"
                        sx={{ mb: 0.5 }}
                    >
                        {formatCurrency((routeSummary?.targetAmount) ?? 0)}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: "#666666",
                            fontWeight: 600,
                            fontSize: { xs: 10, sm: 11 }
                        }}
                    >
                        Monto neto luego de comisión
                    </Typography>
                </Box>
            </Box>
        </Box>
    )
}