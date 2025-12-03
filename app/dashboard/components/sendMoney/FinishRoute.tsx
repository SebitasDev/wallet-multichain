import {Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {formatCurrency} from "@/app/utils/formatCurrency";
import {ChainConfig, NETWORKS} from "@/app/constants/chainsInformation";
import {JSX} from "react";
import {AllocationSummary} from "@/app/dashboard/types";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
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
    idle:      { label: "Pendiente",      icon: <HourglassEmptyIcon color="disabled" /> },
    starting:  { label: "Iniciando",      icon: <RocketLaunchIcon color="primary" /> },
    approving: { label: "Aprobando",      icon: <AutorenewIcon sx={{ animation: "spin 1.2s linear infinite" }} /> },
    burning:   { label: "Quemando",       icon: <LocalFireDepartmentIcon color="error" /> },
    waiting:   { label: "Esperando",      icon: <HourglassBottomIcon /> },
    minting:   { label: "Minteando",      icon: <AutorenewIcon sx={{ animation: "spin 1.2s linear infinite" }} /> },
    done:      { label: "Completado",     icon: <CheckCircleIcon color="success" /> },
    error:     { label: "Error",          icon: <ErrorIcon color="error" /> },
} as const;


export const FinishRoute = (
    { routeDetails, routeReady, routeSummary, selected } : Props
) => {
    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
            }}
        >
            <Typography fontWeight={800} fontSize={15}>
                Ruta encontrada
            </Typography>
            <Stack spacing={1}>
                {routeDetails.map((wallet) => (
                    <Accordion
                        key={wallet.wallet}
                        disableGutters
                        elevation={0}
                        sx={{
                            backgroundColor: "#fff",
                            borderRadius: 1.5,
                            boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
                            "&::before": { display: "none" },
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{ width: "100%" }}
                                spacing={2}
                            >
                                <Box>
                                    <Typography fontWeight={800}>{wallet.walletName}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {wallet.wallet}
                                    </Typography>
                                </Box>
                                <Box textAlign="right">
                                    <Typography fontSize={12} color="text.secondary">
                                        Total
                                    </Typography>
                                    <Typography fontWeight={800}>
                                        {formatCurrency(
                                            wallet.chains.reduce((acc, c) => acc + c.amount, 0),
                                        )}
                                    </Typography>
                                </Box>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={1.5}>
                                {wallet.chains.map((r) => {
                                    const network = Object.values(NETWORKS).find(n => n.chain.id.toString() === r.id);
                                    const fee = (network?.aproxFromFee ?? 0) + 0.01;

                                    return (
                                        <Box
                                            key={r.id}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                backgroundColor: "#f8fafc",
                                                border: "1px solid #e5e7eb",
                                            }}
                                        >
                                            {/* Row principal: icono + nombre + monto */}
                                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                <Stack direction="row" alignItems="center" spacing={1.2}>
                                                    {r.icon}
                                                    <Typography fontWeight={700}>{r.label}</Typography>
                                                </Stack>

                                                <Typography fontWeight={800}>{formatCurrency(r.amount)}</Typography>
                                            </Stack>

                                            {/* Status */}
                                            <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                                                <Box
                                                    sx={{
                                                        px: 1,
                                                        py: 0.3,
                                                        borderRadius: 2,
                                                        fontSize: "12px",
                                                        fontWeight: 700,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        backgroundColor:
                                                            r.status === "done"
                                                                ? "#d1fae5"
                                                                : r.status === "error"
                                                                    ? "#fee2e2"
                                                                    : "#e2e8f0",
                                                    }}
                                                >
                                                    {STATUS_META[r.status]?.icon}
                                                    {STATUS_META[r.status]?.label}
                                                </Box>

                                                {r.message && (
                                                    <Typography fontSize={12} color="text.secondary">
                                                        {r.message}
                                                    </Typography>
                                                )}
                                            </Stack>

                                            {/* Fee info */}
                                            <Typography
                                                mt={0.8}
                                                variant="body2"
                                                fontSize={12}
                                                color="text.secondary"
                                            >
                                                Fee estimada: {formatCurrency(fee)}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>

                        </AccordionDetails>
                    </Accordion>
                ))}
            </Stack>
            <Box
                sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#fff",
                    boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    gap: 1,
                }}
            >
                <Box>
                    <Typography fontWeight={800}>Destinatario</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {routeReady || "N/D"}
                    </Typography>

                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                        {selected?.icon}
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Llega en {selected?.label || "Chain destino"}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Box textAlign={{ xs: "left", sm: "right" }}>
                    <Typography fontWeight={800}>Recibe</Typography>

                    <Typography fontWeight={900}>
                        {formatCurrency(routeSummary?.targetAmount ?? 0)}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        Monto neto luego de comisión estimada
                    </Typography>
                </Box>

            </Box>
        </Box>
    )
}