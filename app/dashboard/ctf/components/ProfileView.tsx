import { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper, CircularProgress, Chip } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import TimerIcon from "@mui/icons-material/Timer";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";

interface ProfileStats {
    gamesCreated: number;
    gamesWon: number;
    totalTransactions: number;
    totalDeposited: number;
    totalWon: number;
    maxHoldTime: number;
}

interface ProfileViewProps {
    userAddress: string;
}

export function ProfileView({ userAddress }: ProfileViewProps) {
    const [stats, setStats] = useState<ProfileStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/ctf/profile?userAddress=${userAddress}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch profile stats", error);
            } finally {
                setLoading(false);
            }
        };

        if (userAddress) {
            fetchStats();
        }
    }, [userAddress]);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
                <CircularProgress sx={{ color: "black" }} />
            </Box>
        );
    }

    if (!stats) return null;

    const cards = [
        {
            label: "Juegos Ganados",
            value: stats.gamesWon,
            icon: <EmojiEventsIcon sx={{ fontSize: 40, color: "#00DC8C" }} />,
            color: "#E0F7FA"
        },
        {
            label: "Ganancias Totales",
            value: `${stats.totalWon} USDC`,
            icon: <MonetizationOnIcon sx={{ fontSize: 40, color: "#FFD700" }} />,
            color: "#FFF9C4"
        },
        {
            label: "Tiempo Máx. Retenido",
            value: `${stats.maxHoldTime}s`,
            icon: <TimerIcon sx={{ fontSize: 40 }} />,
            color: "#F3E5F5"
        },
        {
            label: "Juegos Creados",
            value: stats.gamesCreated,
            icon: <SportsEsportsIcon sx={{ fontSize: 40 }} />,
            color: "#E8EAF6"
        },
        {
            label: "Total Depositado",
            value: `${stats.totalDeposited} USDC`,
            icon: <VolunteerActivismIcon sx={{ fontSize: 40 }} />,
            color: "#FFEBEE"
        },
        {
            label: "Txns Totales",
            value: stats.totalTransactions,
            icon: <ReceiptLongIcon sx={{ fontSize: 40 }} />,
            color: "#E0F2F1"
        }
    ];

    return (
        <Box sx={{ mt: 4, px: 2 }}>
            <Box sx={{ textAlign: "center", mb: 6 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>
                    Tu Leyenda
                </Typography>
                <Chip
                    label={userAddress}
                    sx={{
                        mt: 1,
                        fontWeight: "bold",
                        fontFamily: "monospace",
                        bgcolor: "black",
                        color: "white",
                        borderRadius: 0
                    }}
                />
            </Box>

            <Grid container spacing={4} justifyContent="center">
                {cards.map((card, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                        <Paper sx={{
                            p: 3,
                            border: "4px solid #000",
                            boxShadow: "8px 8px 0px #000",
                            borderRadius: 0,
                            bgcolor: card.color,
                            transition: "transform 0.2s",
                            "&:hover": {
                                transform: "translate(-4px, -4px)",
                                boxShadow: "12px 12px 0px #000"
                            },
                            minHeight: 180,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between"
                        }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase", opacity: 0.7 }}>
                                    {card.label}
                                </Typography>
                                <Box sx={{
                                    border: "2px solid #000",
                                    p: 0.5,
                                    bgcolor: "white",
                                    display: "flex",
                                    boxShadow: "2px 2px 0px #000"
                                }}>
                                    {card.icon}
                                </Box>
                            </Box>

                            <Typography sx={{
                                fontWeight: 900,
                                mt: 2,
                                textAlign: "right",
                                fontSize: { xs: "1.8rem", md: "3rem" },
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                            }}>
                                {card.value}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
