import { Button, DialogActions, CircularProgress } from "@mui/material";

interface SendMoneyModalActionsProps {
    onClose: () => void;
    onSend: () => void;
    loading: boolean;
}

export const SendMoneyModalActions = ({ onClose, onSend, loading }: SendMoneyModalActionsProps) => {
    return (
        <DialogActions sx={{ p: 3, gap: 2, background: "#ffffff" }}>
            <Button
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
                onClick={onSend}
                disabled={loading}
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
                    },
                }}
            >
                {loading ? (
                    <>
                        <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                        Enviando...
                    </>
                ) : (
                    "Enviar"
                )}
            </Button>
        </DialogActions>
    );
};
