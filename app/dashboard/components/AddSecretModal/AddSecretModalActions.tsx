import {
    Button,
    DialogActions,
} from "@mui/material";

interface AddSecretModalActionsProps {
    onClose: () => void;
    onConfirm: () => void;
    canConfirm: boolean;
}

export const AddSecretModalActions = ({
    onClose,
    onConfirm,
    canConfirm
}: AddSecretModalActionsProps) => {
    return (
        <DialogActions
            sx={{
                px: 3,
                pb: 3,
                pt: 1,
                gap: 2,
                background: "#ffffff",
            }}
        >
            <Button
                fullWidth
                variant="outlined"
                onClick={onClose}
                sx={{
                    flex: 1,
                    textTransform: "none",
                    borderRadius: 3,
                    py: 1.4,
                    fontWeight: 800,
                    fontSize: 15,
                    background: "#ffffff",
                    color: "#000000",
                    border: "3px solid #000000",
                    boxShadow: "4px 4px 0px #000000",
                    transition: "all 0.2s",
                    "&:hover": {
                        background: "#f5f5f5",
                        transform: "translate(2px, 2px)",
                        boxShadow: "2px 2px 0px #000000",
                    },
                }}
            >
                Cancelar
            </Button>

            <Button
                fullWidth
                variant="contained"
                onClick={onConfirm}
                disabled={!canConfirm}
                sx={{
                    flex: 1,
                    textTransform: "none",
                    borderRadius: 3,
                    py: 1.4,
                    fontWeight: 800,
                    fontSize: 15,
                    background: "#00DC8C",
                    color: "#000000",
                    border: "3px solid #000000",
                    boxShadow: "4px 4px 0px #000000",
                    transition: "all 0.2s",
                    "&:hover": {
                        background: "#00CC7C",
                        transform: "translate(2px, 2px)",
                        boxShadow: "2px 2px 0px #000000",
                    },
                    "&:disabled": {
                        opacity: 0.4,
                        background: "#cccccc",
                        transform: "none",
                    },
                }}
            >
                Agregar
            </Button>
        </DialogActions>
    );
};
