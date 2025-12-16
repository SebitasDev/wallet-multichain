import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    InputAdornment
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

interface CreateGameModalProps {
    open: boolean;
    onClose: () => void;
    onCreate: (durationHours: number, costETH: string, rewardAmount: string) => void;
    loading: boolean;
}

export function CreateGameModal({ open, onClose, onCreate, loading }: CreateGameModalProps) {
    const [duration, setDuration] = useState("1"); // Default 1 hour
    const [cost, setCost] = useState("0.001"); // Default 0.001 ETH
    const [reward, setReward] = useState("0"); // Default 0 USDC

    const handleCreate = () => {
        const durationNum = parseFloat(duration);
        if (isNaN(durationNum) || durationNum <= 0) {
            alert("Please enter a valid duration > 0");
            return;
        }
        if (!cost || parseFloat(cost) < 0) {
            alert("Please enter a valid cost >= 0");
            return;
        }
        if (!reward || parseFloat(reward) < 0) {
            alert("Please enter a valid reward >= 0");
            return;
        }
        onCreate(durationNum, cost, reward);
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    border: "3px solid #000",
                    boxShadow: "8px 8px 0px #000",
                    p: 2
                }
            }}
        >
            <DialogTitle sx={{ fontWeight: 900, textTransform: "uppercase", textAlign: "center" }}>
                Create New Event
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1, minWidth: 300 }}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                            Game Duration (Hours)
                        </Typography>
                        <TextField
                            fullWidth
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccessTimeIcon />
                                    </InputAdornment>
                                ),
                                inputProps: { min: 0, step: 0.1 }
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    border: "2px solid #000",
                                    bgcolor: "white"
                                }
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            Example: 0.1 = 6 minutes, 1 = 1 hour, 24 = 1 day
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                            Capture Cost (ETH)
                        </Typography>
                        <TextField
                            fullWidth
                            type="number"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AttachMoneyIcon />
                                    </InputAdornment>
                                ),
                                inputProps: { min: 0, step: 0.0001 }
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    border: "2px solid #000",
                                    bgcolor: "white"
                                }
                            }}
                        />
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                            Reward Pool (USDC)
                        </Typography>
                        <TextField
                            fullWidth
                            type="number"
                            value={reward}
                            onChange={(e) => setReward(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Typography sx={{ fontWeight: "bold" }}>$</Typography>
                                    </InputAdornment>
                                ),
                                inputProps: { min: 0, step: 0.01 }
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    border: "2px solid #000",
                                    bgcolor: "white"
                                }
                            }}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button
                    onClick={onClose}
                    disabled={loading}
                    variant="outlined"
                    sx={{
                        color: "black",
                        border: "2px solid #000",
                        fontWeight: "bold",
                        mr: 1
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleCreate}
                    disabled={loading}
                    variant="contained"
                    sx={{
                        bgcolor: "#00DC8C",
                        color: "black",
                        border: "2px solid #000",
                        fontWeight: "bold",
                        boxShadow: "4px 4px 0px #000",
                        "&:hover": { bgcolor: "#00C27A" }
                    }}
                >
                    {loading ? "Creating..." : "Launch Event"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
