import { useRouter } from "next/navigation";
import { useModalStore } from "@/app/store/useModalStore";
import { useSendModalState } from "@/app/dashboard/store/useSendModalState";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { toast } from "react-toastify";

export const useTopBar = () => {
    const router = useRouter();
    const { openAdd, openReceive } = useModalStore();
    const { setSendModal } = useSendModalState();
    const { wallets } = useWalletStore();

    const handleSend = () => {
        if (!wallets[0]) return toast.error("Primero agrega una wallet de origen.");
        setSendModal(true);
    };

    const handleReceive = () => {
        if (!wallets.length) return toast.error("Primero agrega una wallet.");
        openReceive();
    };

    const handleAdd = () => {
        openAdd();
    };

    const handleSavings = () => {
        router.push("/dashboard/savings");
    };

    return {
        handleSend,
        handleReceive,
        handleAdd,
        handleSavings,
        wallets
    };
};
