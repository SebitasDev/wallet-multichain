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
import {BaseIcon} from "@/app/components/atoms/BaseIcon";
import {UsdcIcon} from "@/app/components/atoms/UsdcIcon";
import {useGetBalanceFromChain} from "@/app/hook/useGetBalanceFromChain";
import {baseSepolia} from "viem/chains";
import {Address} from "abitype";

interface IBaseChainItemProps {
    address: Address;
}

export default function BaseChainItem({ address } : IBaseChainItemProps) {
    const [open, setOpen] = useState(false);
    const { balance } = useGetBalanceFromChain(baseSepolia, address, "0x036CbD53842c5426634e7929541eC2318f3dCF7e")

    return (
        <>
            {/* Base */}
            <Divider />

            <ListItemButton sx={{ py: 2 }} onClick={() => setOpen(!open)}>
                <Box display="flex" alignItems="center" gap={2}>
                    <BaseIcon />

                    <Box>
                        <Typography fontWeight="600">Base</Typography>
                        <Typography variant="caption" color="text.secondary">
                            1 token
                        </Typography>
                    </Box>

                    <Chip
                        label="BASE"
                        size="small"
                        sx={{ ml: 1, backgroundColor: "#3b82f633" }}
                    />
                </Box>

                <ListItemSecondaryAction
                    sx={{ display: "flex", alignItems: "center", gap: 1, pr: 2 }}
                >
                    <Typography fontWeight="600">${balance}</Typography>

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
                                Balance: {balance}
                            </Typography>
                        </Box>

                        {/* Reemplazo del ListItemSecondaryAction */}
                        <Box sx={{ ml: "auto", pr: 2 }}>
                            <Typography fontWeight="600">${balance}</Typography>
                        </Box>
                    </ListItem>
                </List>
            </Collapse>

        </>
    );
}
