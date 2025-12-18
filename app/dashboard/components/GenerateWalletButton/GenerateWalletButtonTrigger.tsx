import { Button } from "@mui/material";

interface GenerateWalletButtonTriggerProps {
    onClick: () => void;
}

export const GenerateWalletButtonTrigger = ({ onClick }: GenerateWalletButtonTriggerProps) => {
    return (
        <Button
            variant="contained"
            id="tour-generate-wallet"
            onClick={onClick}
            sx={{
                textTransform: "none",
                borderRadius: 3,
                px: 3.4,
                py: 1.5,
                minHeight: 50,
                fontWeight: 800,
                letterSpacing: "0.5px",
                background: "#4f46ff",
                color: "#ffffff",
                border: "3px solid #000000",
                boxShadow: "4px 4px 0px #000000",
                whiteSpace: "nowrap",
                width: "100%",
                minWidth: 0,
                maxWidth: 240,
                transition: "all 0.2s",
                "&:hover": {
                    background: "#5b55ff",
                    transform: "translate(2px, 2px)",
                    boxShadow: "2px 2px 0px #000000",
                },
            }}
        >
            Generar address
        </Button>
    );
};
