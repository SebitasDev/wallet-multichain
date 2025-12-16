"use client";

import { Box, Typography, Button, Grid } from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import { useCTF } from "../hooks/useCTF";
import { PasswordModal } from "../components/PasswordModal";

import { useState } from "react";
import { CreateGameModal } from "./components/CreateGameModal";
import { GameDetailsModal, GameDetailsData } from "./components/GameDetailsModal";
import { ProfileView } from "./components/ProfileView";
import { GameCard } from "./components/GameCard";

export default function CTFPage() {
    const { games, loading, captureFlag, refresh, createGame, joinGame, address, needsPassword, setNeedsPassword, leaderboard, gameEvents, page, setPage, totalPages, totalGames, error } = useCTF();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<"lobby" | "profile">("lobby");

    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [selectedDetailsData, setSelectedDetailsData] = useState<GameDetailsData | null>(null);
    const [selectedGameAddress, setSelectedGameAddress] = useState("");
    const [selectedGameIsWinner, setSelectedGameIsWinner] = useState(false);

    const handleCreateGame = async (durationHours: number, costETH: string, rewardAmount: string) => {
        await createGame(durationHours, costETH, rewardAmount);
        setIsCreateModalOpen(false);
    };

    const handleOpenDetails = async (gameAddress: string, isWinner: boolean) => {
        setSelectedGameAddress(gameAddress);
        setSelectedGameIsWinner(isWinner);
        setDetailsModalOpen(true);
        setDetailsLoading(true);
        setSelectedDetailsData(null);

        try {
            const res = await fetch(`/api/ctf/game-details?gameAddress=${gameAddress}&userAddress=${address || ""}`);
            if (!res.ok) throw new Error("Failed to fetch details");
            const data = await res.json();
            setSelectedDetailsData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setDetailsLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
            <Box sx={{
                mb: 4,
                p: 3,
                border: "3px solid #000",
                borderRadius: 4,
                boxShadow: "6px 6px 0px #000",
                bgcolor: "#FF2E2E",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                        Captura la Bandera
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Edición Scroll Sepolia
                    </Typography>
                </Box>
                <FlagIcon sx={{ fontSize: 60 }} />
            </Box>

            <Box sx={{ mb: 4, display: "flex", justifyContent: "center", gap: 2 }}>
                <Button
                    onClick={() => setActiveTab("lobby")}
                    variant={activeTab === "lobby" ? "contained" : "outlined"}
                    sx={{
                        border: "2px solid #000",
                        boxShadow: activeTab === "lobby" ? "4px 4px 0px #000" : "none",
                        bgcolor: activeTab === "lobby" ? "black" : "transparent",
                        color: activeTab === "lobby" ? "white" : "black",
                        fontWeight: 900,
                        px: 4,
                        py: 1,
                        borderRadius: 0,
                        "&:hover": {
                            bgcolor: activeTab === "lobby" ? "#333" : "#eee",
                            boxShadow: "4px 4px 0px #000"
                        }
                    }}
                >
                    SALA
                </Button>
                <Button
                    onClick={() => setActiveTab("profile")}
                    variant={activeTab === "profile" ? "contained" : "outlined"}
                    sx={{
                        border: "2px solid #000",
                        boxShadow: activeTab === "profile" ? "4px 4px 0px #000" : "none",
                        bgcolor: activeTab === "profile" ? "black" : "transparent",
                        color: activeTab === "profile" ? "white" : "black",
                        fontWeight: 900,
                        px: 4,
                        py: 1,
                        borderRadius: 0,
                        "&:hover": {
                            bgcolor: activeTab === "profile" ? "#333" : "#eee",
                            boxShadow: "4px 4px 0px #000"
                        }
                    }}
                >
                    MI PERFIL
                </Button>
            </Box>

            {activeTab === "lobby" ? (
                <>
                    <Box sx={{ mb: 4, display: "flex", gap: 2, alignItems: "center" }}>
                        {address && (
                            <>
                                <Button
                                    variant="contained"
                                    onClick={() => setIsCreateModalOpen(true)}
                                    disabled={loading}
                                    sx={{
                                        border: "2px solid #000",
                                        boxShadow: "4px 4px 0px #000",
                                        bgcolor: "#00DC8C",
                                        color: "black",
                                        fontWeight: "bold",
                                        "&:hover": { bgcolor: "#00C27A" }
                                    }}
                                >
                                    {loading ? "Creando..." : "Crear Nuevo Evento"}
                                </Button>
                                <Typography sx={{ fontWeight: "bold" }}>
                                    {address.slice(0, 6)}...{address.slice(-4)}
                                </Typography>
                            </>
                        )}

                        <Button
                            onClick={() => refresh()}
                            variant="outlined"
                            sx={{
                                border: "2px solid #000",
                                boxShadow: "4px 4px 0px #000",
                                color: "black",
                                fontWeight: "bold",
                                bgcolor: "white"
                            }}
                        >
                            Actualizar
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        {[...games].sort((a, b) => {
                            if (a.isActive && !b.isActive) return -1;
                            if (!a.isActive && b.isActive) return 1;

                            if (!a.isActive && !b.isActive) {
                                const lbA = leaderboard[a.address];
                                const lbB = leaderboard[b.address];
                                const wonA = lbA?.top5?.[0]?.address?.toLowerCase() === address?.toLowerCase();
                                const wonB = lbB?.top5?.[0]?.address?.toLowerCase() === address?.toLowerCase();

                                if (wonA && !wonB) return -1;
                                if (!wonA && wonB) return 1;
                            }

                            return 0;
                        }).map((game) => (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={game.address}>
                                <GameCard
                                    game={game}
                                    leaderboardData={leaderboard[game.address]}
                                    address={address}
                                    loading={loading}
                                    onJoin={joinGame}
                                    onCapture={captureFlag}
                                    onOpenDetails={handleOpenDetails}
                                    lastEvent={gameEvents ? gameEvents[game.address] : undefined}
                                />
                            </Grid>
                        ))}
                    </Grid>

                    <Box sx={{ mt: 4, display: "flex", justifyContent: "center", gap: 2, alignItems: "center" }}>
                        <Button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            variant="outlined"
                            sx={{
                                border: "2px solid #000",
                                color: "black",
                                fontWeight: "bold",
                                "&.Mui-disabled": { borderColor: "#ccc", color: "#ccc" }
                            }}
                        >
                            Anterior
                        </Button>
                        <Typography sx={{ fontWeight: "bold" }}>
                            Página {page} de {totalPages} ({totalGames} Juegos)
                        </Typography>
                        <Button
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                            variant="outlined"
                            sx={{
                                border: "2px solid #000",
                                color: "black",
                                fontWeight: "bold",
                                "&.Mui-disabled": { borderColor: "#ccc", color: "#ccc" }
                            }}
                        >
                            Siguiente
                        </Button>
                    </Box>
                </>
            ) : (
                <ProfileView userAddress={address || ""} />
            )}

            <PasswordModal
                open={needsPassword}
                mode="unlock"
                onSuccess={() => setNeedsPassword(false)}
            />

            <CreateGameModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateGame}
                loading={loading}
            />

            <GameDetailsModal
                open={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                data={selectedDetailsData}
                loading={detailsLoading}
                gameAddress={selectedGameAddress}
                isWinner={selectedGameIsWinner}
            />
        </Box>
    );
}
