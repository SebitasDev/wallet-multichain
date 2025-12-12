import {useEffect, useState} from "react";
import {
    Box,
    Chip,
    Collapse,
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
import {useWalletStore} from "@/app/store/useWalletsStore";
import {polygon, polygonAmoy} from "viem/chains";
import PolygonIcon from "@/app/components/atoms/PolygonIcon";

interface IPolChainItemProps {
    address: Address;
}

export default function PolygonChainItem({ address } : IPolChainItemProps) {
    const [open, setOpen] = useState(false);
    const [balance, setBalance] = useState<number>(0);
    const { getWalletBalanceByChain } = useWalletStore();

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const chainId =
                    (process.env.NEXT_PUBLIC_ENVIROMENT === "development"
                            ? polygonAmoy.id
                            : polygon.id
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
            <ListItemButton
                sx={{
                    py: 2,
                    px: { xs: 2, sm: 3 },
                    transition: "all 0.2s",
                    "&:hover": {
                        backgroundColor: "#f5f5f5",
                    },
                }}
                onClick={() => setOpen(!open)}
            >
                <Box display="flex" alignItems="center" gap={{ xs: 1.5, sm: 2 }} flex={1} minWidth={0}>
                    <Box sx={{
                        width: { xs: 32, sm: 36 },
                        height: { xs: 32, sm: 36 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        "& svg": {
                            width: "100%",
                            height: "100%",
                        }
                    }}>
                        <PolygonIcon />
                    </Box>

                    <Box flex={1} minWidth={0}>
                        <Typography
                            fontWeight={800}
                            sx={{
                                fontSize: { xs: 14, sm: 15 },
                                color: "#000000"
                            }}
                        >
                            Polygon
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: "#666666",
                                fontWeight: 600,
                                fontSize: { xs: 11, sm: 12 }
                            }}
                        >
                            1 token
                        </Typography>
                    </Box>
                </Box>

                <ListItemSecondaryAction
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: { xs: 0.5, sm: 1 },
                        pr: { xs: 1, sm: 2 },
                        right: { xs: 8, sm: 16 },
                    }}
                >
                    <Typography
                        fontWeight={800}
                        sx={{
                            fontSize: { xs: 13, sm: 15 },
                            color: "#000000",
                            whiteSpace: "nowrap",
                        }}
                    >
                        ${(Math.floor(Number(balance) * 100) / 100).toFixed(2)}
                    </Typography>

                    <Chip
                        label="POL"
                        size="small"
                        sx={{
                            backgroundColor: "#8247E5",
                            border: "2px solid #000000",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: { xs: 10, sm: 11 },
                            height: { xs: 22, sm: 24 },
                            "& .MuiChip-label": {
                                px: { xs: 1, sm: 1.5 },
                            }
                        }}
                    />

                    {open ? (
                        <ExpandMoreIcon
                            sx={{
                                fontSize: { xs: 18, sm: 20 },
                                color: "#000000"
                            }}
                        />
                    ) : (
                        <ChevronRightIcon
                            sx={{
                                fontSize: { xs: 18, sm: 20 },
                                color: "#000000"
                            }}
                        />
                    )}
                </ListItemSecondaryAction>
            </ListItemButton>

            {/* Dropdown tokens */}
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{ px: { xs: 2, sm: 4 }, py: 1.5, backgroundColor: "#f5f5f5" }}>
                    <List disablePadding>
                        <ListItem
                            sx={{
                                backgroundColor: "#ffffff",
                                border: "2px solid #000000",
                                borderRadius: 3,
                                py: 1.5,
                                px: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                transition: "all 0.2s",
                                "&:hover": {
                                    backgroundColor: "#f5f5f5",
                                    transform: "translateX(4px)",
                                },
                            }}
                        >
                            <Box sx={{
                                width: 32,
                                height: 32,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <UsdcIcon size={32} />
                            </Box>

                            <Box display="flex" flexDirection="column" flex={1} minWidth={0}>
                                <Typography
                                    fontWeight={800}
                                    sx={{
                                        fontSize: { xs: 13, sm: 14 },
                                        color: "#000000"
                                    }}
                                >
                                    USDC
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "#666666",
                                        fontWeight: 600,
                                        fontSize: { xs: 11, sm: 12 }
                                    }}
                                >
                                    Balance: {(Math.floor(Number(balance) * 100) / 100).toFixed(2)}
                                </Typography>
                            </Box>

                            <Box sx={{ flexShrink: 0 }}>
                                <Typography
                                    fontWeight={800}
                                    sx={{
                                        fontSize: { xs: 13, sm: 14 },
                                        color: "#000000"
                                    }}
                                >
                                    ${(Math.floor(Number(balance) * 100) / 100).toFixed(2)}
                                </Typography>
                            </Box>
                        </ListItem>
                    </List>
                </Box>
            </Collapse>
        </>
    );
}