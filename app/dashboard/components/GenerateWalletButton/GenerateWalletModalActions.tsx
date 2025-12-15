import {
    Button,
    DialogActions
} from "@mui/material";

interface GenerateWalletModalActionsProps {
    handleCreate: () => void;
    disabled: boolean;
}

export const GenerateWalletModalActions = ({
    handleCreate,
    disabled
}: GenerateWalletModalActionsProps) => {
    return (
        <DialogActions sx={{ px: 3, pb: 3, background: "#ffffff" }}>
            <Button
                fullWidth
                variant="contained"
                onClick={handleCreate}
                sx={{
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
                    "&:disabled": {
                        opacity: 0.4,
                        background: "#cccccc",
                    },
                    "&:hover": {
                        background: "#00CC7C",
                        transform: "translate(2px, 2px)",
                        boxShadow: "2px 2px 0px #000000",
                    },
                }}
                disabled={disabled}
            >
                Crear Wallet
            </Button>
        </DialogActions>
    );
};
