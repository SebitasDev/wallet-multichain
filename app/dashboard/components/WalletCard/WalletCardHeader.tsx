import { Box, IconButton, Stack, Typography } from "@mui/material";
import { GlassChip } from "@/app/components/atoms/GlassChip";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { Wallet } from "@/app/dashboard/types";

interface WalletCardHeaderProps {
    wallet: Wallet;
    displayName: string;
    exceedsNameLimit: boolean;
    showNameExpanded: boolean;
    onToggleName: (e: React.MouseEvent) => void;
}

export const WalletCardHeader = ({
    wallet,
    displayName,
    exceedsNameLimit,
    showNameExpanded,
    onToggleName
}: WalletCardHeaderProps) => {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 3,
                pt: 2.4,
                pb: 1.25,
                backgroundColor: "transparent",
                boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.08)",
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                spacing={1.25}
                flexWrap="nowrap"
                sx={{ minWidth: 0, overflow: "hidden" }}
            >
                <Typography
                    fontWeight={700}
                    fontSize={17}
                    sx={{
                        color: "#f9fafb",
                        maxWidth: { xs: 160, sm: 220 },
                        minWidth: 0,
                        whiteSpace: showNameExpanded ? "normal" : "nowrap",
                        textOverflow: showNameExpanded ? "clip" : "ellipsis",
                        overflow: "hidden",
                        letterSpacing: "0.35px",
                    }}
                    title={wallet.name}
                >
                    {displayName}
                </Typography>
                {exceedsNameLimit && (
                    <IconButton
                        size="small"
                        onClick={onToggleName}
                        sx={{
                            color: "rgba(255,255,255,0.85)",
                            p: 0.25,
                            backgroundColor: "rgba(255,255,255,0.08)",
                            "&:hover": { backgroundColor: "rgba(255,255,255,0.14)" },
                            border: "1px solid rgba(255,255,255,0.12)",
                        }}
                    >
                        {showNameExpanded ? (
                            <ExpandLess sx={{ fontSize: 18 }} />
                        ) : (
                            <ExpandMore sx={{ fontSize: 18 }} />
                        )}
                    </IconButton>
                )}
                <GlassChip
                    label={`${wallet.chains.length} chains`}
                />
            </Stack>
            <Box sx={{ textAlign: "right" }}>
                <Typography fontWeight={800} fontSize={21} sx={{ color: "#f9fafb" }} lineHeight={1}>
                    {formatCurrency(wallet.total)}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12, mt: 0.4, color: "rgba(249,250,251,0.6)" }}>
                    Valor Total
                </Typography>
            </Box>
        </Box>
    );
};
