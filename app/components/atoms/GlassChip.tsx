import { Chip, ChipProps } from "@mui/material";

export const GlassChip = ({ sx, ...props }: ChipProps) => {
    return (
        <Chip
            sx={{
                fontSize: 11,
                height: 24,
                color: "#f3f4f6",
                background: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.07))",
                borderRadius: "999px",
                fontWeight: 700,
                border: "1px solid rgba(255,255,255,0.2)",
                letterSpacing: "0.3px",
                backdropFilter: "blur(12px)",
                boxShadow: "0 14px 36px rgba(0,0,0,0.48)",
                ...sx,
            }}
            {...props}
        />
    );
};
