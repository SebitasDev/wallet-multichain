import { DialogFooter } from "@/app/components/molecules/DialogFooter";
import { useLanguageStore } from "@/app/store/useLanguageStore";

interface SendMoneyModalActionsProps {
    onClose: () => void;
    onAction: () => void;
    loading: boolean;
    routeReady: boolean;
    disabled?: boolean;
}

export const SendMoneyModalActions = ({
    onClose,
    onAction,
    loading,
    routeReady,
    disabled = false,
}: SendMoneyModalActionsProps) => {
    const { language } = useLanguageStore();

    return (
        <DialogFooter
            onClose={onClose}
            onAction={onAction}
            loading={loading}
            disabled={disabled}
            actionLabel={routeReady ? (language === "es" ? "Confirmar" : "Confirm") : (language === "es" ? "Confirmar" : "Confirm")}
            cancelLabel={language === "es" ? "Cancelar" : "Cancel"}
        />
    );
};
