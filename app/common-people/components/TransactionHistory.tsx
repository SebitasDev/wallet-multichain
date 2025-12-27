
"use client";

import { Box, Typography, Button, List, ListItem, ListItemText, ListItemAvatar } from "@mui/material";
import { NorthEast } from "@mui/icons-material";
import { useLanguageStore } from "@/app/store/useLanguageStore";

export function TransactionHistory() {
    const { language } = useLanguageStore();

    // Mock data translations
    const transactions = [
        {
            id: 1,
            type: "received",
            title: "1llet Boost",
            time: language === "es" ? "Hace 23 h" : "23h ago",
            amount: "+$<0.01",
            color: "#dcfce7", // Light green
        },
        {
            id: 2,
            type: "received",
            title: "1llet Boost",
            time: language === "es" ? "Anteayer" : "Day before yesterday",
            amount: "+$<0.01",
            color: "#dcfce7",
        },
        {
            id: 3,
            type: "received",
            title: "1llet Boost",
            time: language === "es" ? "Hace 3 días" : "3 days ago",
            amount: "+$<0.01",
            color: "#dcfce7",
        }
    ];

    return (
        <Box
            id="common-transactions"
            sx={{
                backgroundColor: "#2c2d35",
                color: "white",
                border: "3px solid #000000",
                borderRadius: "24px",
                p: 3,
                boxShadow: "8px 8px 0px #000000",
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                    {language === "es" ? "Actividad reciente" : "Recent Activity"}
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    sx={{
                        backgroundColor: "#4b5563",
                        color: "white",
                        border: "2px solid #000000",
                        fontWeight: "bold",
                        textTransform: "none",
                        borderRadius: "8px",
                        boxShadow: "none",
                        "&:hover": {
                            backgroundColor: "#374151",
                            boxShadow: "none",
                        },
                    }}
                >
                    {language === "es" ? "Ver más" : "View more"}
                </Button>
            </Box>

            <List disablePadding>
                {transactions.map((tx) => (
                    <ListItem
                        key={tx.id}
                        disableGutters
                        sx={{
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                            "&:hover": {
                                backgroundColor: "rgba(255,255,255,0.05)",
                                borderRadius: "12px",
                            },
                            px: 1,
                        }}
                    >
                        <ListItemAvatar>
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    backgroundColor: tx.color,
                                    borderRadius: "50%",
                                    border: "2px solid #000000",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <NorthEast sx={{ fontSize: 24, color: "#0f766e" }} />
                            </Box>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography fontWeight="bold" fontSize={16}>
                                    {tx.title}
                                </Typography>
                            }
                            secondary={
                                <Typography fontSize={14} color="gray" fontWeight="medium">
                                    {tx.time}
                                </Typography>
                            }
                        />
                        <Typography
                            sx={{
                                color: "#34d399",
                                fontWeight: "bold",
                                fontSize: 18,
                            }}
                        >
                            {tx.amount}
                        </Typography>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}
