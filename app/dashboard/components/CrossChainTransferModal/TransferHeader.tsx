import { Box, Stack, Typography, Chip, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type TransferHeaderProps = {
    onClose: () => void;
    isLoading: boolean;
};

export const TransferHeader = ({ onClose, isLoading }: TransferHeaderProps) => (
    <Box
        sx={{
            display: "flex",
            alignItems: "center",
            px: 3,
            py: 2.5,
            background: "#000000",
            color: "#fff",
            borderBottom: "3px solid #000000",
        }}
    >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
            <Typography fontSize={18} fontWeight={800}>
                Cross-Chain Transfer
            </Typography>
        </Stack>

        <IconButton
            onClick={onClose}
            disabled={isLoading}
            sx={{
                color: "white",
                background: "rgba(255,255,255,0.1)",
                borderRadius: 2,
                "&:hover": {
                    background: "rgba(255,255,255,0.2)",
                },
                "&:disabled": {
                    color: "rgba(255,255,255,0.3)",
                }
            }}
        >
            <CloseIcon />
        </IconButton>
    </Box>
);
