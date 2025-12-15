import { Button } from "@mui/material";

interface SendMoneyTriggerProps {
    openModal: () => void;
    disabled: boolean;
}

export const SendMoneyTrigger = ({ openModal, disabled }: SendMoneyTriggerProps) => {
    return (
        <Button
            variant="contained"
            onClick={openModal}
            disabled={disabled}
            sx={{
                background: "#7852FF",
                color: "white",
                fontWeight: 800,
                letterSpacing: "0.5px",
                px: 3.4,
                py: 1.5,
                minHeight: 50,
                borderRadius: 3,
                textTransform: "none",
                border: "3px solid #000000",
                boxShadow: "4px 4px 0px #000000",
                whiteSpace: "nowrap",
                width: "100%",
                minWidth: 0,
                maxWidth: 240,
                transition: "all 0.2s",
                "&:hover": {
                    background: "#6342E6",
                    transform: "translate(2px, 2px)",
                    boxShadow: "2px 2px 0px #000000",
                },
                "&:disabled": {
                    background: "#cccccc",
                    color: "#666666",
                    border: "3px solid #999999",
                    boxShadow: "none",
                    transform: "none",
                },
            }}
        >
            Enviar desde Main
        </Button>
    );
};
