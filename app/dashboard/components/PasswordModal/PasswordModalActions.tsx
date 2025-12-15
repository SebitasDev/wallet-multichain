import { Button } from "@mui/material";

interface PasswordModalActionsProps {
    isSubmitting: boolean;
    isEmpty: boolean;
    mode: "create" | "unlock";
}

export const PasswordModalActions = ({
    isSubmitting,
    isEmpty,
    mode
}: PasswordModalActionsProps) => {
    return (
        <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isEmpty || isSubmitting}
            sx={{
                textTransform: "uppercase",
                fontWeight: 900,
                letterSpacing: 1,
                fontSize: 15,
                py: 1.8,
                borderRadius: 3,
                background: mode === "create" ? "#00DC8C" : "#7852FF",
                color: mode === "create" ? "#000000" : "#ffffff",
                border: "3px solid #000000",
                boxShadow: "6px 6px 0px #000000",
                transition: "all 0.2s",
                "&:hover": {
                    background: mode === "create" ? "#00CC7C" : "#6342E6",
                    transform: "translate(2px, 2px)",
                    boxShadow: "4px 4px 0px #000000",
                },
                "&:active": {
                    transform: "translate(4px, 4px)",
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
            {isSubmitting
                ? "Procesando..."
                : mode === "create"
                    ? "Crear contraseña"
                    : "Desbloquear"}
        </Button>
    );
};
