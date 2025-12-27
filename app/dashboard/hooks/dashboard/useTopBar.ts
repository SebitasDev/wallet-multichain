import { useRouter } from "next/navigation";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { toast } from "react-toastify";

export const useTopBar = () => {
    const router = useRouter();
    const { openAdd, openReceive } = useDashboardModalsStore();
    const { setSendModal } = useSendMoneyStore();
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
        router.push("/dashboard/yield");
    };

    return {
        handleSend,
        handleReceive,
        handleAdd,
        handleSavings,
        wallets
    };
};
