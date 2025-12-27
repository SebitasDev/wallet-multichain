import { Button, ButtonProps, CircularProgress } from "@mui/material";

interface NeoButtonProps extends ButtonProps {
    loading?: boolean;
    variant?: "contained" | "outlined" | "text";
}

export const NeoButton = ({
    children,
    loading,
    variant = "contained",
    sx,
    disabled,
    ...props
}: NeoButtonProps) => {
    const isContained = variant === "contained";
    const isOutlined = variant === "outlined";

    const baseStyles = {
        textTransform: "none",
        borderRadius: 3,
        fontWeight: 800,
        fontSize: 15,
        border: "3px solid #000000",
        boxShadow: "4px 4px 0px #000000",
        transition: "all 0.2s",
        "&:hover": {
            transform: "translate(2px, 2px)",
            boxShadow: "2px 2px 0px #000000",
        },
        "&:disabled": {
            opacity: 0.4,
            boxShadow: "none",
            transform: "none",
            background: "#cccccc",
            border: "3px solid #666666",
        },
        ...sx,
    };

    const variantStyles = {
        contained: {
            background: "#7852FF",
            color: "#ffffff",
            "&:hover": {
                background: "#6342E6",
                transform: "translate(2px, 2px)",
                boxShadow: "2px 2px 0px #000000",
            },
        },
        outlined: {
            background: "#ffffff",
            color: "#000000",
            "&:hover": {
                background: "#f5f5f5",
                transform: "translate(2px, 2px)",
                boxShadow: "2px 2px 0px #000000",
            },
        },
        text: { // Fallback or different style if needed, currently treating similar but maybe less shadow?
            // For consistency with current app, keeps blocky feel
            border: "none",
            boxShadow: "none",
            "&:hover": {
                background: "rgba(0,0,0,0.05)",
                transform: "none",
                boxShadow: "none",
            },
        }
    };

    // Merge styles logic
    const finalSx = {
        ...baseStyles,
        ...(isContained ? variantStyles.contained : {}),
        ...(isOutlined ? variantStyles.outlined : {}),
        ...(variant === 'text' ? variantStyles.text : {}),
        ...sx // Override with user provided sx last
    };

    return (
        <Button
            variant={variant}
            disabled={disabled || loading}
            sx={finalSx as any}
            {...props}
        >
            {loading && (
                <CircularProgress
                    size={20}
                    sx={{
                        color: isContained ? "white" : "inherit",
                        mr: 1
                    }}
                />
            )}
            {children}
        </Button>
    );
};
