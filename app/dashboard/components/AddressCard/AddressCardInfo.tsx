import {
    Box,
    Typography,
    IconButton,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Address } from "abitype";

interface AddressCardInfoProps {
    address: Address;
    truncated: string;
    totalBalance: number;
    copyToClipboard: (text: string, label: string) => void;
}

export const AddressCardInfo = ({
    address,
    truncated,
    totalBalance,
    copyToClipboard
}: AddressCardInfoProps) => {
    return (
        <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "flex-end" }}
            gap={2}
        >
            {/* Address and action buttons */}
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
                    {truncated}
                </Box>

                <IconButton
                    size="small"
                    aria-label="Copiar address"
                    onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(address, "Address");
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

            {/* Balance */}
            <Box
                sx={{
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 2,
                    px: { xs: 2, sm: 2 },
                    py: { xs: 1, sm: 1 },
                    textAlign: { xs: "left", sm: "center" },
                    minWidth: { xs: "auto", sm: 140 },
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        color: "#666666",
                        fontWeight: 700,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        display: "block",
                        mb: 0.5,
                    }}
                >
                    Valor Total
                </Typography>
                <Typography
                    variant="h5"
                    fontWeight={900}
                    sx={{ color: "#000000", fontSize: { xs: 18, sm: 20, md: 24 } }}
                >
                    ${totalBalance.toFixed(2)}
                </Typography>
            </Box>
        </Box>
    );
};
