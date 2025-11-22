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

import CeloIcon from "@/app/components/atoms/CeloIcon";
import {UsdcIcon} from "@/app/components/atoms/UsdcIcon";
import {Address} from "abitype";
import {useGetBalanceFromChain} from "@/app/hook/useGetBalanceFromChain";
import {celoSepolia} from "viem/chains"; // tu ícono

interface ICeloChainItemProps {
    address: Address;
}

export default function CeloChainItem({ address } : ICeloChainItemProps) {
    const [open, setOpen] = useState(false);

    const { balance } = useGetBalanceFromChain(celoSepolia, address, "0x01C5C0122039549AD1493B8220cABEdD739BC44E")

    return (
        <>
            {/* Celo */}
            <Divider />

            <ListItemButton sx={{ py: 2 }} onClick={() => setOpen(!open)}>
                <Box display="flex" alignItems="center" gap={2}>
                    <CeloIcon />

                    <Box>
                        <Typography fontWeight="600">Celo</Typography>
                        <Typography variant="caption" color="text.secondary">
                            1 token
                        </Typography>
                    </Box>

                    <Chip
                        label="CELO"
                        size="small"
                        sx={{ ml: 1, backgroundColor: "#facc1533" }} // amarillo suave
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
