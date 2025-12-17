import {
    Box,
    Typography,
    IconButton,
    Chip,
} from "@mui/material";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";

interface AddressCardHeaderProps {
    displayName: string;
    showNameExpanded: boolean;
    exceedsNameLimit: boolean;
    toggleNameExpanded: (e: React.MouseEvent) => void;
    handleRemoveWallet: (e: React.MouseEvent) => void;
}

export const AddressCardHeader = ({
    displayName,
    showNameExpanded,
    exceedsNameLimit,
    toggleNameExpanded,
    handleRemoveWallet
}: AddressCardHeaderProps) => {
    return (
        <>
            {/* Desktop Layout */}
            <Box
                display={{ xs: "none", sm: "flex" }}
                justifyContent="space-between"
                alignItems="flex-start"
                gap={2}
                mb={2}
            >
                <Box display="flex" alignItems="center" gap={1} flex={1}>
                    <Typography
                        variant="h6"
                        fontWeight={800}
                        sx={{
                            color: "#000000",
                            fontSize: { sm: 18, md: 20 },
                        }}
                    >
                        {displayName}
                    </Typography>

                    {exceedsNameLimit && (
                        <IconButton
                            size="small"
                            onClick={toggleNameExpanded}
                            sx={{
                                color: "#000000",
                                background: "#ffffff",
                                border: "2px solid #000000",
                                borderRadius: 2,
                                width: 28,
                                height: 28,
                                "&:hover": {
                                    background: "#f5f5f5",
                                },
                            }}
                        >
                            {showNameExpanded ? (
                                <ExpandLess fontSize="small" />
                            ) : (
                                <ExpandMoreIcon fontSize="small" />
                            )}
                        </IconButton>
                    )}

                    <Chip
                        label="6 chains"
                        size="small"
                        sx={{
                            background: "#ffffff",
                            color: "#000000",
                            border: "2px solid #000000",
                            fontWeight: 800,
                            fontSize: 11,
                            letterSpacing: "0.5px",
                        }}
                    />
                </Box>

                <IconButton
                    className="tour-delete-wallet" // Targeted by Shepherd tour
                    size="small"
                    sx={{
                        color: "#000000",
                        background: "#ff4444",
                        border: "2px solid #000000",
                        borderRadius: 2,
                        width: 36,
                        height: 36,
                        transition: "all 0.2s",
                        "&:hover": {
                            background: "#ff3333",
                            transform: "scale(1.05)",
                        },
                    }}
                    onClick={handleRemoveWallet}
                >
                    <DeleteOutlineIcon fontSize="small" sx={{ color: "#ffffff" }} />
                </IconButton>
            </Box>

            {/* Mobile Layout */}
            <Box display={{ xs: "flex", sm: "none" }} flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                            variant="h6"
                            fontWeight={800}
                            sx={{
                                color: "#000000",
                                fontSize: 16,
                            }}
                        >
                            {displayName}
                        </Typography>

                        <Chip
                            label="6 chains"
                            size="small"
                            sx={{
                                background: "#ffffff",
                                color: "#000000",
                                border: "2px solid #000000",
                                fontWeight: 800,
                                fontSize: 10,
                                letterSpacing: "0.5px",
                                height: 24,
                            }}
                        />
                    </Box>

                    <IconButton
                        size="small"
                        sx={{
                            color: "#000000",
                            background: "#ff4444",
                            border: "2px solid #000000",
                            borderRadius: 2,
                            width: 32,
                            height: 32,
                            transition: "all 0.2s",
                            "&:hover": {
                                background: "#ff3333",
                            },
                        }}
                        onClick={handleRemoveWallet}
                    >
                        <DeleteOutlineIcon fontSize="small" sx={{ color: "#ffffff" }} />
                    </IconButton>
                </Box>
            </Box>
        </>
    );
};
