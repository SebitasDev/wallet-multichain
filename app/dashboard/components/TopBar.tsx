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
        gap: 2.5,
        flexWrap: "wrap",
        width: "100vw",
        mx: "calc(50% - 50vw)",
        px: { xs: 2.4, md: 4 },
        py: { xs: 1.8, md: 2 },
        borderRadius: 0,
        mb: { xs: 2.5, md: 3 },
        background:
          "radial-gradient(circle at 12% 20%, rgba(59,130,246,0.22), transparent 32%), radial-gradient(circle at 82% 16%, rgba(14,165,233,0.18), transparent 30%), linear-gradient(120deg, #0b1220, #10192f)",
        border: "none",
        boxShadow: "none",
        color: "#fff",
        overflow: "hidden",
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
          boxShadow: "0 12px 26px rgba(0,0,0,0.28)",
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
              py: 1.05,
              borderRadius: 1.75,
              fontWeight: 800,
              letterSpacing: 0.1,
              border: btn.label === "Enviar" ? "none" : "1px solid rgba(255,255,255,0.14)",
              color: btn.label === "Enviar" ? "#0b1224" : "#e2e8f0",
              background:
                btn.label === "Enviar"
                  ? "linear-gradient(135deg, #38bdf8 0%, #60a5fa 50%, #7c3aed 100%)"
                  : "rgba(255,255,255,0.07)",
              boxShadow:
                btn.label === "Enviar"
                  ? "0 14px 28px rgba(96,165,250,0.30)"
                  : "0 10px 22px rgba(0,0,0,0.22)",
              "& .MuiButton-startIcon": {
                color: btn.label === "Enviar" ? "#0b1224" : "#e2e8f0",
              },
              "&:hover": {
                background:
                  btn.label === "Enviar"
                    ? "linear-gradient(135deg, #60a5fa 0%, #7c3aed 60%, #a855f7 100%)"
                    : "rgba(255,255,255,0.12)",
                boxShadow:
                  btn.label === "Enviar"
                    ? "0 16px 32px rgba(96,165,250,0.35)"
                    : "0 12px 24px rgba(0,0,0,0.24)",
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
