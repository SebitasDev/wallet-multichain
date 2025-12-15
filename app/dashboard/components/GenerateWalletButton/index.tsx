import { Dialog } from "@mui/material";
import { useGenerateWalletButton } from "@/app/dashboard/hooks/useGenerateWalletButton";
import { GenerateWalletButtonTrigger } from "./GenerateWalletButtonTrigger";
import { GenerateWalletModalHeader } from "./GenerateWalletModalHeader";
import { GenerateWalletModalForm } from "./GenerateWalletModalForm";
import { GenerateWalletModalActions } from "./GenerateWalletModalActions";

export function GenerateWalletButton() {
    const {
        // State
        open,
        walletName,
        setWalletName,
        password,
        setPassword,
        mnemonic,

        // Actions
        openModal,
        closeModal,
        handleCreate
    } = useGenerateWalletButton();

    return (
        <>
            <GenerateWalletButtonTrigger onClick={openModal} />

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
                <GenerateWalletModalHeader onClose={closeModal} />

                <GenerateWalletModalForm
                    walletName={walletName}
                    setWalletName={setWalletName}
                    password={password}
                    setPassword={setPassword}
                    mnemonic={mnemonic}
                />

                <GenerateWalletModalActions
                    handleCreate={handleCreate}
                    disabled={!walletName || !password}
                />
            </Dialog>
        </>
    );
}
