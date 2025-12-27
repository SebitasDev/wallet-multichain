import { Box, Button, Typography } from "@mui/material";
import SavingsIcon from "@mui/icons-material/Savings";
import FlagIcon from "@mui/icons-material/Flag";
import SendIcon from "@mui/icons-material/Send";

interface TopBarActionsProps {
    onSavings: () => void;
    onCTF: () => void;
    onCrossChain: () => void;
}

export const TopBarActions = ({ onSavings, onCTF, onCrossChain }: TopBarActionsProps) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: "16px",
                width: { xs: "100%", sm: "auto" },
                flexWrap: "wrap",
                rowGap: 1.5,
            }}
        >
            {/* ENVIAR (CROSS-CHAIN) */}
            <Button
                id="tour-action-crosschain"
                onClick={onCrossChain}
                sx={{
                    width: 90,
                    height: 90,
                    borderRadius: 3,
                    backgroundColor: "#7852FF",
                    border: "3px solid #000000",
                    boxShadow: "4px 4px 0px #000000",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 0.75,
                    textTransform: "none",
                    color: "#fff",
                    transition: "all 0.2s",
                    "&:hover": {
                        backgroundColor: "#6342E6",
                        transform: "translate(2px, 2px)",
                        boxShadow: "2px 2px 0px #000000",
                    },
                }}
            >
                <SendIcon sx={{ fontSize: 28, color: "white" }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Enviar</Typography>
            </Button>

            {/* SAVINGS / BLEND */}
            <Button
                id="tour-action-savings"
                onClick={onSavings}
                sx={{
                    width: 90,
                    height: 90,
                    borderRadius: 3,
                    backgroundColor: "#FFD700",
                    border: "3px solid #000000",
                    boxShadow: "4px 4px 0px #000000",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 0.75,
                    textTransform: "none",
                    color: "#000",
                    transition: "all 0.2s",
                    "&:hover": {
                        backgroundColor: "#E6C200",
                        transform: "translate(2px, 2px)",
                        boxShadow: "2px 2px 0px #000000",
                    },
                }}
            >
                <SavingsIcon sx={{ fontSize: 28, color: "#000000" }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600, textAlign: "center" }}>
                    Yield
                </Typography>
            </Button>

            {/* CAPTURE THE FLAG */}
            <Button
                id="tour-action-ctf"
                onClick={onCTF}
                sx={{
                    width: 90,
                    height: 90,
                    borderRadius: 3,
                    backgroundColor: "#FF2E2E", // Neobrutalist Red
                    border: "3px solid #000000",
                    boxShadow: "4px 4px 0px #000000",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 0.75,
                    textTransform: "none",
                    color: "#fff",
                    transition: "all 0.2s",
                    "&:hover": {
                        backgroundColor: "#D90000",
                        transform: "translate(2px, 2px)",
                        boxShadow: "2px 2px 0px #000000",
                    },
                }}
            >
                <FlagIcon sx={{ fontSize: 28, color: "white" }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600, textAlign: "center" }}>
                    CTF
                </Typography>
            </Button>
        </Box>
    );
};
