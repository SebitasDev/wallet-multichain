import { Box, Chip, Stack, Typography } from "@mui/material";
import ArrowForwardIos from "@mui/icons-material/ArrowForwardIos";
import { formatCurrency } from "@/app/utils/formatCurrency";

interface ChainInfo {
    name: string;
    tokens: number;
    value: number;
    color: string; // Hex color
    tag: string;   // e.g., "EVM", "L2"
}

interface ChainBadgeListProps {
    chains: ChainInfo[];
}

const Dot = ({ color }: { color: string }) => (
    <Box
        sx={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: color,
            boxShadow: "0 0 0 4px rgba(255,255,255,0.06), 0 8px 18px rgba(0,0,0,0.35)",
            flexShrink: 0,
        }}
    />
);

const TagChip = ({ label }: { label: string }) => (
    <Chip
        label={label}
        size="small"
        sx={{
            fontSize: 11,
            height: 24,
            borderRadius: "999px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))",
            color: "#f3f4f6",
            fontWeight: 700,
            textTransform: "uppercase",
            border: "1px solid rgba(255,255,255,0.16)",
            letterSpacing: "0.4px",
            backdropFilter: "blur(10px)",
            boxShadow: "0 14px 34px rgba(0,0,0,0.4)",
        }}
    />
);

export const ChainBadgeList = ({ chains }: ChainBadgeListProps) => {
    return (
        <>
            {chains.map((chain, index) => (
                <Box
                    key={chain.name}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 3,
                        py: 1.05,
                        borderBottom:
                            index === chains.length - 1 ? "none" : "1px solid rgba(255,255,255,0.06)",
                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                        backgroundColor: "rgba(8,8,18,0.9)",
                        "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderColor: "rgba(255,255,255,0.1)",
                        },
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Dot color={chain.color} />
                        <Box>
                            <Typography fontWeight={600} fontSize={14} sx={{ color: "#f9fafb" }}>
                                {chain.name}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ fontSize: 12, mt: 0.4, color: "rgba(249,250,251,0.6)" }}
                            >
                                {chain.tokens} tokens
                            </Typography>
                        </Box>
                        <TagChip label={chain.tag} />
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1.25}>
                        <Typography fontWeight={700} fontSize={14} sx={{ color: "#f9fafb" }}>
                            {formatCurrency(chain.value)}
                        </Typography>
                        <ArrowForwardIos sx={{ fontSize: 14, color: "rgba(249,250,251,0.55)" }} />
                    </Stack>
                </Box>
            ))}
        </>
    );
};
