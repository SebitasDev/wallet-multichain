
import { Dialog, DialogContent } from "@mui/material";
import { useEffect } from "react";
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore";
import { SendMoneyModalHeader } from "@/app/dashboard/components/SendMoneyModal/SendMoneyModalHeader";
import { SendMoneyModalActions } from "@/app/dashboard/components/SendMoneyModal/SendMoneyModalActions";
import { useCommonCrossChainTransfer } from "../hooks/useCommonCrossChainTransfer";
import { CommonCrossChainModalForm } from "./CommonCrossChainModalForm";

export const CommonCrossChainModal = () => {
    // 1. New Hook Logic (Cross-Chain Enabled)
    const {
        isOpen,
        form,
        isLoading,
        simulation,
        simulateTransfer,
        onSubmit,
        maxAmount,
        isExceedingMax,
        watchDestChain,
        watchSourceChain,
        watchAmount,
        routeError,
        isAmountValid,
        tokenPrice
    } = useCommonCrossChainTransfer();

    const { setSendModal } = useSendMoneyStore();
    const { watch, setValue, formState: { isSubmitSuccessful, errors }, control } = form;

    const handleClose = () => {
        setSendModal(false);
        form.reset();
    };

    // Close on success
    useEffect(() => {
        if (isSubmitSuccessful) {
            handleClose();
        }
    }, [isSubmitSuccessful]);


    // Cross-Chain Logic Check
    const isSameChain = watch("sourceChain") === watch("destChain");
    const isReadyToSimulate = (!simulation.done || !!simulation.error) && !!watchAmount && isAmountValid && !isExceedingMax && !routeError;

    const handleAction = () => {
        if (isSameChain) {
            onSubmit();
            return;
        }

        if (isReadyToSimulate) {
            simulateTransfer();
        } else {
            onSubmit();
        }
    };

    const isProcessing = isLoading || simulation.loading;
    const canSubmit = !!watchAmount && isAmountValid && !isExceedingMax && !routeError && !isProcessing;

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="xs"
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
            <SendMoneyModalHeader
                onClose={handleClose}
                disabled={isProcessing}
                variant="simplified"
            />

            <DialogContent sx={{ px: 3, py: 3, background: "#ffffff" }}>
                <CommonCrossChainModalForm
                    control={control}
                    sendLoading={isProcessing}
                    errors={errors}
                    setValue={setValue}
                    watch={watch}
                    maxSendAmount={maxAmount}
                    isExceedingMax={isExceedingMax}
                    tokenPrice={tokenPrice}
                />
            </DialogContent>

            <SendMoneyModalActions
                onClose={handleClose}
                onAction={handleAction}
                loading={isProcessing}
                disabled={!canSubmit}
                routeReady={isSameChain || (simulation.done && !simulation.error)}
            />
        </Dialog>
    );
};
