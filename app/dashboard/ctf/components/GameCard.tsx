import { useState } from "react";
import {
    Card,
    CardContent,
    Box,
    Chip,
    Typography,
    Button,
    Tooltip,
    IconButton,
    Collapse
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import TimerIcon from "@mui/icons-material/Timer";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { GameData, LeaderboardData } from "../../hooks/features/useCTF";

interface GameCardProps {
    game: GameData;
    leaderboardData?: LeaderboardData;
    address: string | null;
    loading: boolean;
    onJoin: (address: `0x${string}`) => void;
    onCapture: (address: `0x${string}`, fee: string) => void;
    onOpenDetails: (address: string, isWinner: boolean) => void;
    // New: Mini-notification event
    lastEvent?: { text: string, type: 'join' | 'capture', timestamp: number };
}

export function GameCard({ game, leaderboardData, address, loading, onJoin, onCapture, onOpenDetails, lastEvent }: GameCardProps) {
    const [expanded, setExpanded] = useState(false);

    const isTimeExpired = game.timeLeft <= 0;
    const isGameActive = game.isActive && !isTimeExpired;

    const isWinner = !isGameActive && leaderboardData?.top5?.[0]?.address?.toLowerCase() === address?.toLowerCase();
    const isHolder = isGameActive && game.holder.toLowerCase() === address?.toLowerCase();

    return (
        <Card sx={{
            border: "3px solid #000",
            borderRadius: 4,
            boxShadow: "6px 6px 0px #000",
            bgcolor: isGameActive ? "white" : "#f0f0f0",
            transition: "transform 0.2s",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            "&:hover": { transform: "translate(-2px, -2px)" }
        }}>
            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Chip
                            label={isGameActive ? "ACTIVO" : isWinner ? "GANADO 🏆" : "TERMINADO"}
                            sx={{
                                bgcolor: isGameActive ? "#00DC8C" : isWinner ? "#00DC8C" : "#999",
                                border: "2px solid #000",
                                fontWeight: "bold",
                                color: isWinner || isGameActive ? "black" : "white"
                            }}
                        />
                        <Tooltip title="Ver Detalles">
                            <IconButton
                                size="small"
                                onClick={() => onOpenDetails(game.address, isWinner)}
                                sx={{
                                    border: "2px solid #000",
                                    bgcolor: "white",
                                    width: 32,
                                    height: 32,
                                    "&:hover": { bgcolor: "#eee" }
                                }}
                            >
                                <RemoveRedEyeIcon fontSize="small" sx={{ color: "black" }} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <Chip
                            icon={<EmojiEventsIcon />}
                            label={`${game.rewardPool} USDC`}
                            sx={{
                                bgcolor: "#FFD700",
                                border: "2px solid #000",
                                fontWeight: "bold"
                            }}
                        />
                        {lastEvent && (Date.now() - lastEvent.timestamp < 10000) && (
                            <Typography
                                variant="caption"
                                sx={{
                                    mt: 0.5,
                                    fontWeight: "bold",
                                    color: lastEvent.type === 'capture' ? '#FF2E2E' : '#3B82F6',
                                    animation: 'fadeIn 0.5s',
                                    "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } }
                                }}
                            >
                                {lastEvent.text}
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    Anfitrión: {game.address.slice(0, 6)}...{game.address.slice(-4)}
                </Typography>

                <Box sx={{ my: 2, p: 2, border: "2px dashed #000", borderRadius: 2 }}>
                    <Typography variant="h5" fontWeight={900}>GLORIA</Typography>
                    <Typography variant="caption">Premio</Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Poseedor Actual:
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#FF2E2E", fontWeight: 900 }}>
                        {game.holder === "0x0000000000000000000000000000000000000000" ? "Ninguno" :
                            `${game.holder.slice(0, 6)}...${game.holder.slice(-4)}`}
                    </Typography>
                </Box>

                <Box sx={{ mb: 2, p: 1, bgcolor: "#f8f9fa", borderRadius: 2, border: "1px solid #ddd" }}>
                    <Box
                        onClick={() => setExpanded(!expanded)}
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer"
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>🏆 MEJORES JUGADORES</Typography>
                        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </Box>

                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 1 }}>
                            {leaderboardData?.top5.map((entry) => (
                                <Box key={entry.address} sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", mb: 0.5 }}>
                                    <Box
                                        component="a"
                                        href={`https://sepolia.scrollscan.com/txs?a=${game.address}&q=${entry.address}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            textDecoration: "none",
                                            color: "inherit",
                                            display: "flex",
                                            alignItems: "center",
                                            "&:hover": { color: "#2196F3", textDecoration: "underline" }
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ fontWeight: entry.address === address?.toLowerCase() ? "bold" : "normal" }}>
                                            {entry.rank}. {entry.address.slice(0, 6)}...
                                            {game.holder && entry.address.toLowerCase() === game.holder.toLowerCase() && " 👑"}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption">{entry.totalDuration}s</Typography>
                                </Box>
                            ))}

                            {leaderboardData?.userRank && leaderboardData.userRank.rank > 5 && (
                                <>
                                    <Typography variant="caption" display="block" align="center" sx={{ my: 0.5 }}>...</Typography>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "blue", fontWeight: "bold" }}>
                                        <Typography variant="caption">
                                            {leaderboardData.userRank.rank}. Tú
                                        </Typography>
                                        <Typography variant="caption">{leaderboardData.userRank.totalDuration}s</Typography>
                                    </Box>
                                </>
                            )}
                            {!leaderboardData && <Typography variant="caption">Cargando...</Typography>}
                        </Box>
                    </Collapse>
                    {!expanded && leaderboardData?.top5?.[0] && (
                        <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", mt: 0.5, opacity: 0.7 }}>
                            <Box
                                component="a"
                                href={`https://sepolia.scrollscan.com/txs?a=${game.address}&q=${leaderboardData.top5[0].address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    textDecoration: "none",
                                    color: "inherit",
                                    "&:hover": { color: "#2196F3", textDecoration: "underline" }
                                }}
                            >
                                <Typography variant="caption">
                                    1. {leaderboardData.top5[0].address.slice(0, 6)}...
                                </Typography>
                            </Box>
                            <Typography variant="caption">{leaderboardData.top5[0].totalDuration}s</Typography>
                        </Box>
                    )}
                </Box>

                <Box sx={{ mt: "auto", display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <TimerIcon />
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        {Math.floor(game.timeLeft / 60)}m {game.timeLeft % 60}s
                    </Typography>

                    {leaderboardData?.userRank && leaderboardData.userRank.totalDuration > 0 && (
                        <Typography variant="body2" sx={{ ml: 1, color: "text.secondary", fontWeight: "bold" }}>
                            (Tu Tiempo: {leaderboardData.userRank.totalDuration}s)
                        </Typography>
                    )}
                </Box>

                {(() => {
                    if (!game.hasJoined && isGameActive) {
                        return (
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => onJoin(game.address)}
                                disabled={loading}
                                sx={{
                                    bgcolor: "#3B82F6",
                                    color: "white",
                                    border: "2px solid #000",
                                    boxShadow: "3px 3px 0px #000",
                                    fontWeight: 900,
                                    py: 1.5,
                                    "&:hover": { bgcolor: "#2563EB" }
                                }}
                            >
                                UNIRSE AL JUEGO
                            </Button>
                        );
                    }

                    if (isWinner || isHolder) {
                        return (
                            <Box sx={{ position: "relative", overflow: "visible" }}>
                                {isWinner && (
                                    <Box sx={{
                                        position: "absolute",
                                        top: -60,
                                        left: 0,
                                        width: "100%",
                                        height: 60,
                                        overflow: "hidden",
                                        zIndex: 20,
                                        pointerEvents: "none"
                                    }}>
                                        <Box
                                            component="img"
                                            src="https://i.gifer.com/origin/c5/c5db38375f8f93e17b30049a63f15c81_w200.gif"
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                width: 60,
                                                height: 60,
                                                animation: "moveRightToLeft 10s linear infinite",
                                                "@keyframes moveRightToLeft": {
                                                    "0%": { right: "-60px" },
                                                    "100%": { right: "100%" }
                                                }
                                            }}
                                        />
                                    </Box>
                                )}

                                <Button
                                    fullWidth
                                    disabled
                                    variant="contained"
                                    sx={{
                                        bgcolor: isWinner ? "#00DC8C !important" : "#FFD700 !important",
                                        color: "black !important",
                                        border: "2px solid #000",
                                        fontWeight: 900,
                                        py: 1.5,
                                        opacity: "1 !important",
                                        zIndex: 5
                                    }}
                                >
                                    {isWinner ? "👑 HAS GANADO LA BANDERA 👑" : "👑 TIENES LA BANDERA 👑"}
                                </Button>

                                {isHolder && (
                                    <>
                                        <Box
                                            component="img"
                                            src="https://media.tenor.com/xvuKYkJX388AAAAj/vibe-dancing.gif"
                                            sx={{
                                                position: "absolute",
                                                top: -30,
                                                right: -10,
                                                width: 50,
                                                height: 50,
                                                zIndex: 30
                                            }}
                                        />
                                        <Box
                                            component="img"
                                            src="https://media.tenor.com/yRSnf6wABQ4AAAAj/pato-duck.gif"
                                            sx={{
                                                position: "absolute",
                                                bottom: -15,
                                                left: -15,
                                                width: 40,
                                                height: 40,
                                                zIndex: 30
                                            }}
                                        />
                                    </>
                                )}
                            </Box>
                        );
                    }

                    return (
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => onCapture(game.address, "0.001")}
                            disabled={!isGameActive || loading}
                            sx={{
                                bgcolor: !isGameActive ? "#999" : "#FF2E2E",
                                color: "white",
                                border: "2px solid #000",
                                boxShadow: "3px 3px 0px #000",
                                fontWeight: 900,
                                py: 1.5,
                                "&:hover": { bgcolor: !isGameActive ? "#999" : "#D90000" }
                            }}
                        >
                            {!isGameActive ? "JUEGO TERMINADO" : "CAPTURAR BANDERA (0.001 ETH)"}
                        </Button>
                    );
                })()}
            </CardContent>
        </Card>
    );
}
