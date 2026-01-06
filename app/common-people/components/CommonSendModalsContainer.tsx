
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore";
import { SendMoneyModal } from "@/app/dashboard/components/SendMoneyModal";
import { CommonCrossChainModal } from "./CommonCrossChainModal";

export const CommonSendModalsContainer = () => {
    const { initialChain, isOpen } = useSendMoneyStore();

    // If modal is not open, render nothing (or render one of them hidden? no, conditional is better)
    if (!isOpen) return null;

    // Logic Switch:
    // Case 1: "Per-Chain" Mode (triggered from AssetModal)
    // -> initialChain is defined.
    // -> Render Legacy SendMoneyModal to preserve exact behavior.
    if (initialChain) {
        return <SendMoneyModal variant="simplified" />;
    }

    // Case 2: "General" Mode (triggered from Header/Sidebar)
    // -> initialChain is undefined.
    // -> Render New Cross-Chain Modal.
    return <CommonCrossChainModal />;
};
