import { useEffect } from "react";
import { useGeneralWalletStore } from "@/app/store/useGeneralWalletStore";

export const useGeneralWallet = () => {
    const initializeWallet = useGeneralWalletStore((s) => s.initializeWallet);

    useEffect(() => {
        if (typeof initializeWallet === "function") {
            initializeWallet();
        }
    }, [initializeWallet]);

};
