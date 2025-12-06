import {useEffect, useState} from "react";
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
import {optimism, optimismSepolia} from "viem/chains";
import {useWalletStore} from "@/app/store/useWalletsStore";

interface IOptimismChainItemProps {
    address: Address;
}

export default function OptimismChainItem({ address } : IOptimismChainItemProps) {
    const [open, setOpen] = useState(false);
    const [balance, setBalance] = useState<number>(0);
    const { getWalletBalanceByChain } = useWalletStore();


    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const chainId =
                    (process.env.NEXT_PUBLIC_ENVIROMENT === "development"
                            ? optimismSepolia.id
                            : optimism.id
                    ).toString();

                const bal = await getWalletBalanceByChain(address, chainId);
                setBalance(Number(bal));
            } catch (err) {
                console.error("Error al obtener balance:", err);
            }
        };

        fetchBalance();
    }, [address, getWalletBalanceByChain]);

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
