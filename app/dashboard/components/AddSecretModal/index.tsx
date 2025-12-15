import { Dialog } from "@mui/material";

import { useAddSecretModal } from "@/app/dashboard/hooks/useAddSecretModal";
import { AddSecretModalHeader } from "./AddSecretModalHeader";
import { AddSecretModalForm } from "./AddSecretModalForm";
import { AddSecretModalActions } from "./AddSecretModalActions";

interface Props {
    open: boolean;
    onClose: () => void;
}

export function AddSecretModal({ open, onClose }: Props) {
    const {
        // State
        walletName,
        setWalletName,
        phrase,
        setPhrase,
        password,
        setPassword,

        // Computed
        words,
        has12Words,
        canConfirm,
        hasEncryptedPassword,

        // Actions
        handleAdd
    } = useAddSecretModal({ open, onClose });

    return (
        <Dialog
            open={open}
            onClose={onClose}
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
            <AddSecretModalHeader onClose={onClose} />

            <AddSecretModalForm
                walletName={walletName}
                setWalletName={setWalletName}
                phrase={phrase}
                setPhrase={setPhrase}
                password={password}
                setPassword={setPassword}
                has12Words={has12Words}
                wordsCount={words.length}
                hasEncryptedPassword={hasEncryptedPassword}
            />

            <AddSecretModalActions
                onClose={onClose}
                onConfirm={handleAdd}
                canConfirm={canConfirm}
            />
        </Dialog>
    );
}
