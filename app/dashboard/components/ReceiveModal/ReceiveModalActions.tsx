import { Button, DialogActions } from "@mui/material";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";

interface ReceiveModalActionsProps {
    onCopy: () => void;
}

export const ReceiveModalActions = ({ onCopy }: ReceiveModalActionsProps) => {
    return (
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, background: "#ffffff" }}>
            <Button
                fullWidth
                variant="contained"
                startIcon={<ContentCopyOutlined />}
                onClick={onCopy}
                sx={{
                    textTransform: "none",
                    borderRadius: 3,
                    py: 1.4,
                    fontWeight: 800,
                    fontSize: 15,
                    background: "#3CD2FF",
                    color: "#000000",
                    border: "3px solid #000000",
                    boxShadow: "4px 4px 0px #000000",
                    transition: "all 0.2s",
                    "&:hover": {
                        background: "#2CC2EF",
                        transform: "translate(2px, 2px)",
                        boxShadow: "2px 2px 0px #000000",
                    },
                }}
            >
                Copiar dirección
            </Button>
        </DialogActions>
    );
};
