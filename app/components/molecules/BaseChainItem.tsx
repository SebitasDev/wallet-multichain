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
import {BaseIcon} from "@/app/components/atoms/BaseIcon";
import {UsdcIcon} from "@/app/components/atoms/UsdcIcon";
import {arbitrum, arbitrumSepolia, base, baseSepolia} from "viem/chains";
import {Address} from "abitype";
import {useWalletStore} from "@/app/store/useWalletsStore";

interface IBaseChainItemProps {
    address: Address;
}

export default function BaseChainItem({ address } : IBaseChainItemProps) {
    const [open, setOpen] = useState(false);
    const [balance, setBalance] = useState<number>(0);
    const { getWalletBalanceByChain } = useWalletStore();


    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const chainId =
                    (process.env.NEXT_PUBLIC_ENVIROMENT === "development"
                            ? baseSepolia.id
                            : base.id
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
                        sx={{
                            ml: 1,
                            backgroundColor: "rgba(59,212,246,0.2)",
                            border: "1px solid #5AF1FF",
                            boxShadow: "0 0 6px #5AF1FF",
                            color: "#5AF1FF",
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
