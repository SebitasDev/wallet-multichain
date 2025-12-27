import { Button } from "@mui/material";

type SubmitButtonProps = {
    onClick: () => void;
    isLoading: boolean;
    isDisabled: boolean;
};

export const SubmitButton = ({ onClick, isLoading, isDisabled }: SubmitButtonProps) => (
    <Button
        variant="contained"
        onClick={onClick}
        disabled={isDisabled}
        sx={{
            flex: 1,
            textTransform: "none",
            borderRadius: 3,
            py: 1.4,
            fontWeight: 800,
            fontSize: 15,
            background: "#00DC8C",
            color: "white",
            border: "3px solid #000000",
            boxShadow: "4px 4px 0px #000000",
            transition: "all 0.2s",
            "&:hover": {
                background: "#00CC7C",
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
        {isLoading ? "Procesando..." : "Enviar"}
    </Button>
);
