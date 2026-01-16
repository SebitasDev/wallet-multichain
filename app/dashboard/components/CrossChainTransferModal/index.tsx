"use client";

import React from "react";

import {
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    Stack,
    Box,
    Alert,
    Typography,
    IconButton,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SwapVertIcon from '@mui/icons-material/SwapVert';

import { usePrimaryTransfer, STELLAR_CHAIN_KEY } from "@/app/dashboard/hooks/transfer/usePrimaryTransfer";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { Controller } from "react-hook-form";
import { TransferHeader } from "./TransferHeader";
import { ChainSelector } from "./ChainSelector";
import { AmountInput } from "./AmountInput";
import { RecipientInput } from "./RecipientInput";
import { TransferSummary } from "./TransferSummary";
import { SubmitButton } from "./SubmitButton";
import { FacilitatorChainKey } from "@/app/facilitator";
import { TokenSelector } from "./TokenSelector";

const SOURCE_CHAIN_OPTIONS: (FacilitatorChainKey | typeof STELLAR_CHAIN_KEY)[] = Object.keys(NETWORKS) as (FacilitatorChainKey | typeof STELLAR_CHAIN_KEY)[];

const DESTINATION_CHAIN_OPTIONS: (FacilitatorChainKey | typeof STELLAR_CHAIN_KEY)[] = [
    ...SOURCE_CHAIN_OPTIONS
];

interface CrossChainTransferModalProps {
    trigger?: React.ReactElement;
}

export const CrossChainTransferModal = ({ trigger }: CrossChainTransferModalProps) => {
    const {
        open,
        address,
        isLoading,
        error,
        routeError,
        isDeployed,

        form: { control, setValue },
        watchAmount,
        watchDestChain,
        watchSourceChain, // Needed for TokenSelector
        watchSourceToken,
        watchDestToken, // unused directly in UI but good to have
        isCrossChain,
        isCCTPRoute,
        minAmount,
        isAmountValid,
        maxAmount,
        balance,
        isExceedingMax,

        total,
        fee,
        // Simulation
        simulation,
        simulateTransfer,

        openModal,
        closeModal,
        onSubmit,
        tokenPrice,
        destTokenPrice,
    } = usePrimaryTransfer();

    return (
        <>
            {trigger ? (
                React.cloneElement(trigger as React.ReactElement<{ onClick: () => void }>, { onClick: () => openModal() })
            ) : (
                <Button
                    variant="contained"
                    id="tour-bridge"
                    onClick={() => openModal()}
                    sx={{
                        background: "#00DC8C",
                        fontWeight: 800,
                        color: "white",
                        letterSpacing: "0.5px",
                        px: 3.4,
                        py: 1.5,
                        minHeight: 50,
                        borderRadius: 3,
                        textTransform: "none",
                        border: "3px solid #000000",
                        boxShadow: "4px 4px 0px #000000",
                        whiteSpace: "nowrap",
                        width: "100%",
                        minWidth: 0,
                        maxWidth: 240,
                        transition: "all 0.2s",
                        "&:hover": {
                            background: "#00CC7C",
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000",
                        },
                        "&:disabled": {
                            background: "#cccccc",
                            color: "#666666",
                            border: "3px solid #999999",
                            boxShadow: "none",
                            transform: "none",
                        },
                    }}
                >
                    Cross-Chain
                </Button>
            )}

            <Dialog
                open={open}
                onClose={closeModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: "hidden",
                        border: "3px solid #000000",
                        boxShadow: "8px 8px 0px #000000",
                        background: "#ffffff",
                    },
                }}
            >
                <TransferHeader onClose={closeModal} isLoading={isLoading} />

                <DialogContent sx={{ px: 3, py: 3, background: "#ffffff" }}>
                    <Stack spacing={2.5} mt={0.5}>
                        <Alert
                            severity="info"
                            sx={{
                                fontSize: "0.85rem",
                                border: "2px solid #3CD2FF",
                                borderRadius: 2,
                                bgcolor: "rgba(60, 210, 255, 0.1)",
                                color: "#000000",
                                fontWeight: 600,
                                "& .MuiAlert-icon": {
                                    color: "#3CD2FF"
                                }
                            }}
                        >
                            Este transfer usa un facilitador. firmas una
                            autorización (gasless) y el facilitador ejecuta la TX.
                        </Alert>

                        <Box position="relative">
                            <Stack spacing={3}>
                                <Stack spacing={1}>
                                    <Typography
                                        fontWeight={700}
                                        fontSize={13}
                                        sx={{
                                            textTransform: "uppercase",
                                            letterSpacing: 0.5,
                                            color: "#666666"
                                        }}
                                    >
                                        Chain y Token de Origen
                                    </Typography>
                                    <Stack direction="row" spacing={0}>
                                        <Box sx={{ flex: 1.5 }}>
                                            <ChainSelector
                                                label="Chain origen"
                                                name="sourceChain"
                                                control={control}
                                                options={SOURCE_CHAIN_OPTIONS}
                                                hideLabel
                                                inputSx={{
                                                    borderTopRightRadius: 0,
                                                    borderBottomRightRadius: 0,
                                                    borderRight: "none"
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <TokenSelector
                                                label="Token origen"
                                                name="sourceToken"
                                                control={control}
                                                chain={watchSourceChain}
                                                hideLabel
                                                inputSx={{
                                                    borderTopLeftRadius: 0,
                                                    borderBottomLeftRadius: 0
                                                }}
                                            />
                                        </Box>
                                    </Stack>
                                </Stack>

                                <Stack spacing={1}>
                                    <Typography
                                        fontWeight={700}
                                        fontSize={13}
                                        sx={{
                                            textTransform: "uppercase",
                                            letterSpacing: 0.5,
                                            color: "#666666"
                                        }}
                                    >
                                        Chain y Token de Destino
                                    </Typography>
                                    <Stack direction="row" spacing={0}>
                                        <Box sx={{ flex: 1.5 }}>
                                            <ChainSelector
                                                label="Chain destino"
                                                name="destChain"
                                                control={control}
                                                options={DESTINATION_CHAIN_OPTIONS}
                                                hideLabel
                                                inputSx={{
                                                    borderTopRightRadius: 0,
                                                    borderBottomRightRadius: 0,
                                                    borderRight: "none"
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <TokenSelector
                                                label="Token destino"
                                                name="destToken"
                                                control={control}
                                                chain={watchDestChain}
                                                hideLabel
                                                inputSx={{
                                                    borderTopLeftRadius: 0,
                                                    borderBottomLeftRadius: 0
                                                }}
                                            />
                                        </Box>
                                    </Stack>
                                </Stack>
                            </Stack>

                            <Box
                                sx={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    zIndex: 10,
                                    bgcolor: "background.paper",
                                    borderRadius: "50%",
                                    boxShadow: "0 0 0 4px #FFFFFF" // Mask the inputs behind button
                                }}
                            >
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
                                        border: "1px solid #e0e0e0",
                                        width: 32,
                                        height: 32,
                                        "&:hover": {
                                            bgcolor: "#f5f5f5",
                                            transform: "rotate(180deg)",
                                            transition: "all 0.3s ease"
                                        }
                                    }}
                                >
                                    <SwapVertIcon fontSize="small" sx={{ color: "#666" }} />
                                </IconButton>
                            </Box>
                        </Box>

                        <RecipientInput control={control} />

                        <AmountInput
                            control={control}
                            isCrossChain={isCrossChain}
                            minAmount={minAmount}
                            watchAmount={watchAmount}
                            isAmountValid={isAmountValid}
                            maxAmount={maxAmount}
                            isExceedingMax={isExceedingMax}
                            token={watchSourceToken} // Pass dynamic token
                            balance={balance} // Pass balance
                            tokenPrice={tokenPrice} // Pass price
                        />

                        <TransferSummary
                            watchAmount={watchAmount}
                            fee={fee}
                            total={total}
                            isCrossChain={isCrossChain}
                            token={watchSourceToken} // Pass dynamic token
                        />

                        {simulation.done && !simulation.error && (
                            <Alert
                                severity="success"
                                sx={{
                                    border: "2px solid #00DC8C",
                                    borderRadius: 2,
                                    bgcolor: "rgba(0, 220, 140, 0.1)",
                                    color: "#000000",
                                    fontWeight: 600,
                                    "& .MuiAlert-icon": {
                                        color: "#00DC8C"
                                    }
                                }}
                            >
                                Recibirás aproximadamente: <strong>{simulation.estimated} {watchDestToken}</strong>
                                {destTokenPrice && simulation.estimated && (
                                    <div style={{ fontWeight: 400, marginTop: "4px" }}>
                                        (≈ ${(() => {
                                            const val = parseFloat(simulation.estimated) * destTokenPrice;
                                            const str = val.toFixed(10); // High precision to avoid floating point issues before truncation
                                            const dot = str.indexOf('.');
                                            if (dot === -1) return val;
                                            // Take up to 6 decimals, no rounding
                                            return str.slice(0, dot + 7);
                                        })()} USD)
                                    </div>
                                )}
                            </Alert>
                        )}

                        {simulation.error && (
                            <Alert
                                severity="error"
                                sx={{
                                    border: "2px solid #ff4444",
                                    borderRadius: 2,
                                    bgcolor: "rgba(255, 68, 68, 0.1)",
                                    color: "#000000",
                                    fontWeight: 600,
                                    "& .MuiAlert-icon": {
                                        color: "#ff4444"
                                    }
                                }}
                            >
                                {simulation.error}
                            </Alert>
                        )}

                        {!isAmountValid && watchAmount && !isExceedingMax && (
                            <Alert
                                severity="warning"
                                sx={{
                                    border: "2px solid #FFA500",
                                    borderRadius: 2,
                                    bgcolor: "rgba(255, 165, 0, 0.1)",
                                    color: "#000000",
                                    fontWeight: 600,
                                    "& .MuiAlert-icon": {
                                        color: "#FFA500"
                                    }
                                }}
                            >
                                El monto debe ser al menos <strong>{minAmount} USDC</strong> para cubrir el fee del facilitador.
                            </Alert>
                        )}

                        {error && (
                            <Alert
                                severity="error"
                                sx={{
                                    border: "2px solid #ff4444",
                                    borderRadius: 2,
                                    bgcolor: "rgba(255, 68, 68, 0.1)",
                                    color: "#000000",
                                    fontWeight: 600,
                                    "& .MuiAlert-icon": {
                                        color: "#ff4444"
                                    }
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        {routeError && (
                            <Alert
                                severity="error"
                                sx={{
                                    border: "2px solid #ff4444",
                                    borderRadius: 2,
                                    bgcolor: "rgba(255, 68, 68, 0.1)",
                                    color: "#000000",
                                    fontWeight: 600,
                                    "& .MuiAlert-icon": {
                                        color: "#ff4444"
                                    }
                                }}
                            >
                                {routeError}
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 3, gap: 2, background: "#ffffff" }}>
                    <Button
                        onClick={closeModal}
                        disabled={isLoading || simulation.loading}
                        sx={{
                            flex: 1,
                            textTransform: "none",
                            borderRadius: 3,
                            py: 1.4,
                            fontWeight: 800,
                            fontSize: 15,
                            background: "#ffffff",
                            color: "#000000",
                            border: "3px solid #000000",
                            boxShadow: "4px 4px 0px #000000",
                            transition: "all 0.2s",
                            "&:hover": {
                                background: "#f5f5f5",
                                transform: "translate(2px, 2px)",
                                boxShadow: "2px 2px 0px #000000",
                            },
                            "&:disabled": {
                                opacity: 0.4,
                                cursor: "not-allowed"
                            },
                        }}
                    >
                        Cancelar
                    </Button>

                    {!simulation.done && isCrossChain && !isCCTPRoute ? (
                        <Button
                            variant="contained"
                            onClick={simulateTransfer}
                            disabled={!watchAmount || !isAmountValid || isExceedingMax || !!routeError || simulation.loading}
                            sx={{
                                flex: 1,
                                textTransform: "none",
                                borderRadius: 3,
                                py: 1.4,
                                fontWeight: 800,
                                fontSize: 15,
                                background: "#00DC8C",
                                color: "white",
                                border: "3px solid #000000",
                                boxShadow: "4px 4px 0px #000000",
                                transition: "all 0.2s",
                                "&:hover": {
                                    background: "#00CC7C",
                                    transform: "translate(2px, 2px)",
                                    boxShadow: "2px 2px 0px #000000",
                                },
                                "&:disabled": {
                                    background: "#cccccc",
                                    color: "#666666",
                                    border: "3px solid #999999",
                                    boxShadow: "none",
                                    transform: "none",
                                },
                            }}
                        >
                            {simulation.loading ? "Simulando..." : "Simular"}
                        </Button>
                    ) : (
                        <SubmitButton
                            onClick={onSubmit}
                            isLoading={isLoading}
                            isDisabled={isLoading || (isCrossChain && !isCCTPRoute && (!simulation.done || !!simulation.error)) || !watchAmount || !isAmountValid || isExceedingMax || !!routeError}
                        />
                    )}
                </DialogActions>
            </Dialog >
        </>
    );
};
