"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import DownloadIcon from "@mui/icons-material/Download";

type Props = {
  onAdd: () => void;
  onSend: () => void;
  onReceive: () => void;
};

export function TopBar({ onAdd, onSend, onReceive }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "center", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
        width: "100%",
        px: { xs: 2, md: 4 },
        py: { xs: 1.4, md: 1.6 },
        borderRadius: 20,
        mb: { xs: 2.5, md: 3 },
        background: "linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(24,35,52,0.9) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 55px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        color: "#fff",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={{ xs: 0.85, sm: 1.5 }}
        sx={{
          flex: { xs: "0 0 auto", sm: 1 },
          minWidth: 240,
          justifyContent: "flex-start",
          textAlign: "left",
          flexWrap: "nowrap",
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: "linear-gradient(145deg, #0ea5e9 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            boxShadow: "0 10px 22px rgba(0,0,0,0.25)",
            fontSize: 17,
            }}
        >
          M
        </Box>
        <Box sx={{ ml: { xs: 0.5, sm: 0.75 } }}>
          <Typography fontWeight={900} fontSize={18} sx={{ color: "#fff" }}>
            MultiChain Wallet
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>
            Gestiona todas tus addresses en un solo lugar
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          width: { xs: "100%", sm: "auto" },
          justifyContent: { xs: "center", sm: "flex-end" },
          alignItems: "center",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          rowGap: 1,
        }}
      >
        {[{ icon: <SendIcon />, label: "Enviar", action: onSend },
          { icon: <DownloadIcon />, label: "Recibir", action: onReceive },
          { icon: <AddIcon />, label: "Agregar Address", action: onAdd }].map((btn) => (
          <Button
            key={btn.label}
            startIcon={btn.icon}
            onClick={btn.action}
            sx={{
              textTransform: "none",
              px: 2.6,
              py: 1,
              borderRadius: 2,
              fontWeight: 800,
              color: "#0b172d",
              background: "linear-gradient(135deg, #fefefe 0%, #e5ecff 100%)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
              "&:hover": {
                background: "linear-gradient(135deg, #ffffff 0%, #d9e4ff 100%)",
              },
            }}
          >
            {btn.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}
