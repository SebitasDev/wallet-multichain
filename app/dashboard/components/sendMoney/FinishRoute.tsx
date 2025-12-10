import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { CHAIN_ID_TO_KEY, ChainConfig, ChainKey, NETWORKS } from "@/app/constants/chainsInformation";
import { AllocationSummary } from "@/app/dashboard/types";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import MoveUpIcon from "@mui/icons-material/MoveUp";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { RouteDetail } from "@/app/dashboard/hooks/useSendMoney";

type Props = {
    routeDetails: RouteDetail[];
    routeReady: boolean;
    routeSummary: AllocationSummary | null;
    selected: ChainConfig;
};

export const STATUS_META = {
    idle: { label: "Pending", icon: <HourglassEmptyIcon sx={{ fontSize: 16, color: "#64748b" }} /> },
    starting: { label: "Starting", icon: <RocketLaunchIcon sx={{ fontSize: 16, color: "#0ea5e9" }} /> },
    approving: { label: "Approving", icon: <AutorenewIcon sx={{ fontSize: 16, color: "#0ea5e9", animation: "spin 1.2s linear infinite" }} /> },
    burning: { label: "Burning", icon: <LocalFireDepartmentIcon sx={{ fontSize: 16, color: "#ef4444" }} /> },
    waiting: { label: "Waiting", icon: <HourglassBottomIcon sx={{ fontSize: 16, color: "#f59e0b" }} /> },
    minting: { label: "Minting", icon: <AutorenewIcon sx={{ fontSize: 16, color: "#8b5cf6", animation: "spin 1.2s linear infinite" }} /> },
    transfer: { label: "Transferring", icon: <MoveUpIcon sx={{ fontSize: 16, color: "#0ea5e9" }} /> },
    done: { label: "Complete", icon: <CheckCircleIcon sx={{ fontSize: 16, color: "#10b981" }} /> },
    error: { label: "Error", icon: <ErrorIcon sx={{ fontSize: 16, color: "#ef4444" }} /> },
} as const;

