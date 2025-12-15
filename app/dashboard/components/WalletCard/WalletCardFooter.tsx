import { Box, Typography } from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

interface WalletCardFooterProps {
    expanded: boolean;
    onToggle: () => void;
    showToggle: boolean;
}

export const WalletCardFooter = ({ expanded, onToggle, showToggle }: WalletCardFooterProps) => {
    if (!showToggle) return null;

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 3,
                py: 1.05,
                color: "rgba(249,250,251,0.75)",
                cursor: "pointer",
                userSelect: "none",
                transition: "color 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.04)",
                },
            }}
            onClick={onToggle}
        >
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            <Typography fontWeight={600} fontSize={13}>
                {expanded ? "Mostrar menos" : "Mostrar mas"}
            </Typography>
        </Box>
    );
};
