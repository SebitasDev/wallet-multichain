import { Dialog, DialogContent } from "@mui/material";
import { useSendMoneyMainWallet } from "@/app/dashboard/hooks/transfer/useSendMoneyMainWallet";
import { SendMoneyTrigger } from "./SendMoneyTrigger";
import { SendMoneyModalHeader } from "./SendMoneyModalHeader";
import { SendMoneyModalForm } from "./SendMoneyModalForm";
import { SendMoneyModalActions } from "./SendMoneyModalActions";

export const SendMoneyMainWallet = () => {
    const {
        open,
        openModal,
        closeModal,
        control,
        handleSubmit,
        onSubmit,
        sendLoading,
        address,
    } = useSendMoneyMainWallet();

    return (
        <>
            <SendMoneyTrigger
                openModal={openModal}
                disabled={!address}
            />

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
                <SendMoneyModalHeader
                    onClose={closeModal}
                    disabled={sendLoading}
                />

                <DialogContent sx={{ px: 3, py: 3, background: "#ffffff" }}>
                    <SendMoneyModalForm control={control} />
                </DialogContent>

                <SendMoneyModalActions
                    onClose={closeModal}
                    onSend={handleSubmit(onSubmit)}
                    loading={sendLoading}
                />
            </Dialog>
        </>
    );
};
