import { Dialog, DialogContent } from "@mui/material";
import { useSendMoneyModal } from "@/app/dashboard/hooks/useSendMoneyModal";
import { SendMoneyModalHeader } from "./SendMoneyModalHeader";
import { SendMoneyModalForm } from "./SendMoneyModalForm";
import { SendMoneyModalRoute } from "./SendMoneyModalRoute";
import { SendMoneyModalActions } from "./SendMoneyModalActions";

export const SendMoneyModal = () => {
    const {
        sendLoading, control, handleSubmit, errors, handleOnSend, handleOnConfirm,
        canSend, routeDetails, selected, isOpen, setSendModal, routeReady, routeSummary, setValue,
        maxSendAmount, isExceedingMax
    } = useSendMoneyModal();

    return (
        <Dialog
            open={isOpen}
            onClose={() => setSendModal(false)}
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
                onClose={() => setSendModal(false)}
                disabled={sendLoading}
            />

            <DialogContent sx={{ px: 3, py: 3, background: "#ffffff" }}>
                {!routeReady ? (
                    <SendMoneyModalForm
                        control={control}
                        sendLoading={sendLoading}
                        errors={errors}
                        setValue={setValue}
                        maxSendAmount={maxSendAmount}
                        isExceedingMax={isExceedingMax}
                    />
                ) : (
                    <SendMoneyModalRoute
                        routeSummary={routeSummary}
                        routeDetails={routeDetails}
                        routeReady={routeReady}
                        selected={selected}
                    />
                )}
            </DialogContent>

            <SendMoneyModalActions
                onClose={() => setSendModal(false)}
                onAction={routeReady ? handleOnConfirm : handleSubmit(handleOnSend)}
                loading={sendLoading}
                disabled={!canSend}
                routeReady={routeReady}
            />
        </Dialog>
    );
};
