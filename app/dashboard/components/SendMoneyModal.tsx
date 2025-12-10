"use client";

import {
    Box,
    Button,
    Dialog,
    DialogContent,
    Typography,
    Stack,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
    stepConnectorClasses,
    styled,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useSendMoney } from "@/app/dashboard/hooks/useSendMoney";
import { FormSendMoney } from "@/app/dashboard/components/sendMoney/FormSendMoney";
import { FinishRoute } from "@/app/dashboard/components/sendMoney/FinishRoute";
import { useState, useEffect } from "react";

type Props = {
    walletNames?: Record<string, string>;
};

// Custom connector for the stepper
const CustomConnector = styled(StepConnector)(() => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 18,
    },
    [`& .${stepConnectorClasses.line}`]: {
        height: 2,
        border: 0,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 1,
    },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            background: "linear-gradient(90deg, #0ea5e9 0%, #8b5cf6 100%)",
        },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            background: "linear-gradient(90deg, #10b981 0%, #06b6d4 100%)",
        },
    },
}));

// Custom step icon
const CustomStepIcon = ({
    active,
    completed,
    icon,
}: {
    active: boolean;
    completed: boolean;
    icon: React.ReactNode;
}) => {
    return (
        <Box
            sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: completed
                    ? "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)"
                    : active
                      ? "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)"
                      : "rgba(255, 255, 255, 0.08)",
                border: completed || active ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: completed || active ? "0 4px 12px rgba(14, 165, 233, 0.3)" : "none",
                transition: "all 0.3s ease",
            }}
        >
            {completed ? (
                <CheckCircleIcon sx={{ fontSize: 20, color: "#fff" }} />
            ) : (
                <Typography
                    sx={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: active ? "#fff" : "#64748b",
                    }}
                >
                    {icon}
                </Typography>
            )}
        </Box>
    );
};

const steps = [
    { label: "Details", description: "Enter send info" },
    { label: "Review", description: "Confirm route" },
    { label: "Complete", description: "Transaction sent" },
];

