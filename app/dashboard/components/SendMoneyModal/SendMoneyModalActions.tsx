import { Button, DialogActions, CircularProgress } from "@mui/material";

interface SendMoneyModalActionsProps {
    onClose: () => void;
    onAction: () => void;
    loading: boolean;
    disabled: boolean;
    routeReady: boolean;
}

export const SendMoneyModalActions = ({ onClose, onAction, loading, disabled, routeReady }: SendMoneyModalActionsProps) => {
    return (
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 2, background: "#ffffff" }}>
            <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
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
                    "&:disabled": {
                        opacity: 0.4,
                    },
                }}
            >
                Cancelar
            </Button>

            <Button
                variant="contained"
                disabled={disabled || loading}
                onClick={onAction}
                sx={{
                    flex: 1,
                    textTransform: "none",
                    borderRadius: 3,
                    py: 1.4,
                    fontWeight: 800,
                    fontSize: 15,
                    background: "#7852FF",
                    color: "#ffffff",
                    border: "3px solid #000000",
                    boxShadow: "4px 4px 0px #000000",
                    transition: "all 0.2s",
                    "&:hover": {
                        background: "#6342E6",
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
                {loading ? (
                    <>
                        <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                        Cargando...
                    </>
                ) : routeReady ? "Confirmar" : "Aceptar"}
            </Button>
        </DialogActions>
    );
};
