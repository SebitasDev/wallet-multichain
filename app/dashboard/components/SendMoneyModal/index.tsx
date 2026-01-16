import { Dialog, DialogContent, Typography, Box } from "@mui/material";
import { useState, useEffect } from "react";
import { useSecondaryTransfer } from "@/app/dashboard/hooks/transfer/useSecondaryTransfer";
import { SendMoneyModalHeader } from "./SendMoneyModalHeader";
import { SendMoneyModalForm } from "./SendMoneyModalForm";
import { SendMoneyModalRoute } from "./SendMoneyModalRoute";
import { SendMoneyModalActions } from "./SendMoneyModalActions";

export const SendMoneyModal = ({ variant = "default" }: { variant?: "default" | "simplified" }) => {
    const {
        sendLoading, control, handleSubmit, errors, handleOnSend, handleOnConfirm,
        canSend, routeDetails, selected, isOpen, setSendModal, routeReady, routeSummary, setValue,
        maxSendAmount, isExceedingMax, watch, setRouteSummary, wallets, priceMap
    } = useSecondaryTransfer();

    const [isEditing, setIsEditing] = useState(false);
    const [hasBlockingErrors, setHasBlockingErrors] = useState(false);

    const handleClose = () => {
        setSendModal(false);
        setIsEditing(false);
        setHasBlockingErrors(false);
    };

    const isProcessing = routeReady && routeDetails.some(w => w.chains.some(c => c.status !== 'idle' && c.status !== 'done' && c.status !== 'error'));

    const disabledReasons: string[] = [];
    if (!canSend) disabledReasons.push("Cannot Send (internal check)");
    if (routeReady) {
        if (!watch("sendPassword") || !watch("sendPassword")?.length) disabledReasons.push("Password Empty");
        if (isEditing) disabledReasons.push("Edit Mode Active");
        if (!routeSummary?.allocations?.length) disabledReasons.push("No Chains");
        if (hasBlockingErrors) disabledReasons.push("Blocking Simulation Error");
        if (isProcessing) disabledReasons.push("Processing Transaction");
    }



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
                disabled={sendLoading}
                variant={variant}
            />

            <DialogContent sx={{ px: 3, py: 3, background: "#ffffff" }}>
                {!routeReady ? (
                    <SendMoneyModalForm
                        control={control as any}
                        sendLoading={sendLoading}
                        errors={errors}
                        setValue={setValue}
                        watch={watch}
                        maxSendAmount={maxSendAmount}
                        isExceedingMax={isExceedingMax}
                        variant={variant}
                        sourceToken={watch("sourceToken") || "USDC"}
                    />
                ) : (
                    <SendMoneyModalRoute
                        routeSummary={routeSummary}
                        setRouteSummary={setRouteSummary}
                        routeDetails={routeDetails}
                        routeReady={routeReady}
                        selected={selected}
                        wallets={wallets}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        watch={watch}
                        control={control}
                        setValue={setValue}
                        setHasBlockingErrors={setHasBlockingErrors}
                        priceMap={priceMap}
                        password={watch("sendPassword") || ""}
                        setPassword={(val) => setValue("sendPassword", val, { shouldValidate: true, shouldDirty: true })}
                    />
                )}
            </DialogContent>

            <SendMoneyModalActions
                onClose={handleClose}
                onAction={routeReady ? handleOnConfirm : handleSubmit(handleOnSend as any)}
                loading={sendLoading}
                disabled={!canSend || (routeReady && ((!watch("sendPassword") || !watch("sendPassword")?.length) || isEditing || !routeSummary?.allocations?.length || hasBlockingErrors || isProcessing))}
                routeReady={routeReady}
            />
        </Dialog>
    );
};
