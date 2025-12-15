import { Dialog } from "@mui/material";
import { WalletInfo } from "@/app/store/useWalletsStore";
import { useReceiveModal } from "@/app/dashboard/hooks/useReceiveModal";
import { ReceiveModalHeader } from "./ReceiveModalHeader";
import { ReceiveModalContent } from "./ReceiveModalContent";
import { ReceiveModalActions } from "./ReceiveModalActions";

type Props = {
    open: boolean;
    wallets: WalletInfo[];
    onClose: () => void;
};

export function ReceiveModal({ open, wallets, onClose }: Props) {
    const {
        selectedWallet,
        setSelectedWallet,
        selectedChain,
        setSelectedChain,
        currentAddress,
        currentChain,
        qrValue,
        copyToClipboard,
        chains
    } = useReceiveModal({ open, wallets });

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
            <ReceiveModalHeader onClose={onClose} />

            <ReceiveModalContent
                wallets={wallets}
                selectedWallet={selectedWallet}
                setSelectedWallet={setSelectedWallet}
                chains={chains}
                selectedChain={selectedChain}
                setSelectedChain={setSelectedChain}
                currentChain={currentChain}
                qrValue={qrValue}
                currentAddress={currentAddress}
            />

            <ReceiveModalActions
                onCopy={() => copyToClipboard(currentAddress)}
            />
        </Dialog>
    );
}
