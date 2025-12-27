import { Card, CardProps } from "@mui/material";

export const NeoCard = ({ children, sx, ...props }: CardProps) => {
    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 4,
                overflow: "hidden",
                background: "#ffffff",
                border: "3px solid #000000",
                boxShadow: "6px 6px 0px #000000",
                transition: "all 0.2s",
                "&:hover": {
                    transform: "translate(2px, 2px)",
                    boxShadow: "4px 4px 0px #000000",
                },
                ...sx,
            }}
            {...props}
        >
            {children}
        </Card>
    );
};
