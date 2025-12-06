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
import {OPIcon} from "@/app/components/atoms/OPIcon";
import {UsdcIcon} from "@/app/components/atoms/UsdcIcon";
import {Address} from "abitype";
import {useGetBalanceFromChain} from "@/app/hook/useGetBalanceFromChain";
import {optimism, optimismSepolia} from "viem/chains";

interface IOptimismChainItemProps {
    address: Address;
}

export default function OptimismChainItem({ address } : IOptimismChainItemProps) {
    const [open, setOpen] = useState(false);

    const { balance } = useGetBalanceFromChain(
        process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? optimismSepolia : optimism,
        address,
        process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"
            : "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"
    );

    return (
        <>
            <Divider />

            <ListItemButton sx={{ py: 2 }} onClick={() => setOpen(!open)}>
                <Box display="flex" alignItems="center" gap={2}>
                    <OPIcon />

                    <Box>
                        <Typography fontWeight="600">Optimism</Typography>
                        <Typography variant="caption" color="text.secondary">
                            1 token
                        </Typography>
                    </Box>

                    <Chip
                        label="OP"
                        size="small"
                        sx={{
                            ml: 1,
                            backgroundColor: "#ef444433",
                            border: "1px solid #FF4747",
                            boxShadow: "0 0 6px #FF4747",
                            color: "#FF4747",
                            fontWeight: 600
                        }}
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

            {/* Tokens de Optimism */}
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
