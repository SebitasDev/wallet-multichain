"use client";

import React, { useEffect } from "react";
import {
    Dialog,
    DialogContent,
    Stack,
    Box,
    Typography,
    Button,
    IconButton,
    CircularProgress,
    Alert,
    Switch // [NEW]
} from "@mui/material";
import { Close, ArrowDownward } from "@mui/icons-material";
import { useCrossChainTransfer, STELLAR_CHAIN_KEY } from "@/app/dashboard/hooks/transfer/useCrossChainTransfer";
import { ChainSelector } from "@/app/dashboard/components/CrossChainTransferModal/ChainSelector";
import { TokenSelector } from "@/app/dashboard/components/CrossChainTransferModal/TokenSelector";
import { AmountInput } from "@/app/dashboard/components/CrossChainTransferModal/AmountInput";
import { SubmitButton } from "@/app/dashboard/components/CrossChainTransferModal/SubmitButton";
import { RecipientInput } from "@/app/dashboard/components/CrossChainTransferModal/RecipientInput"; // [NEW]
import { FacilitatorChainKey } from "@/app/facilitator";
import { NETWORKS } from "@/app/constants/chainsInformation";

const SOURCE_CHAIN_OPTIONS: (FacilitatorChainKey | typeof STELLAR_CHAIN_KEY)[] = Object.keys(NETWORKS) as (FacilitatorChainKey | typeof STELLAR_CHAIN_KEY)[];
const DESTINATION_CHAIN_OPTIONS: (FacilitatorChainKey | typeof STELLAR_CHAIN_KEY)[] = [...SOURCE_CHAIN_OPTIONS];

interface SimpleSwapModalProps {
    trigger?: React.ReactElement;
}

