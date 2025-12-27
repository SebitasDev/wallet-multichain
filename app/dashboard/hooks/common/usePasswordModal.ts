import { useState, useMemo, FormEvent } from "react";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";

interface UsePasswordModalProps {
    mode: "create" | "unlock";
    onSuccess: () => void;
}

export const usePasswordModal = ({ mode, onSuccess }: UsePasswordModalProps) => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const setPasswordStore = useWalletPasswordStore((s) => s.setPassword);
    const verifyPassword = useWalletPasswordStore((s) => s.verifyPassword);
    const setCurrentPassword = useWalletPasswordStore((s) => s.setCurrentPassword);

    const isEmpty = useMemo(() => password.trim().length === 0, [password]);
    const errorId = "password-error"; // Needed for accessibility in the form

    const handleSubmit = async (evt?: FormEvent<HTMLFormElement>) => {
        if (evt) evt.preventDefault();

        if (isEmpty) {
            setError("La contraseña no puede estar vacía");
            return;
        }

        setError("");
        setIsSubmitting(true);

        try {
            if (mode === "create") {
                await setPasswordStore(password);
                setCurrentPassword(password);
                onSuccess();
                return;
            }

            const ok = await verifyPassword(password);
            if (!ok) {
                setError("Contraseña incorrecta");
                return;
            }

            setCurrentPassword(password);
            onSuccess();
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        // State
        password,
        setPassword,
        error,
        setError,
        showPassword,
        setShowPassword,
        isSubmitting,
        isEmpty,
        errorId,

        // Actions
        handleSubmit
    };
};
