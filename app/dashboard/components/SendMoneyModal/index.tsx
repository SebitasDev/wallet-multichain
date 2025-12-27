import { Dialog, DialogContent } from "@mui/material";
import { useState } from "react";
import { useSendMoneyModal } from "@/app/dashboard/hooks/transfer/useSendMoneyModal";
import { SendMoneyModalHeader } from "./SendMoneyModalHeader";
import { SendMoneyModalForm } from "./SendMoneyModalForm";
import { SendMoneyModalRoute } from "./SendMoneyModalRoute";
import { SendMoneyModalActions } from "./SendMoneyModalActions";

export const SendMoneyModal = () => {
    const {
        sendLoading, control, handleSubmit, errors, handleOnSend, handleOnConfirm,
        canSend, routeDetails, selected, isOpen, setSendModal, routeReady, routeSummary, setValue,
        maxSendAmount, isExceedingMax, watch, setRouteSummary, wallets
    } = useSendMoneyModal();

    const [isEditing, setIsEditing] = useState(false);
    const [simulationErrors, setSimulationErrors] = useState<Record<string, boolean>>({}); // [NEW] Track blocking errors

    const handleClose = () => {
        setSendModal(false);
        setIsEditing(false);
        setSimulationErrors({}); // Reset on close
    };

    const hasBlockingErrors = Object.values(simulationErrors).some(Boolean);

    // DEBUG: Log disabled state reasons
    const isProcessing = routeReady && routeDetails.some(w => w.chains.some(c => c.status !== 'idle' && c.status !== 'done' && c.status !== 'error'));
    if (isOpen) {
        console.log("[SendMoneyModal] Debug Disabled State:", {
            canSend,
            routeReady,
            isEditing,
            hasBlockingErrors,
            simulationErrors,
            isProcessing,
            allocationsLength: routeSummary?.allocations?.length,
            sendAmount: watch("sendAmount"),
            passwordFilled: !!watch("sendPassword"),
            isExceedingMax
        });
    }

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
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
            <SendMoneyModalHeader
                onClose={handleClose}
                disabled={sendLoading}
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
                        setSimulationError={(id, hasError) => setSimulationErrors(prev => ({ ...prev, [id]: hasError }))} // [NEW]
                    />
                )}
            </DialogContent>

            <SendMoneyModalActions
                onClose={handleClose}
                onAction={routeReady ? handleOnConfirm : handleSubmit(handleOnSend as any)}
                loading={sendLoading}
                disabled={!canSend || (routeReady && (isEditing || !routeSummary?.allocations?.length || hasBlockingErrors || routeDetails.some(w => w.chains.some(c => c.status !== 'idle' && c.status !== 'done' && c.status !== 'error'))))} // [NEW] Disable if processing (not idle/done/error)
                routeReady={routeReady}
            />
        </Dialog>
    );
};