export const SimpleSwapModal = ({ trigger }: SimpleSwapModalProps) => {
    const {
        open,
        address,
        isLoading, // combined loading
        form: { control, setValue },
        watchAmount,
        watchSourceChain,
        watchDestChain,
        watchSourceToken,
        watchDestToken,
        isCrossChain,
        isCCTPRoute,
        isExceedingMax,
        isAmountValid,
        maxAmount,
        minAmount,
        balance,
        fee,
        total,
        simulation,
        simulateTransfer,
        openModal,
        closeModal,
        onSubmit: originalOnSubmit,
        tokenPrice,
        destTokenPrice,
        routeError,
        error // Generic error
    } = useCrossChainTransfer();

    // Custom recipient state
    const [isCustomRecipient, setIsCustomRecipient] = React.useState(false);

    // Auto-fill recipient with self address logic
    useEffect(() => {
        if (!isCustomRecipient && open && address) {
            setValue("recipient", address);
        } else if (isCustomRecipient && open) {
            // When switching to custom, maybe clear it or keep it?
            // Better to clear if it was equal to address, or keep if user typed.
            // For simplicity, let's just leave it, user can edit.
            // If checking specifically:
            // setValue("recipient", ""); // Optional: clear on toggle on
        }
    }, [open, address, setValue, isCustomRecipient]);

    // Enhanced Submit: Logic to handle Simular -> Submit seamlessly
    // For non-crypto users, "Swap" should just work.
    // If not simulated, we simulate first? Or we show "Swap" which triggers simulate, then changes to "Confirm"?
    // Image 1 logic: "Simular" -> "Enviar".
    // We will keep this flow but make it clearer.
    const isReadyToSimulate = (!simulation.done || !!simulation.error) && isCrossChain && !isCCTPRoute && !!watchAmount && isAmountValid && !isExceedingMax && !routeError;
    const isReadyToSubmit = !isLoading && (
        !isCrossChain ||
        isCCTPRoute ||
        (simulation.done && !simulation.error)
    ) && !!watchAmount && isAmountValid && !isExceedingMax && !routeError;

    // We can auto-simulate with a debouncer if we wanted, but sticking to "Same Logic" means manual button or explicit step.
    // We'll use a single button that changes text/action.

    const handleAction = () => {
        if (isReadyToSimulate) {
            simulateTransfer();
        } else {
            originalOnSubmit();
        }
    };

    return (
        <>
            {trigger ? (
                React.cloneElement(trigger as React.ReactElement<{ onClick: () => void }>, { onClick: openModal })
            ) : null}

            <Dialog
                open={open}
                onClose={closeModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        border: "3px solid #000000",
                        boxShadow: "8px 8px 0px #000000",
                        background: "#ffffff",
                        overflow: "hidden"
                    },
                }}
            >
                {/* Simple Header */}
                <Box
                    sx={{
                        p: 2,
                        pb: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid #f0f0f0"
                    }}
                >
                    <Typography variant="h6" fontWeight={800}>
                        Swap
                    </Typography>
                    <IconButton
                        onClick={closeModal}
                        size="small"
                        sx={{
                            color: "black",
                            "&:hover": { bgcolor: "#f5f5f5" }
                        }}
                    >
                        <Close />
                    </IconButton>
                </Box>

                <DialogContent sx={{ px: 2, py: 1 }}>
                    <Stack spacing={1}>

                        {/* FROM SECTION */}
                        <Box
                            sx={{
                                p: 1.5,
                                borderRadius: 3,
                                bgcolor: "#f3f4f6", // Gray-100
                                border: "1px solid #e5e7eb",
                                transition: "all 0.2s",
                                "&:hover": {
                                    borderColor: "#d1d5db",
                                    bgcolor: "#f0f2f5"
                                }
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                <Typography fontSize={10} fontWeight={800} color="#666" letterSpacing={0.5}>
                                    DESDE
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={0.5} mb={1}>
                                <Box flex={1}>
                                    <ChainSelector
                                        label="Red"
                                        name="sourceChain"
                                        control={control}
                                        options={SOURCE_CHAIN_OPTIONS}
                                        hideLabel
                                        inputSx={{
                                            bgcolor: "white",
                                            borderRadius: 2,
                                            boxShadow: "0px 2px 0px #e5e7eb",
                                            "& .MuiSelect-select": { py: 0.8, px: 1, display: 'flex', alignItems: 'center' }
                                        }}
                                    />
                                </Box>
                                <Box flex={1}>
                                    <TokenSelector
                                        label="Token"
                                        name="sourceToken"
                                        control={control}
                                        chain={watchSourceChain}
                                        hideLabel
                                        inputSx={{
                                            bgcolor: "white",
                                            borderRadius: 2,
                                            boxShadow: "0px 2px 0px #e5e7eb",
                                            "& .MuiSelect-select": { py: 0.8, px: 1, display: 'flex', alignItems: 'center' }
                                        }}
                                    />
                                </Box>
                            </Stack>

                            <AmountInput
                                control={control}
                                isCrossChain={isCrossChain}
                                minAmount={minAmount}
                                watchAmount={watchAmount}
                                isAmountValid={isAmountValid}
                                maxAmount={maxAmount}
                                isExceedingMax={isExceedingMax}
                                token={watchSourceToken}
                                balance={balance}
                                tokenPrice={tokenPrice}
                            />
                        </Box>

                        {/* ARROW */}
                        {/* SWAP BUTTON */}
                        <Box display="flex" justifyContent="center" my={{ xs: -3, sm: -2.5 }} sx={{ position: "relative", zIndex: 10 }}>
                            <IconButton
                                onClick={() => {
                                    const currentSource = watchSourceChain;
                                    const currentDest = watchDestChain;
                                    const currentSourceToken = watchSourceToken;
                                    const currentDestToken = watchDestToken;

                                    setValue("sourceChain", currentDest);
                                    setValue("destChain", currentSource);
                                    setValue("sourceToken", currentDestToken);
                                    setValue("destToken", currentSourceToken);
                                }}
                                sx={{
                                    bgcolor: "white",
                                    border: "2px solid #000000",
                                    color: "black",
                                    width: { xs: 34, sm: 36 },
                                    height: { xs: 34, sm: 36 },
                                    boxShadow: "0px 3px 0px rgba(0,0,0,0.1)",
                                    "&:hover": {
                                        bgcolor: "#facc15", // yellow pop
                                        transform: "rotate(180deg) scale(1.05)",
                                        boxShadow: "0px 5px 0px rgba(0,0,0,0.15)",
                                    },
                                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                                }}
                            >
                                <ArrowDownward fontSize="small" sx={{ stroke: "#000", strokeWidth: 1, fontSize: { xs: "1.1rem", sm: "1.2rem" } }} />
                            </IconButton>
                        </Box>

                        {/* TO SECTION */}
                        <Box
                            sx={{
                                p: 1.5,
                                borderRadius: 3,
                                bgcolor: "#f3f4f6", // Gray-100
                                border: "1px solid #e5e7eb",
                                transition: "all 0.2s",
                                "&:hover": {
                                    borderColor: "#d1d5db",
                                    bgcolor: "#f0f2f5"
                                }
                            }}
                        >
                            <Typography fontSize={10} fontWeight={800} color="#666" letterSpacing={0.5} mb={0.5}>
                                HACIA
                            </Typography>
                            <Stack direction="row" spacing={0.5} mb={1}>
                                <Box flex={1}>
                                    <ChainSelector
                                        label="Red"
                                        name="destChain"
                                        control={control}
                                        options={DESTINATION_CHAIN_OPTIONS}
                                        hideLabel
                                        inputSx={{
                                            bgcolor: "white",
                                            borderRadius: 2,
                                            boxShadow: "0px 2px 0px #e5e7eb",
                                            "& .MuiSelect-select": { py: 0.8, px: 1, display: 'flex', alignItems: 'center' }
                                        }}
                                    />
                                </Box>
                                <Box flex={1}>
                                    <TokenSelector
                                        label="Token"
                                        name="destToken"
                                        control={control}
                                        chain={watchDestChain}
                                        hideLabel
                                        inputSx={{
                                            bgcolor: "white",
                                            borderRadius: 2,
                                            boxShadow: "0px 2px 0px #e5e7eb",
                                            "& .MuiSelect-select": { py: 0.8, px: 1, display: 'flex', alignItems: 'center' }
                                        }}
                                    />
                                </Box>
                            </Stack>

                            {/* Estimated Receipt / Loading State */}
                            <Box
                                sx={{
                                    bgcolor: "white",
                                    p: 1,
                                    borderRadius: 2,
                                    border: "1px solid #e5e7eb",
                                    minHeight: 44,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    boxShadow: "inset 0px 2px 4px rgba(0,0,0,0.02)"
                                }}
                            >
                                <Typography fontWeight={700} fontSize={13} color="#666">
                                    Recibes (est):
                                </Typography>
                                <Box textAlign="right">
                                    {simulation.loading ? (
                                        <CircularProgress size={16} thickness={5} sx={{ color: "#00DC8C" }} />
                                    ) : (
                                        <Stack alignItems="flex-end">
                                            <Typography fontWeight={800} fontSize={16} sx={{ letterSpacing: -0.5 }}>
                                                {simulation.done ? simulation.estimated : "---"}
                                            </Typography>
                                            {simulation.done && destTokenPrice && simulation.estimated && (
                                                <Typography fontSize={10} color="#888" fontWeight={600}>
                                                    ≈ ${(() => {
                                                        const val = parseFloat(simulation.estimated) * destTokenPrice;
                                                        return val.toLocaleString("en-US", { style: 'decimal', maximumFractionDigits: 2 });
                                                    })()} USD
                                                </Typography>
                                            )}
                                        </Stack>
                                    )}
                                </Box>
                            </Box>
                        </Box>

                        {/* Optional Recipient Toggle */}
                        <Box sx={{ px: 1 }}>
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                mb={isCustomRecipient ? 1.5 : 0}
                                sx={{
                                    cursor: "pointer",
                                    "&:hover": { opacity: 0.8 }
                                }}
                                onClick={() => setIsCustomRecipient(!isCustomRecipient)}
                            >
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Box
                                        sx={{
                                            width: 6, height: 6, borderRadius: "50%",
                                            bgcolor: isCustomRecipient ? "#00DC8C" : "#d1d5db"
                                        }}
                                    />
                                    <Typography fontSize={11} fontWeight={700} color={isCustomRecipient ? "black" : "#666"}>
                                        ENVIAR A OTRA DIRECCIÓN
                                    </Typography>
                                </Stack>
                                <Switch
                                    checked={isCustomRecipient}
                                    onChange={(e) => setIsCustomRecipient(e.target.checked)}
                                    size="small"
                                    sx={{
                                        transform: "scale(0.8)",
                                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#00DC8C" },
                                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#00DC8C" },
                                    }}
                                />
                            </Box>

                            {/* Animated collapse for input */}
                            {isCustomRecipient && (
                                <Box
                                    sx={{
                                        mt: 0.5,
                                        animation: "fadeIn 0.2s ease-in-out",
                                        "@keyframes fadeIn": {
                                            "0%": { opacity: 0, transform: "translateY(-5px)" },
                                            "100%": { opacity: 1, transform: "translateY(0)" }
                                        }
                                    }}
                                >
                                    <RecipientInput control={control} />
                                    <Typography fontSize={10} color="#888" mt={0.5} ml={1}>
                                        Asegúrate que la dirección soporte la red de destino.
                                    </Typography>
                                </Box>
                            )}
                        </Box>


                        {/* Errors / Warnings */}
                        <Stack spacing={1}>
                            {error && (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                            )}
                            {routeError && (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>{routeError}</Alert>
                            )}
                            {simulation.error && (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>{simulation.error}</Alert>
                            )}
                        </Stack>

                        {/* Action Buttons */}
                        <Button
                            onClick={handleAction}
                            disabled={
                                !watchAmount ||
                                !isAmountValid ||
                                isExceedingMax ||
                                !!routeError ||
                                isLoading ||
                                simulation.loading
                            }
                            fullWidth
                            sx={{
                                background: "#00DC8C",
                                color: "white",
                                fontWeight: 800,
                                fontSize: { xs: 14, sm: 16 }, // Responsive font size
                                py: { xs: 1.2, sm: 1.5 },     // Responsive padding
                                borderRadius: 3,
                                textTransform: "none",
                                border: "3px solid #000000",
                                boxShadow: "3px 3px 0px #000000",
                                transition: "all 0.2s",
                                "&:hover": {
                                    background: "#00cc7d",
                                    transform: "translate(1px, 1px)",
                                    boxShadow: "2px 2px 0px #000000",
                                },
                                "&:disabled": {
                                    background: "#e5e7eb",
                                    color: "#9ca3af",
                                    border: "3px solid #d1d5db",
                                    boxShadow: "none",
                                    transform: "none"
                                }
                            }}
                        >
                            {isLoading || simulation.loading ? (
                                "Procesando..."
                            ) : isReadyToSimulate ? (
                                "Cotizar Swap"
                            ) : (
                                "Confirmar Swap"
                            )}
                        </Button>

                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
};
