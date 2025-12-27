import { useState } from "react";
import { toast } from "react-toastify";
import { generateMnemonic } from "viem/accounts";
import { wordlist } from "@scure/bip39/wordlists/english";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";

export const useGenerateWalletButton = () => {
    const { addWallet } = useWalletStore();
    const verifyPassword = useWalletPasswordStore(s => s.verifyPassword);

    const [open, setOpen] = useState(false);
    const [walletName, setWalletName] = useState("");
    const [password, setPassword] = useState("");
    const [mnemonic, setMnemonic] = useState("");

    const openModal = () => {
        const generatedMnemonic = generateMnemonic(wordlist);
        setMnemonic(generatedMnemonic);
        setOpen(true);
    };

    const closeModal = () => {
        setOpen(false);
        setWalletName("");
        setPassword("");
        setMnemonic("");
    };

    const handleCreate = async () => {
        if (!walletName.trim() || !password.trim()) {
            toast.error("Completa nombre y contraseña");
            return;
        }

        const isValid = await verifyPassword(password);
        if (!isValid) {
            toast.error("Contraseña incorrecta");
            return;
        }

        try {
            await addWallet(mnemonic, password, walletName);

            toast.success(`Wallet "${walletName}" creada correctamente`);
            closeModal();
        } catch (err) {
            console.error(err);
            toast.error((err as Error).message || "Error creando wallet");
        }
    };

    return {
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
    };
};
