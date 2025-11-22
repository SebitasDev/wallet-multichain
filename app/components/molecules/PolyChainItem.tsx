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
import {Address} from "abitype";
import {useGetBalanceFromChain} from "@/app/hook/useGetBalanceFromChain";
import PolyIcon from "@/app/components/atoms/PolyIcon";
import {polygonAmoy} from "viem/chains";

interface IPolChainItemProps {
    address: Address;
}

export default function PolyChainItem({ address } : IPolChainItemProps) {
    const [open, setOpen] = useState(false);

    const { balance } = useGetBalanceFromChain(polygonAmoy, address, "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582")

    return (
        <>
            {/* POL */}
            <Divider />

            <ListItemButton sx={{ py: 2 }} onClick={() => setOpen(!open)}>
                <Box display="flex" alignItems="center" gap={2}>
                    <PolyIcon />

                    <Box>
                        <Typography fontWeight="600">Polygon</Typography>
                        <Typography variant="caption" color="text.secondary">
                            1 token
                        </Typography>
                    </Box>

                    <Chip
                        label="POLYGON"
                        size="small"
                        sx={{ ml: 1, backgroundColor: "#facc1533" }} // amarillo suave
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