export const FinishRoute = ({ routeDetails, routeReady, routeSummary, selected }: Props) => {
    return (
        <Stack spacing={2.5}>
            {/* Route Summary Header */}
            <Box
                sx={{
                    p: 2,
                    borderRadius: "12px",
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.15)",
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircleIcon sx={{ fontSize: 20, color: "#10b981" }} />
                    <Typography sx={{ fontWeight: 600, color: "#10b981", fontSize: "14px" }}>
                        Route found successfully
                    </Typography>
                </Stack>
            </Box>

            {/* Wallet Allocations */}
            <Box>
                <Typography
                    sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        mb: 1.5,
                    }}
                >
                    Source Wallets
                </Typography>
                <Stack spacing={1.5}>
                    {routeDetails.map((wallet) => {
                        const shortAddress = `${wallet.wallet.slice(0, 6)}...${wallet.wallet.slice(-4)}`;

                        return (
                            <Accordion
                                key={wallet.wallet}
                                disableGutters
                                elevation={0}
                                defaultExpanded
                                sx={{
                                    background: "rgba(255, 255, 255, 0.04)",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    borderRadius: "12px !important",
                                    "&::before": { display: "none" },
                                    "&.Mui-expanded": { margin: 0 },
                                    overflow: "hidden",
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon sx={{ color: "#64748b" }} />}
                                    sx={{
                                        px: 2,
                                        py: 1,
                                        minHeight: "auto",
                                        "&.Mui-expanded": { minHeight: "auto" },
                                        "& .MuiAccordionSummary-content": {
                                            my: 1,
                                            "&.Mui-expanded": { my: 1 },
                                        },
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{ width: "100%" }}
                                        spacing={2}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <Box
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: "10px",
                                                    background: "linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <AccountBalanceWalletIcon sx={{ fontSize: 18, color: "#0ea5e9" }} />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, color: "#f1f5f9", fontSize: "14px" }}>
                                                    {wallet.walletName}
                                                </Typography>
                                                <Typography
                                                    component="code"
                                                    sx={{
                                                        fontSize: "12px",
                                                        color: "#64748b",
                                                        fontFamily: "var(--font-mono), monospace",
                                                    }}
                                                >
                                                    {shortAddress}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Typography sx={{ fontWeight: 700, color: "#f1f5f9", fontSize: "15px" }}>
                                            {formatCurrency(
                                                wallet.chains.reduce((acc, c) => {
                                                    const chainKey = CHAIN_ID_TO_KEY[c.id];
                                                    const fee = chainKey ? NETWORKS[chainKey as ChainKey].aproxFromFee : 0;
                                                    return acc + c.amount + fee;
                                                }, 0) + 0.01
                                            )}
                                        </Typography>
                                    </Stack>
                                </AccordionSummary>
                                <AccordionDetails
                                    sx={{
                                        px: 2,
                                        pb: 2,
                                        pt: 0,
                                        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                                    }}
                                >
                                    <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                                        {wallet.chains.map((r) => {
                                            const network = Object.values(NETWORKS).find(
                                                (n) => n.chain.id.toString() === r.id
                                            );
                                            const fee = (network?.aproxFromFee ?? 0) + 0.01;

                                            return (
                                                <Box
                                                    key={r.id}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: "10px",
                                                        background: "rgba(0, 0, 0, 0.2)",
                                                        border: "1px solid rgba(255, 255, 255, 0.06)",
                                                    }}
                                                >
                                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                                            <Box sx={{ display: "flex", "& svg": { width: 20, height: 20 } }}>
                                                                {r.icon}
                                                            </Box>
                                                            <Typography sx={{ fontWeight: 600, color: "#f1f5f9", fontSize: "14px" }}>
                                                                {r.label}
                                                            </Typography>
                                                        </Stack>
                                                        <Typography sx={{ fontWeight: 700, color: "#f1f5f9", fontSize: "14px" }}>
                                                            {formatCurrency(
                                                                r.amount +
                                                                    ((CHAIN_ID_TO_KEY[r.id]
                                                                        ? NETWORKS[CHAIN_ID_TO_KEY[r.id] as ChainKey].aproxFromFee
                                                                        : 0) || 0) +
                                                                    0.01
                                                            )}
                                                        </Typography>
                                                    </Stack>

                                                    {/* Status */}
                                                    <Stack direction="row" alignItems="center" spacing={1.5} mt={1.5}>
                                                        <Box
                                                            sx={{
                                                                px: 1.25,
                                                                py: 0.5,
                                                                borderRadius: "8px",
                                                                fontSize: "12px",
                                                                fontWeight: 600,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "6px",
                                                                background:
                                                                    r.status === "done"
                                                                        ? "rgba(16, 185, 129, 0.15)"
                                                                        : r.status === "error"
                                                                          ? "rgba(239, 68, 68, 0.15)"
                                                                          : "rgba(255, 255, 255, 0.08)",
                                                                color:
                                                                    r.status === "done"
                                                                        ? "#10b981"
                                                                        : r.status === "error"
                                                                          ? "#ef4444"
                                                                          : "#94a3b8",
                                                            }}
                                                        >
                                                            {STATUS_META[r.status]?.icon}
                                                            {STATUS_META[r.status]?.label}
                                                        </Box>

                                                        {r.message && (
                                                            <Typography sx={{ fontSize: "12px", color: "#64748b" }}>
                                                                {r.message}
                                                            </Typography>
                                                        )}
                                                    </Stack>

                                                    {/* Fee info */}
                                                    <Typography sx={{ mt: 1, fontSize: "12px", color: "#64748b" }}>
                                                        Est. fee: {formatCurrency(fee)}
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
            </Box>

            {/* Destination Summary */}
            <Box
                sx={{
                    p: 2,
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
            >
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={2}
                >
                    <Box>
                        <Typography sx={{ fontSize: "12px", color: "#64748b", mb: 0.5 }}>Destination</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ display: "flex", "& svg": { width: 22, height: 22 } }}>{selected?.icon}</Box>
                            <Typography sx={{ fontWeight: 600, color: "#f1f5f9", fontSize: "15px" }}>
                                {selected?.label || "Chain"}
                            </Typography>
                        </Stack>
                    </Box>

                    <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                        <Typography sx={{ fontSize: "12px", color: "#64748b", mb: 0.5 }}>Recipient receives</Typography>
                        <Typography
                            sx={{
                                fontWeight: 800,
                                color: "#10b981",
                                fontSize: "20px",
                            }}
                        >
                            {formatCurrency(routeSummary?.targetAmount ?? 0)}
                        </Typography>
                        <Typography sx={{ fontSize: "12px", color: "#64748b" }}>After estimated fees</Typography>
                    </Box>
                </Stack>
            </Box>
        </Stack>
    );
};
