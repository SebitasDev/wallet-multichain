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
        maxWidth: 1200,
        width: "100%",
        mx: "auto",
        px: { xs: 2.4, md: 3.4 },
        py: { xs: 2, md: 2.5 },
        mb: { xs: 2.5, md: 3.5 },
        borderRadius: 20,
        background:
          "radial-gradient(circle at 16% 18%, rgba(109,40,217,0.18) 0%, transparent 32%), radial-gradient(circle at 82% 0%, rgba(59,130,246,0.18) 0%, transparent 26%), linear-gradient(130deg, rgba(10,10,24,0.92), rgba(12,12,28,0.88))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 28px 72px rgba(0,0,0,0.55), 0 16px 36px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08)",
        color: "#fff",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: { xs: 2, md: 3 },
        flexWrap: "wrap",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={{ xs: 0.85, sm: 1.5 }}
        sx={{
          flex: { xs: "1 1 100%", sm: 1 },
          minWidth: 260,
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
            background: "linear-gradient(150deg, #5b21b6 0%, #4338ca 50%, #22d3ee 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            boxShadow: "0 16px 32px rgba(0,0,0,0.35)",
            fontSize: 18,
          }}
        >
          M
        </Box>
        <Box sx={{ ml: { xs: 0.75, sm: 1 }, minWidth: 0 }}>
          <Typography fontWeight={700} fontSize={20} sx={{ color: "#f8fafc", letterSpacing: 0.2 }}>
            MultiChain Wallet
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 13.5, color: "rgba(226,232,240,0.78)" }}>
            Gestiona todas tus wallets y chains desde un solo lugar.
          </Typography>
          <Stack direction="row" spacing={1} mt={1.2} flexWrap="wrap" useFlexGap>
            {["6 chains", "3 wallets hijas", "Solo USDC"].map((item) => (
              <Box
                key={item}
                sx={{
                  px: 1.2,
                  py: 0.35,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(226,232,240,0.9)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  lineHeight: 1.2,
                }}
              >
                {item}
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>

      <Stack
        direction="row"
        sx={{
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          mt: 2.5,
          py: 1.25,
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
              width: 88,
              minWidth: 88,
              maxWidth: 88,
              height: 88,
              borderRadius: 18,
              p: 0,
              fontWeight: 500,
              fontSize: 13,
              letterSpacing: 0.1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              backgroundColor: "#1c1d22",
              border: "1px solid transparent",
              color: "#e5e5e5",
              boxShadow: "none",
              "& .MuiButton-startIcon": {
                margin: 0,
                color: "#c9c9c9",
                "& svg": { fontSize: 26 },
              },
              "&:focus-visible": {
                outline: "2px solid rgba(255,255,255,0.08)",
                outlineOffset: 1.5,
              },
              "&:hover": {
                backgroundColor: "#26272c",
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
