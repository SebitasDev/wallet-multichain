"use client";

import {
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    Stack,
    Box,
    Alert,
} from "@mui/material";

import { useCrossChainTransfer, STELLAR_CHAIN_KEY } from "@/app/dashboard/hooks/useCrossChainTransfer";
import { TransferHeader } from "./TransferHeader";
import { ChainSelector } from "./ChainSelector";
import { AmountInput } from "./AmountInput";
import { RecipientInput } from "./RecipientInput";
import { TransferSummary } from "./TransferSummary";
import { SubmitButton } from "./SubmitButton";
import { FacilitatorChainKey } from "@/app/facilitator";

const SOURCE_CHAIN_OPTIONS: FacilitatorChainKey[] = [
    "Base",
    "Polygon",
    "Arbitrum",
    "Optimism",
    "Unichain",
];

const DESTINATION_CHAIN_OPTIONS: (FacilitatorChainKey | typeof STELLAR_CHAIN_KEY)[] = [
    ...SOURCE_CHAIN_OPTIONS,
    STELLAR_CHAIN_KEY
];

export const CrossChainTransferModal = () => {
    const {
        open,
        address,
        privateKey,
        provider,
        isLoading,
        error,

        form: { control },
        watchAmount,
        watchDestChain,
        isCrossChain,
        minAmount,
        isAmountValid,

        fee,
        total,

        openModal,
        closeModal,
        onSubmit,
    } = useCrossChainTransfer();

    return (
        <>
            <Button
                variant="contained"
                onClick={openModal}
                disabled={!address || (!privateKey && !provider)}
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

                        <ChainSelector
                            label="Chain origen"
                            name="sourceChain"
                            control={control}
                            options={SOURCE_CHAIN_OPTIONS}
                        />

                        <ChainSelector
                            label="Chain destino"
                            name="destChain"
                            control={control}
                            options={DESTINATION_CHAIN_OPTIONS}
                        />

                        <RecipientInput control={control} />

                        <AmountInput
                            control={control}
                            isCrossChain={isCrossChain}
                            minAmount={minAmount}
                            watchAmount={watchAmount}
                            isAmountValid={isAmountValid}
                        />

                        <TransferSummary
                            watchAmount={watchAmount}
                            fee={fee}
                            total={total}
                            isCrossChain={isCrossChain}
                        />

                        {!isAmountValid && watchAmount && (
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
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 3, gap: 2, background: "#ffffff" }}>
                    <Button
                        onClick={closeModal}
                        disabled={isLoading}
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
                            },
                        }}
                    >
                        Cancelar
                    </Button>

                    <SubmitButton
                        onClick={onSubmit}
                        isLoading={isLoading}
                        isDisabled={isLoading || !watchAmount || !isAmountValid}
                    />
                </DialogActions>
            </Dialog>
        </>
    );
};
