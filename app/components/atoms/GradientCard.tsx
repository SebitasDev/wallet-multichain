import { Card, CardContent, CardProps } from "@mui/material";

interface GradientCardProps extends CardProps {
    children: React.ReactNode;
    contentSx?: any;
}

export const GradientCard = ({ children, sx, contentSx, ...props }: GradientCardProps) => {
    return (
        <Card
            sx={{
                position: "relative",
                isolation: "isolate",
                borderRadius: 4, // Approx 22px ~ 2.75rem or just use number 22 if system usually uses px
                overflow: "hidden",
                boxShadow:
                    "0 25px 70px rgba(0,0,0,0.78), 0 12px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
                border: "1px solid rgba(126,87,255,0.22)",
                backgroundColor: "#0a0818",
                backgroundImage:
                    "radial-gradient(circle at 18% 12%, rgba(118,87,255,0.24) 0%, transparent 26%), radial-gradient(circle at 82% 0%, rgba(255,72,160,0.22) 0%, transparent 22%), linear-gradient(185deg, #0f0a1f 0%, #0c0a1a 45%, #060510 100%)",
                color: "#f9fafb",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: -6,
                    borderRadius: "inherit",
                    background: "linear-gradient(135deg, rgba(126,87,255,0.38), rgba(255,72,160,0.32))",
                    filter: "blur(20px)",
                    opacity: 0.4,
                    zIndex: 0,
                },
                ...sx,
            }}
            {...props}
        >
            <CardContent sx={{ p: 0, position: "relative", zIndex: 1, ...contentSx }}>
                {children}
            </CardContent>
        </Card>
    );
};
