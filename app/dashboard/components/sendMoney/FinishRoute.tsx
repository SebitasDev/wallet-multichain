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

type routeDetail = {
    wallet: string
    walletName: string
    chains: {
        id: string
        label: string
        icon: JSX.Element | null
        amount: number,
        status: "idle" | "starting" | "approving" | "burning" | "waiting" | "minting" | "done" | "error",
        message: string,
    }[]
}[]

type Props = {
    routeDetails: routeDetail,
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
                            <Stack spacing={1}>
                                {wallet.chains.map((r) => (
                                    <Box
                                        key={r.id}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            p: 1,
                                            borderRadius: 1,
                                            backgroundColor: "#f8fafc",
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            {r.icon}
                                            <Typography fontWeight={700}>{r.label}</Typography>
                                        </Stack>
                                        <Box textAlign="right">
                                            <Box
                                                key={r.id}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    p: 1,
                                                    borderRadius: 1,
                                                    backgroundColor:
                                                        r.status === "done"
                                                            ? "#d1fae5"   // verde
                                                            : r.status === "error"
                                                                ? "#fee2e2"   // rojo
                                                                : "#f8fafc",
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    {STATUS_META[r.status]?.icon}
                                                    <Box>
                                                        <Typography fontWeight={700}>{r.label}</Typography>
                                                        <Typography fontSize={12} color="text.secondary">
                                                            {STATUS_META[r.status]?.label} — {r.message}
                                                        </Typography>
                                                    </Box>
                                                </Stack>

                                                <Box textAlign="right">
                                                    <Typography fontWeight={800}>
                                                        {formatCurrency(r.amount)}
                                                    </Typography>
                                                </Box>
                                            </Box>


                                            <Typography variant="body2" color="text.secondary">
                                                - {formatCurrency(
                                                (Object.values(NETWORKS).find(n => n.chain.id.toString() === r.id)?.aproxFromFee ?? 0) + 0.01
                                            )}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
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