import { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { generateMnemonic } from "viem/accounts";
import { wordlist } from "@scure/bip39/wordlists/english";

interface UseAddSecretModalProps {
    open: boolean;
    onClose: () => void;
}

export const useAddSecretModal = ({ open, onClose }: UseAddSecretModalProps) => {
    const { addWallet } = useWalletStore();
    const encryptedPassword = useWalletPasswordStore(s => s.encryptedPassword);
    const verifyPassword = useWalletPasswordStore(s => s.verifyPassword);

    const [walletName, setWalletName] = useState("");
    const [phrase, setPhrase] = useState("");
    const [password, setPassword] = useState("");

    // Reset fields and generate mnemonic when modal opens
    useEffect(() => {
        if (open) {
            const randomMnemonic = generateMnemonic(wordlist);
            setPhrase(randomMnemonic);
            setWalletName("");
            setPassword("");
        } else {
            setWalletName("");
            setPhrase("");
            setPassword("");
        }
    }, [open]);

    const words = useMemo(
        () => (phrase.trim() ? phrase.trim().split(/\s+/).filter(Boolean) : []),
        [phrase]
    );

    const has12Words = words.length === 12;

    const canConfirm =
        walletName.trim().length > 0 &&
        password.trim().length > 0 &&
        has12Words;

    const handleAdd = async () => {
        if (!canConfirm) {
            toast.error("Completa nombre, password y las 12 palabras.");
            return;
        }

        try {
            // Validate password if it already exists
            if (encryptedPassword) {
                const ok = await verifyPassword(password);
                if (!ok) {
                    toast.error("Password incorrecta.");
                    return;
                }
            }

            // Add wallet
            await addWallet(phrase, password, walletName);

            toast.success(`Wallet "${walletName}" agregada correctamente.`);
            onClose();
            // Fields are reset by useEffect when open becomes false
        } catch (err) {
            console.error(err);
            toast.error((err as Error).message || "Error al agregar wallet");
        }
    };

    return {
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
        hasEncryptedPassword: !!encryptedPassword,

        // Actions
        handleAdd
    };
};
