import { Box, Modal, Button, Typography, IconButton } from "@mui/material";
import { toast } from "react-toastify";
import FileCopyIcon from '@mui/icons-material/FileCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useState } from "react";

interface ExportWalletModalProps {
    open: boolean;
    onClose: () => void;
    data: string;
    type: "mnemonic" | "privateKey";
}

export const ExportWalletModal = ({ open, onClose, data, type }: ExportWalletModalProps) => {
    const [isRevealed, setIsRevealed] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(data);
        toast.success(type === "mnemonic" ? "Frase semilla copiada" : "Clave privada copiada");
    };

    const words = type === "mnemonic" ? data.split(" ") : [];

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: "fixed",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    background: "rgba(0,0,0,0.5)",
                }}
            >
                <Box
                    sx={{
                        width: "100%",
                        maxWidth: 500,
                        background: "#ffffff",
                        border: "4px solid #000000",
                        boxShadow: "12px 12px 0px #000000",
                        borderRadius: 4,
                        p: 4,
                        position: "relative",
                    }}
                >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h6" fontWeight="bold">
                            {type === "mnemonic" ? "RECOVERY PHRASE" : "PRIVATE KEY"}
                        </Typography>
                        <Button
                            onClick={() => setIsRevealed(!isRevealed)}
                            startIcon={isRevealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            sx={{ color: "#000", textTransform: "none", fontWeight: "bold" }}
                        >
                            {isRevealed ? "Hide" : "Reveal"}
                        </Button>
                    </Box>

                    {type === "mnemonic" ? (
                        <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2} mb={4}>
                            {words.map((word, index) => (
                                <Box key={index}>
                                    <Box
                                        sx={{
                                            border: "2px solid #e5e7eb",
                                            borderRadius: 2,
                                            p: 1.5,
                                            textAlign: "center",
                                            background: "#f9fafb",
                                            position: "relative",
                                            overflow: "hidden"
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ position: "absolute", left: 8, top: 4, color: "#9ca3af" }}>
                                            {index + 1}.
                                        </Typography>
                                        <Typography
                                            fontWeight="600"
                                            sx={{
                                                filter: isRevealed ? "none" : "blur(4px)",
                                                transition: "filter 0.3s ease",
                                                mt: 0.5
                                            }}
                                        >
                                            {word}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                border: "2px solid #e5e7eb",
                                borderRadius: 2,
                                p: 2,
                                textAlign: "center",
                                background: "#f9fafb",
                                mb: 4,
                                wordBreak: "break-all"
                            }}
                        >
                            <Typography
                                sx={{
                                    filter: isRevealed ? "none" : "blur(5px)",
                                    transition: "filter 0.3s ease",
                                    fontFamily: "monospace"
                                }}
                            >
                                {data}
                            </Typography>
                        </Box>
                    )}

                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleCopy}
                        startIcon={<FileCopyIcon />}
                        sx={{
                            bgcolor: "#ffffff",
                            color: "#000000",
                            border: "2px solid #000000",
                            boxShadow: "4px 4px 0px #000000",
                            py: 1.5,
                            fontWeight: "bold",
                            '&:hover': {
                                bgcolor: "#f3f3f3",
                                transform: "translate(-2px, -2px)",
                                boxShadow: "6px 6px 0px #000000",
                            },
                        }}
                    >
                        COPY {type === "mnemonic" ? "RECOVERY PHRASE" : "PRIVATE KEY"}
                    </Button>

                    <Button
                        fullWidth
                        onClick={onClose}
                        sx={{
                            mt: 2,
                            color: "#666",
                            fontWeight: "bold",
                            textDecoration: "underline"
                        }}
                    >
                        Cerrar
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};
