import { Dialog, DialogContent } from "@mui/material";
import { useEffect } from "react";
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore";
import { SendMoneyModalHeader } from "./SendMoneyModalHeader";
import { SendMoneyModalForm } from "./SendMoneyModalForm";
import { SendMoneyModalActions } from "./SendMoneyModalActions";
import { useCrossChainTransfer } from "@/app/dashboard/hooks/transfer/useCrossChainTransfer";

export const SendMoneyModal = ({ variant = "default" }: { variant?: "default" | "simplified" }) => {
    const { isOpen, setSendModal, initialChain } = useSendMoneyStore(); // State from Send Store

    // Use the existing hook as requested
    const {
        form,
        isLoading,
        simulation,
        simulateTransfer,
        onSubmit, // This is handleSubmit(onSubmit)
        maxAmount,
        isExceedingMax,
        watchDestChain,
        watchAmount,
        routeError,
        isAmountValid,
        tokenPrice // [NEW] Get token price
    } = useCrossChainTransfer();

    const { watch, setValue, formState: { isSubmitSuccessful, errors }, control } = form;

    const handleClose = () => {
        setSendModal(false);
        form.reset();
    };

    // Close modal on successful submit
    useEffect(() => {
        if (isSubmitSuccessful) {
            handleClose();
        }
    }, [isSubmitSuccessful]);

    // Handle initial chain from Store (e.g. from AssetModal)
    useEffect(() => {
        if (isOpen && initialChain) {
            setValue("destChain", initialChain as any);
            setValue("sourceChain", initialChain as any); // Force Source = Dest for Send
        }
    }, [isOpen, initialChain, setValue]);

    // Force Source = Dest when Dest changes (Simple Send behavior)
    useEffect(() => {
        if (watchDestChain) {
            setValue("sourceChain", watchDestChain);
        }
    }, [watchDestChain, setValue]);

    // Logic for Action Button (Simulate -> Confirm)
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
            maxWidth={variant === "simplified" ? "xs" : "sm"}
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
                variant={variant}
            />

            <DialogContent sx={{ px: 3, py: 3, background: "#ffffff" }}>
                <SendMoneyModalForm
                    control={control as any}
                    sendLoading={isProcessing}
                    errors={errors as any}
                    setValue={setValue as any}
                    watch={watch as any}
                    maxSendAmount={maxAmount}
                    isExceedingMax={isExceedingMax}
                    variant={variant}
                    tokenPrice={tokenPrice} // [NEW] Pass token price
                />
            </DialogContent>

            <SendMoneyModalActions
                onClose={handleClose}
                onAction={handleAction}
                loading={isProcessing}
                disabled={!canSubmit}
                routeReady={isSameChain || (simulation.done && !simulation.error)} // Skip simulation check for same chain
            />
        </Dialog>
    );
};
