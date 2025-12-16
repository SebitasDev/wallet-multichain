import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Chip,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Divider
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleIcon from "@mui/icons-material/People";
import TimerIcon from "@mui/icons-material/Timer";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export interface GameDetailsData {
    totalTransactions: number;
    totalPlayers: number;
    allPlayers: {
        rank: number;
        address: string;
        totalDuration: number;
    }[];
    userStats: {
        rank: number | null;
        address: string;
        totalDuration: number;
    } | null;
    rewardAmount?: string;
}

interface GameDetailsModalProps {
    open: boolean;
    onClose: () => void;
    data: GameDetailsData | null;
    loading: boolean;
    gameAddress: string;
    isWinner: boolean;
}

export function GameDetailsModal({ open, onClose, data, loading, gameAddress, isWinner }: GameDetailsModalProps) {

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            scroll="paper"
            PaperProps={{
                sx: {
                    borderRadius: 0,
                    border: "4px solid #000",
                    boxShadow: "10px 10px 0px #000",
                    overflow: "hidden"
                }
            }}
        >
            {loading || !data ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                    <CircularProgress sx={{ color: "black" }} />
                </Box>
            ) : (
                <>
                    <DialogTitle sx={{ p: 4, pb: 1, textAlign: "center", bgcolor: "white" }}>
                        <Typography component="div" variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>
                            Detalles del Juego
                        </Typography>
                        <Box
                            component="a"
                            href={`https://sepolia.scrollscan.com/address/${gameAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 1,
                                textDecoration: "none",
                                color: "text.secondary",
                                cursor: "pointer",
                                mt: 1,
                                py: 0.5,
                                px: 1,
                                border: "2px solid transparent",
                                "&:hover": {
                                    color: "black",
                                    border: "2px solid #000",
                                    bgcolor: "#e0e0e0"
                                }
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: "bold", fontFamily: "monospace", fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
                                {gameAddress.slice(0, 10)}...{gameAddress.slice(-8)}
                            </Typography>
                            <OpenInNewIcon fontSize="inherit" sx={{ fontSize: 14 }} />
                        </Box>
                    </DialogTitle>

                    <DialogContent dividers sx={{ p: { xs: 2, sm: 4 }, bgcolor: "white" }}>

                        {isWinner && (
                            <Box sx={{ mb: 3, textAlign: 'center' }}>
                                <Box sx={{
                                    display: "inline-block",
                                    bgcolor: "#00DC8C",
                                    border: "3px solid #000",
                                    boxShadow: "4px 4px 0px #000",
                                    px: 3,
                                    py: 1,
                                    fontWeight: 900,
                                    fontSize: "1rem"
                                }}>
                                    🏆 GANASTE ESTE JUEGO 🏆
                                </Box>
                            </Box>
                        )}

                        <Box sx={{ textAlign: 'center' }}>
                            {data && data.rewardAmount && data.rewardAmount !== "0" && (
                                <Chip
                                    icon={<EmojiEventsIcon />}
                                    label={`${data.rewardAmount} USDC`}
                                    sx={{
                                        mb: 2,
                                        fontWeight: "bold",
                                        bgcolor: "#FFD700",
                                        color: "black",
                                        border: "2px solid #000",
                                        boxShadow: "4px 4px 0px #000"
                                    }}
                                />
                            )}
                        </Box>

                        <Box sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 3,
                            mb: 4,
                            flexWrap: "wrap"
                        }}>
                            <Box sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                border: "3px solid #000",
                                boxShadow: "4px 4px 0px #000",
                                px: 2,
                                py: 1,
                                bgcolor: "white"
                            }}>
                                <ReceiptLongIcon />
                                <Typography sx={{ fontWeight: "bold", fontSize: { xs: "0.9rem", sm: "1rem" } }}>{data.totalTransactions} Txns</Typography>
                            </Box>

                            <Box sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                border: "3px solid #000",
                                boxShadow: "4px 4px 0px #000",
                                px: 2,
                                py: 1,
                                bgcolor: "white"
                            }}>
                                <PeopleIcon />
                                <Typography sx={{ fontWeight: "bold", fontSize: { xs: "0.9rem", sm: "1rem" } }}>{data.allPlayers.length} Jugadores</Typography>
                            </Box>
                        </Box>

                        {data.userStats && (
                            <Box sx={{
                                border: "3px solid #000",
                                boxShadow: "6px 6px 0px #000",
                                p: 3,
                                mb: 4,
                                textAlign: "left",
                                bgcolor: "#E3F2FD" // Light blue accent
                            }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, textTransform: "uppercase", color: "#1565C0", mb: 2 }}>
                                    Tu Rendimiento
                                </Typography>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: "bold", opacity: 0.7 }}>Rango</Typography>
                                        <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: "2.5rem", sm: "3rem" } }}>
                                            {data.userStats.rank ? `#${data.userStats.rank}` : "-"}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: "right" }}>
                                        <Typography variant="caption" sx={{ fontWeight: "bold", opacity: 0.7 }}>Tiempo Retenido</Typography>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}>
                                            <TimerIcon fontSize="small" />
                                            <Typography variant="h4" sx={{ fontWeight: 900, fontSize: { xs: "2rem", sm: "2.5rem" } }}>
                                                {data.userStats ? `${data.userStats.totalDuration}s` : "0s"}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        <Typography variant="h6" sx={{ fontWeight: 900, textAlign: "left", mb: 2, textTransform: "uppercase" }}>
                            Tabla de Clasificación Global
                        </Typography>

                        <Box sx={{
                            maxHeight: 200,
                            overflowY: "auto",
                            border: "3px solid #000",
                            "&::-webkit-scrollbar": { width: "8px" },
                            "&::-webkit-scrollbar-thumb": { background: "#000" }
                        }}>
                            <List disablePadding>
                                {data.allPlayers.length === 0 ? (
                                    <ListItem>
                                        <ListItemText
                                            secondary="Aún no hay poseedores"
                                            secondaryTypographyProps={{ textAlign: "center", fontStyle: "italic" }}
                                        />
                                    </ListItem>
                                ) : (
                                    data.allPlayers.map((player, index) => (
                                        <ListItem
                                            key={player.address}
                                            divider={index !== data.allPlayers.length - 1}
                                            sx={{
                                                bgcolor: player.rank === 1 ? "#FFF9C4" : index % 2 === 0 ? "white" : "#f5f5f5",
                                                borderBottom: "1px solid #000",
                                                px: { xs: 1, sm: 2 }
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 900, width: { xs: 20, sm: 30 }, mr: 1, fontSize: { xs: "0.9rem", sm: "1.1rem" } }}>
                                                #{player.rank}
                                            </Typography>
                                            <ListItemText
                                                primary={
                                                    <Box
                                                        component="a"
                                                        href={`https://sepolia.scrollscan.com/txs?a=${gameAddress}&q=${player.address}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{
                                                            textDecoration: "none",
                                                            color: "inherit",
                                                            "&:hover": { color: "#2196F3", textDecoration: "underline" },
                                                            display: 'block',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: player.rank === 1 ? "bold" : "normal", fontFamily: "monospace", fontSize: "0.9rem" }}>
                                                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                                                {player.address.slice(0, 10)}...{player.address.slice(-8)}
                                                            </Box>
                                                            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                                                                {player.address.slice(0, 6)}...{player.address.slice(-4)}
                                                            </Box>
                                                            {player.rank === 1 && " 👑"}
                                                            {data.userStats && player.address === data.userStats.address && " (Tú)"}
                                                        </span>
                                                    </Box>
                                                }
                                            />
                                            <Typography sx={{ fontWeight: "bold", fontFamily: "monospace", fontSize: { xs: "0.9rem", sm: "1.1rem" } }}>
                                                {player.totalDuration}s
                                            </Typography>
                                        </ListItem>
                                    ))
                                )}
                            </List>
                        </Box>
                    </DialogContent>

                    <DialogActions sx={{ p: 4, justifyContent: 'center', bgcolor: 'white' }}>
                        <Button
                            onClick={onClose}
                            variant="contained"
                            sx={{
                                borderRadius: 0,
                                bgcolor: "#000",
                                color: "white",
                                fontWeight: 900,
                                px: 5,
                                py: 1.5,
                                border: "2px solid #000",
                                boxShadow: "4px 4px 0px #888",
                                "&:hover": {
                                    bgcolor: "#333",
                                    boxShadow: "2px 2px 0px #888",
                                    transform: "translate(2px, 2px)"
                                }
                            }}
                        >
                            CERRAR
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}
