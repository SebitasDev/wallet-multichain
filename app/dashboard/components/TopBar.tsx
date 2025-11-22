"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";

type Props = {
  onAdd: () => void;
  onSend: () => void;
};

export function TopBar({ onAdd, onSend }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
        px: { xs: 2.5, md: 5 },
        py: 2.25,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ flex: 1, minWidth: 240 }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "linear-gradient(160deg, #1f50ff 0%, #1db4c3 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            boxShadow: "0 8px 25px rgba(59,130,246,0.35)",
            fontSize: 18,
          }}
        >
          M
        </Box>
        <Box>
          <Typography fontWeight={800} fontSize={18}>
            MultiChain Wallet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5 }}>
            Gestiona todas tus addresses en un solo lugar
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          width: { xs: "100%", sm: "auto" },
          justifyContent: { xs: "flex-start", sm: "flex-end" },
          flexWrap: "wrap",
          rowGap: 1,
        }}
      >
        <Button
          startIcon={<SendIcon />}
          sx={{
            textTransform: "none",
            px: 2.2,
            py: 1,
            borderRadius: 2,
            fontWeight: 700,
            color: "#0f172a",
            backgroundColor: "#e0f2fe",
            boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
            "&:hover": {
              backgroundColor: "#cfe7fb",
            },
          }}
          onClick={onSend}
        >
          Send Money
        </Button>
        <Button
          startIcon={<AddIcon />}
          sx={{
            textTransform: "none",
            px: 2.8,
            py: 1,
            borderRadius: 2,
            fontWeight: 700,
            color: "#fff",
            background: "linear-gradient(120deg, #1e62ff 0%, #1a9cff 100%)",
            boxShadow: "0 8px 20px rgba(32,114,255,0.35)",
            "&:hover": {
              background: "linear-gradient(120deg, #1b57e6 0%, #188bdf 100%)",
            },
          }}
          onClick={onAdd}
        >
          Agregar Address
        </Button>
      </Stack>
    </Box>
  );
}
