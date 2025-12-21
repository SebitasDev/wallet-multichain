import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Typography, Paper } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";
import { getAiContext } from "./ai-contexts";

interface AiContextModalProps {
    open: boolean;
    onClose: () => void;
    type: 'usdc-xlm' | 'usdc-usdc' | 'quote' | 'gasless';
    baseUrl: string;
}

export const AiContextModal = ({ open, onClose, type, baseUrl }: AiContextModalProps) => {

    const getContextContent = () => {
        return getAiContext(type, baseUrl);
    };

    const content = getContextContent();

    const handleCopy = () => {
        navigator.clipboard.writeText(content || "");
        toast.success("AI Context Copied!");
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    border: "4px solid #000",
                    boxShadow: "8px 8px 0px #000",
                    borderRadius: 2
                }
            }}
        >
            <DialogTitle sx={{
                bgcolor: "#000",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: 900,
                letterSpacing: 1
            }}>
                🤖 CONTEXT FOR AI AGENTS
                <IconButton onClick={onClose} sx={{ color: "#fff" }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ bgcolor: "#FAFAFA", p: 3 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={700}>
                        Provide this context to an AI Agent (Cursor, Windsurf, Replit) to implement this bridge correctly.
                    </Typography>
                </Box>

                <Paper sx={{
                    p: 2,
                    bgcolor: "#1e1e1e",
                    color: "#00FF41",
                    fontFamily: "monospace",
                    fontSize: 12,
                    maxHeight: "400px",
                    overflow: "auto",
                    border: "2px solid #000",
                    position: "relative"
                }}>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{content}</pre>
                </Paper>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleCopy}
                    startIcon={<ContentCopyIcon />}
                    sx={{
                        mt: 3,
                        bgcolor: "#000",
                        color: "#fff",
                        fontWeight: 900,
                        border: "2px solid #000",
                        boxShadow: "4px 4px 0px #000",
                        "&:hover": {
                            bgcolor: "#333",
                            boxShadow: "2px 2px 0px #000",
                            transform: "translate(2px, 2px)"
                        }
                    }}
                >
                    COPY CONTEXT
                </Button>
            </DialogContent>
        </Dialog>
    );
};
