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
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    border: "3px solid #000",
                    boxShadow: "8px 8px 0px #000",
                    p: 1,
                    maxHeight: "80vh"
                }
            }}
        >
            <DialogTitle sx={{ textAlign: "center", borderBottom: "2px dashed #eee" }}>
                <Typography component="div" variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                    Game Details
                </Typography>
                <Box
                    component="a"
                    href={`https://sepolia.scrollscan.com/address/${gameAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        textDecoration: "none",
                        color: "text.secondary",
                        cursor: "pointer",
                        "&:hover > *": { color: "#2196F3", textDecoration: "underline" }
                    }}
                >
                    <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                        {gameAddress}
                    </Typography>
                    <OpenInNewIcon fontSize="inherit" sx={{ fontSize: 14 }} />
                </Box>
                {isWinner && (
                    <Box sx={{ mt: 1 }}>
                        <Chip
                            label="🏆 YOU WON THIS GAME 🏆"
                            sx={{ bgcolor: "#00DC8C", color: "black", fontWeight: "bold", border: "1px solid black" }}
                        />
                    </Box>
                )}
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                {loading || !data ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                        <CircularProgress sx={{ color: "black" }} />
                    </Box>
                ) : (
                    <Box>
                        {/* Summary Stats */}
                        <Box sx={{ display: "flex", gap: 1, mb: 3, justifyContent: "center", flexWrap: "wrap" }}>
                            <Chip
                                icon={<ReceiptLongIcon />}
                                label={`${data.totalTransactions} Txns`}
                                sx={{ border: "2px solid #000", fontWeight: "bold", bgcolor: "#f0f0f0" }}
                            />
                            <Chip
                                icon={<PeopleIcon />}
                                label={`${data.totalPlayers} Players`}
                                sx={{ border: "2px solid #000", fontWeight: "bold", bgcolor: "#f0f0f0" }}
                            />
                        </Box>

                        {/* Your Performance */}
                        {data.userStats && (
                            <Box sx={{ mb: 3, p: 2, bgcolor: "#E3F2FD", borderRadius: 2, border: "2px solid #2196F3" }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#1565C0", mb: 1 }}>
                                    YOUR PERFORMANCE
                                </Typography>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: "bold" }}>Rank</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                            {data.userStats.rank ? `#${data.userStats.rank}` : "-"}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: "right" }}>
                                        <Typography variant="caption" sx={{ fontWeight: "bold" }}>Time Held</Typography>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <TimerIcon fontSize="small" />
                                            <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                                {data.userStats.totalDuration}s
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        {/* Full Leaderboard */}
                        <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                            Global Leaderboard
                        </Typography>
                        <Box sx={{
                            maxHeight: 250,
                            overflowY: "auto",
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            bgcolor: "#f9f9f9"
                        }}>
                            <List dense>
                                {data.allPlayers.map((player) => (
                                    <div key={player.address}>
                                        <ListItem>
                                            <Typography sx={{ fontWeight: "bold", width: 30, mr: 1 }}>
                                                #{player.rank}
                                            </Typography>
                                            <ListItemText
                                                primary={
                                                    <Box
                                                        component="a"
                                                        // Attempting to filter Game's history by Player. 
                                                        // If filter fails, at least it shows the relevant Game Contract history.
                                                        href={`https://sepolia.scrollscan.com/txs?a=${gameAddress}&q=${player.address}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{
                                                            textDecoration: "none",
                                                            color: "inherit",
                                                            "&:hover": { color: "#2196F3", textDecoration: "underline" }
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: player.rank === 1 ? "bold" : "normal" }}>
                                                            {player.address.slice(0, 10)}...{player.address.slice(-8)}
                                                            {player.rank === 1 && " 👑"}
                                                            {data.userStats && player.address === data.userStats.address && " (You)"}
                                                        </span>
                                                    </Box>
                                                }
                                            />
                                            <Typography sx={{ fontWeight: "bold", fontFamily: "monospace" }}>
                                                {player.totalDuration}s
                                            </Typography>
                                        </ListItem>
                                        <Divider component="li" />
                                    </div>
                                ))}
                                {data.allPlayers.length === 0 && (
                                    <Typography sx={{ p: 2, textAlign: "center", fontStyle: "italic", color: "gray" }}>
                                        No holders yet
                                    </Typography>
                                )}
                            </List>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        bgcolor: "black",
                        color: "white",
                        fontWeight: "bold",
                        "&:hover": { bgcolor: "#333" }
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
