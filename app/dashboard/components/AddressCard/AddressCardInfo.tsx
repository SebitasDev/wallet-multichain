import { Box, Typography } from "@mui/material";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { Address } from "abitype";
import { CopyableAddress } from "@/app/components/molecules/CopyableAddress";

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
                <CopyableAddress
                    address={address}
                    onCopy={(text) => copyToClipboard(text, "Address")}
                    variant="neo"
                    truncated={true}
                />
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
