import { Box, Typography, Stack, IconButton } from "@mui/material";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import { Wallet } from "@/app/dashboard/types";

interface WalletCardAddressBarProps {
    wallet: Wallet;
    onCopy: (value: string, label: string) => void;
}

export const WalletCardAddressBar = ({ wallet, onCopy }: WalletCardAddressBarProps) => {
    return (
        <Box
            sx={{
                px: 3,
                py: 1,
                background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
            }}
        >
            <Typography variant="body2" sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                {wallet.address}
            </Typography>
            <Stack direction="row" spacing={1}>
                <IconButton
                    size="small"
                    sx={{
                        color: "rgba(255,255,255,0.85)",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.1)",
                            color: "#ffffff",
                        },
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onCopy(wallet.address, "Address");
                    }}
                >
                    <ContentCopyOutlined fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    sx={{
                        color: "rgba(255,255,255,0.85)",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.1)",
                            color: "#ffffff",
                        },
                    }}
                >
                    <LinkOutlined fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    sx={{
                        color: "rgba(255,255,255,0.85)",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.1)",
                            color: "#ffffff",
                        },
                    }}
                >
                    <OpenInNewOutlined fontSize="small" />
                </IconButton>
            </Stack>
        </Box>
    );
};
