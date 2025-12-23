"use client";

import { Box, Typography, Card, CardActionArea, CardContent, Stack } from "@mui/material";
import { TopBar } from "@/app/dashboard/components/TopBar";
import { useRouter } from "next/navigation";

import SavingsIcon from '@mui/icons-material/Savings';
import ShowChartIcon from '@mui/icons-material/ShowChart';

export default function YieldSelectionPage() {
    const router = useRouter();

    return (
        <Box sx={{ minHeight: "100vh", pb: 4, bgcolor: "#f5f5f5" }}>
            <TopBar />

            <Box sx={{ maxWidth: 1000, mx: "auto", px: 3, mt: 6 }}>
                <Typography
                    variant="h3"
                    sx={{
                        fontWeight: 900,
                        textTransform: "uppercase",
                        textAlign: "center",
                        mb: 1
                    }}
                >
                    Yield Strategies
                </Typography>

                <Typography sx={{ textAlign: "center", color: "text.secondary", mb: 6 }}>
                    Selecciona tu estrategia de rendimiento preferida
                </Typography>

                <Stack direction={{ xs: "column", md: "row" }} spacing={4} justifyContent="center">

                    {/* EVM Strategy */}
                    <Card
                        sx={{
                            flex: 1,
                            maxWidth: 400,
                            borderRadius: 4,
                            border: "3px solid #000000",
                            boxShadow: "8px 8px 0px #000000",
                            transition: "transform 0.2s",
                            "&:hover": {
                                transform: "translate(-2px, -2px)",
                                boxShadow: "10px 10px 0px #000000",
                            }
                        }}
                    >
                        <CardActionArea
                            onClick={() => router.push("/dashboard/yield/evm")}
                            sx={{ height: "100%", p: 4 }}
                        >
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <Box sx={{
                                    p: 2,
                                    borderRadius: "50%",
                                    bgcolor: "rgba(0, 110, 255, 0.1)",
                                    color: "#006EFF"
                                }}>
                                    <SavingsIcon sx={{ fontSize: 40 }} />
                                </Box>
                                <Typography variant="h5" fontWeight={800}>
                                    EVM Savings
                                </Typography>
                                <Typography variant="body2" color="text.secondary" textAlign="center">
                                    Genera rendimiento con USDC en redes EVM (Base, Optimism, etc.) usando Spark.fi.
                                </Typography>
                                <Stack direction="row" spacing={1} mt={2}>
                                    {/* Mock Chips */}
                                    <Box sx={{ bgcolor: "#eee", px: 1, borderRadius: 1, fontSize: 10, fontWeight: 700 }}>APR 15%</Box>
                                    <Box sx={{ bgcolor: "#eee", px: 1, borderRadius: 1, fontSize: 10, fontWeight: 700 }}>Low Risk</Box>
                                </Stack>
                            </Box>
                        </CardActionArea>
                    </Card>

                    {/* Stellar Strategy */}
                    <Card
                        sx={{
                            flex: 1,
                            maxWidth: 400,
                            borderRadius: 4,
                            border: "3px solid #000000",
                            boxShadow: "8px 8px 0px #000000",
                            transition: "transform 0.2s",
                            "&:hover": {
                                transform: "translate(-2px, -2px)",
                                boxShadow: "10px 10px 0px #000000",
                            }
                        }}
                    >
                        <CardActionArea
                            onClick={() => router.push("/dashboard/yield/stellar")}
                            sx={{ height: "100%", p: 4 }}
                        >
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <Box sx={{
                                    p: 2,
                                    borderRadius: "50%",
                                    bgcolor: "rgba(255, 100, 255, 0.1)",
                                    color: "#AA00FF"
                                }}>
                                    <ShowChartIcon sx={{ fontSize: 40 }} />
                                </Box>
                                <Typography variant="h5" fontWeight={800}>
                                    Stellar Yield
                                </Typography>
                                <Typography variant="body2" color="text.secondary" textAlign="center">
                                    Participa en mercados de lending en la red Stellar (Blend Protocol).
                                </Typography>
                                <Stack direction="row" spacing={1} mt={2}>
                                    <Box sx={{ bgcolor: "#eee", px: 1, borderRadius: 1, fontSize: 10, fontWeight: 700 }}>APR Variable</Box>
                                    <Box sx={{ bgcolor: "#eee", px: 1, borderRadius: 1, fontSize: 10, fontWeight: 700 }}>Blend</Box>
                                </Stack>
                            </Box>
                        </CardActionArea>
                    </Card>

                </Stack>
            </Box>
        </Box>
    );
}
