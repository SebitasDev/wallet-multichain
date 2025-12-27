import { DialogActions } from "@mui/material";
import { NeoButton } from "../atoms/NeoButton";

interface DialogFooterProps {
    onClose: () => void;
    onAction: () => void;
    loading?: boolean;
    disabled?: boolean;
    actionLabel: React.ReactNode;
    cancelLabel?: string;
    showCancel?: boolean;
}

export const DialogFooter = ({
    onClose,
    onAction,
    loading = false,
    disabled = false,
    actionLabel,
    cancelLabel = "Cancel",
    showCancel = true,
}: DialogFooterProps) => {
    return (
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 2, background: "#ffffff" }}>
            {showCancel && (
                <NeoButton
                    variant="outlined"
                    onClick={onClose}
                    disabled={loading}
                    sx={{ flex: 1 }}
                >
                    {cancelLabel}
                </NeoButton>
            )}

            <NeoButton
                variant="contained"
                disabled={disabled || loading}
                onClick={onAction}
                loading={loading}
                sx={{ flex: 1 }}
            >
                {actionLabel}
            </NeoButton>
        </DialogActions>
    );
};