export function SendMoneyModal({ walletNames }: Props) {
    const {
        sendLoading,
        control,
        handleSubmit,
        errors,
        handleOnSend,
        handleOnConfirm,
        canSend,
        routeDetails,
        selected,
        isOpen,
        setSendModal,
        routeReady,
        routeSummary,
    } = useSendMoney(walletNames);

    const [activeStep, setActiveStep] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    // Reset step when modal closes
    useEffect(() => {
        if (!isOpen) {
            setActiveStep(0);
            setIsComplete(false);
        }
    }, [isOpen]);

    // Move to review step when route is ready
    useEffect(() => {
        if (routeReady && activeStep === 0) {
            setActiveStep(1);
        }
    }, [routeReady, activeStep]);

    const handleClose = () => {
        setSendModal(false);
    };

    const handleBack = () => {
        setActiveStep(0);
    };

    const handleConfirmAndComplete = async () => {
        await handleOnConfirm();
        setActiveStep(2);
        setIsComplete(true);
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "20px",
                    overflow: "hidden",
                    background: "linear-gradient(145deg, #0f1729 0%, #131c2d 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 32px 64px rgba(0, 0, 0, 0.5)",
                },
            }}
            slotProps={{
                backdrop: {
                    sx: {
                        backdropFilter: "blur(8px)",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                    },
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    {activeStep === 1 && !isComplete && (
                        <IconButton
                            onClick={handleBack}
                            sx={{
                                color: "#64748b",
                                mr: 0.5,
                                "&:hover": { color: "#f1f5f9", background: "rgba(255,255,255,0.08)" },
                            }}
                        >
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                    )}
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "10px",
                            background: isComplete
                                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)"
                                : "linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {isComplete ? (
                            <CheckCircleIcon sx={{ color: "#10b981", fontSize: 22 }} />
                        ) : (
                            <SendIcon sx={{ color: "#0ea5e9", fontSize: 22 }} />
                        )}
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "17px", color: "#f1f5f9" }}>
                            {isComplete ? "Transaction Sent" : "Send Funds"}
                        </Typography>
                        <Typography sx={{ fontSize: "13px", color: "#64748b" }}>
                            {isComplete
                                ? "Your transfer is processing"
                                : steps[activeStep].description}
                        </Typography>
                    </Box>
                </Stack>
                <IconButton
                    onClick={handleClose}
                    sx={{
                        color: "#64748b",
                        "&:hover": { color: "#f1f5f9", background: "rgba(255,255,255,0.08)" },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Progress Stepper */}
            <Box sx={{ px: 3, py: 2, borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <Stepper
                    activeStep={activeStep}
                    alternativeLabel
                    connector={<CustomConnector />}
                >
                    {steps.map((step, index) => (
                        <Step key={step.label} completed={index < activeStep}>
                            <StepLabel
                                StepIconComponent={(props) => (
                                    <CustomStepIcon
                                        active={props.active || false}
                                        completed={props.completed || false}
                                        icon={index + 1}
                                    />
                                )}
                            >
                                <Typography
                                    sx={{
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color:
                                            index <= activeStep ? "#f1f5f9" : "#64748b",
                                        mt: 0.5,
                                    }}
                                >
                                    {step.label}
                                </Typography>
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            <DialogContent sx={{ px: 3, py: 3 }}>
                {/* Step 1: Form */}
                {activeStep === 0 && (
                    <FormSendMoney
                        control={control}
                        sendLoading={sendLoading}
                        errors={errors}
                    />
                )}

                {/* Step 2: Review */}
                {activeStep === 1 && !isComplete && (
                    <FinishRoute
                        routeSummary={routeSummary}
                        routeDetails={routeDetails}
                        routeReady={routeReady}
                        selected={selected}
                    />
                )}

                {/* Step 3: Complete */}
                {isComplete && (
                    <Box
                        sx={{
                            textAlign: "center",
                            py: 4,
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: "20px",
                                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 3,
                            }}
                        >
                            <CheckCircleIcon sx={{ fontSize: 48, color: "#10b981" }} />
                        </Box>
                        <Typography
                            sx={{
                                fontSize: "24px",
                                fontWeight: 800,
                                color: "#f1f5f9",
                                mb: 1,
                            }}
                        >
                            Transaction Submitted
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: "14px",
                                color: "#94a3b8",
                                mb: 3,
                                maxWidth: 320,
                                mx: "auto",
                            }}
                        >
                            Your cross-chain transfer is being processed. You can track its progress in the Activity tab.
                        </Typography>

                        {/* Transaction Summary */}
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: "12px",
                                background: "rgba(255, 255, 255, 0.04)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                textAlign: "left",
                            }}
                        >
                            <Stack spacing={1.5}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography sx={{ fontSize: "13px", color: "#64748b" }}>
                                        Amount
                                    </Typography>
                                    <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>
                                        ${routeSummary?.targetAmount?.toFixed(2) ?? "0.00"} USDC
                                    </Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography sx={{ fontSize: "13px", color: "#64748b" }}>
                                        Destination
                                    </Typography>
                                    <Stack direction="row" alignItems="center" spacing={0.75}>
                                        <Box sx={{ display: "flex", "& svg": { width: 16, height: 16 } }}>
                                            {selected?.icon}
                                        </Box>
                                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>
                                            {selected?.label}
                                        </Typography>
                                    </Stack>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography sx={{ fontSize: "13px", color: "#64748b" }}>
                                        Status
                                    </Typography>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                background: "#10b981",
                                                animation: "pulse 2s infinite",
                                            }}
                                        />
                                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#10b981" }}>
                                            Processing
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            {/* Action Buttons */}
            <Box
                sx={{
                    px: 3,
                    py: 2.5,
                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    gap: 1.5,
                    justifyContent: "flex-end",
                }}
            >
                {!isComplete && (
                    <Button
                        onClick={handleClose}
                        sx={{
                            textTransform: "none",
                            px: 2.5,
                            py: 1,
                            borderRadius: "10px",
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "#94a3b8",
                            "&:hover": { background: "rgba(255, 255, 255, 0.08)" },
                        }}
                    >
                        Cancel
                    </Button>
                )}

                {activeStep === 0 && (
                    <Button
                        variant="contained"
                        disabled={!canSend || sendLoading}
                        onClick={handleSubmit(handleOnSend)}
                        sx={{
                            textTransform: "none",
                            px: 3,
                            py: 1,
                            borderRadius: "10px",
                            fontWeight: 700,
                            fontSize: "14px",
                            background: "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
                            boxShadow: "0 4px 16px rgba(14, 165, 233, 0.35)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)",
                            },
                            "&:disabled": {
                                background: "rgba(255, 255, 255, 0.1)",
                                color: "rgba(255, 255, 255, 0.4)",
                            },
                        }}
                    >
                        {sendLoading ? "Finding route..." : "Continue"}
                    </Button>
                )}

                {activeStep === 1 && !isComplete && (
                    <Button
                        variant="contained"
                        disabled={sendLoading}
                        onClick={handleConfirmAndComplete}
                        sx={{
                            textTransform: "none",
                            px: 3,
                            py: 1,
                            borderRadius: "10px",
                            fontWeight: 700,
                            fontSize: "14px",
                            background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
                            boxShadow: "0 4px 16px rgba(16, 185, 129, 0.35)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #059669 0%, #0891b2 100%)",
                            },
                            "&:disabled": {
                                background: "rgba(255, 255, 255, 0.1)",
                                color: "rgba(255, 255, 255, 0.4)",
                            },
                        }}
                    >
                        {sendLoading ? "Processing..." : "Confirm & Send"}
                    </Button>
                )}

                {isComplete && (
                    <Button
                        variant="contained"
                        onClick={handleClose}
                        sx={{
                            textTransform: "none",
                            px: 3,
                            py: 1,
                            borderRadius: "10px",
                            fontWeight: 700,
                            fontSize: "14px",
                            background: "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
                            boxShadow: "0 4px 16px rgba(14, 165, 233, 0.35)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)",
                            },
                        }}
                    >
                        Done
                    </Button>
                )}
            </Box>
        </Dialog>
    );
}
