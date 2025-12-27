import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";

interface CopyableAddressProps {
    address: string;
    onCopy: (text: string, label: string) => void;
    variant?: "glass" | "neo";
    truncated?: boolean;
}

export const CopyableAddress = ({
    address,
    onCopy,
    variant = "glass",
    truncated = true
}: CopyableAddressProps) => {
    const isGlass = variant === "glass";

    const displayAddress = truncated
        ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
        : address;

    if (isGlass) {
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
                    {displayAddress}
                </Typography>
                <Box display="flex" gap={1}>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCopy(address, "Address");
                        }}
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
                </Box>
            </Box>
        );
    }

    // Neo Variant
    return (
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Box
                component="code"
                sx={{
                    backgroundColor: "#ffffff",
                    px: { xs: 1.2, sm: 1.5 },
                    py: 0.75,
                    borderRadius: 2,
                    fontSize: { xs: "12px", sm: "13px" },
                    fontWeight: 700,
                    color: "#000000",
                    border: "2px solid #000000",
                    fontFamily: "monospace",
                }}
            >
                {displayAddress}
            </Box>

            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    onCopy(address, "Address");
                }}
                sx={{
                    color: "#000000",
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 2,
                    width: { xs: 30, sm: 32 },
                    height: { xs: 30, sm: 32 },
                    transition: "all 0.2s",
                    "&:hover": {
                        background: "#3CD2FF",
                        transform: "scale(1.05)",
                    },
                }}
            >
                <ContentCopyIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
            </IconButton>

            <IconButton
                size="small"
                component="a"
                href={`https://etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                    color: "#000000",
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 2,
                    width: { xs: 30, sm: 32 },
                    height: { xs: 30, sm: 32 },
                    transition: "all 0.2s",
                    "&:hover": {
                        background: "#7852FF",
                        color: "#ffffff",
                        transform: "scale(1.05)",
                    },
                }}
            >
                <OpenInNewIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
            </IconButton>
        </Box>
    );
};
