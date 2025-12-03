import { useState } from "react";
import {
    Box,
    Chip,
    Collapse,
    Divider,
    ListItemButton,
    ListItemSecondaryAction,
    Typography,
    List,
    ListItem
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {UsdcIcon} from "@/app/components/atoms/UsdcIcon";
import {useGetBalanceFromChain} from "@/app/hook/useGetBalanceFromChain";
import {unichainSepolia} from "viem/chains";
import {Address} from "abitype";
import {UnichainIcon} from "@/app/components/atoms/UnichainIcon";

interface IBaseChainItemProps {
    address: Address;
}

export default function UnichainChainItem({ address } : IBaseChainItemProps) {
    const [open, setOpen] = useState(false);
    const { balance } = useGetBalanceFromChain(unichainSepolia, address, "0x31d0220469e10c4E71834a79b1f276d740d3768F")

    return (
        <>
            {/* Unichain */}
            <Divider />

            <ListItemButton sx={{ py: 2 }} onClick={() => setOpen(!open)}>
                <Box display="flex" alignItems="center" gap={2}>
                    <UnichainIcon />

                    <Box>
                        <Typography fontWeight="600">Unichain</Typography>
                        <Typography variant="caption" color="text.secondary">
                            1 token
                        </Typography>
                    </Box>

                    <Chip
                        label="UNICHAIN"
                        size="small"
                        sx={{ ml: 1, backgroundColor: "#3b82f633" }}
                    />
                </Box>

                <ListItemSecondaryAction
                    sx={{ display: "flex", alignItems: "center", gap: 1, pr: 2 }}
                >
                    <Typography fontWeight="600">${(Math.floor(Number(balance) * 100) / 100).toFixed(2)}</Typography>

                    {open ? (
                        <ExpandMoreIcon fontSize="small" color="disabled" />
                    ) : (
                        <ChevronRightIcon fontSize="small" color="disabled" />
                    )}
                </ListItemSecondaryAction>
            </ListItemButton>

            {/* Dropdown tokens */}
            <Collapse in={open} timeout="auto" unmountOnExit>
                <List sx={{ px: 4 }}>
                    <ListItem
                        sx={{
                            backgroundColor: "rgba(0,0,0,0.03)",
                            borderRadius: 2,
                            my: 1,
                            py: 1.5,
                            px: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
                        }}
                    >
                        <UsdcIcon size={28} />

                        <Box display="flex" flexDirection="column">
                            <Typography fontWeight="600">USDC</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Balance: {(Math.floor(Number(balance) * 100) / 100).toFixed(2)}
                            </Typography>
                        </Box>

                        {/* Reemplazo del ListItemSecondaryAction */}
                        <Box sx={{ ml: "auto", pr: 2 }}>
                            <Typography fontWeight="600">${(Math.floor(Number(balance) * 100) / 100).toFixed(2)}</Typography>
                        </Box>
                    </ListItem>
                </List>
            </Collapse>

        </>
    );
}
