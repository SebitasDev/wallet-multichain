"use client";

import { Box, Typography, Paper } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import { toast } from "react-toastify";

export const CodeBlock = ({ code, label }: { code: string; label?: string }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        toast.success("Copied to clipboard!");
    };

    return (
        <Box sx={{ mt: 3, mb: 5, position: "relative" }}>
            {label && (
                <Typography variant="caption" sx={{
                    fontWeight: 900,
                    mb: 1,
                    display: "inline-block",
                    bgcolor: "#FFDE00", // Yellow accent
                    color: "#000",
                    border: "2px solid #000",
                    px: 1,
                    py: 0.5,
                    boxShadow: "2px 2px 0px #000",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.5
                }}>
                    {label}
                </Typography>
            )}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mt: 1,
                    bgcolor: "#111",
                    color: "#00DC8C", // Matrix green text
                    borderRadius: 2,
                    fontFamily: "monospace",
                    fontSize: 13,
                    overflowX: "auto",
                    border: "2px solid #000",
                    boxShadow: "4px 4px 0px #000",
                    position: "relative"
                }}
            >
                <IconButton
                    onClick={handleCopy}
                    sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        color: "#fff",
                        opacity: 0.5,
                        "&:hover": { opacity: 1 }
                    }}
                    size="small"
                >
                    <ContentCopyIcon fontSize="small" />
                </IconButton>
                <pre style={{ margin: 0 }}>{code}</pre>
            </Paper>
        </Box>
    );
};
