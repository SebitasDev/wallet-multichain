"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { BaseIcon } from "@/app/components/atoms/BaseIcon";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import CeloIcon from "@/app/components/atoms/CeloIcon";

type Props = {
  open: boolean;
  fromAddress: string;
  toAddress: string;
  amount: string;
  password: string;
  chain: string;
  onToChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onChainChange: (v: string) => void;
  onClose: () => void;
  onSend: () => void;
};

export function SendMoneyModal({
  open,
  fromAddress,
  toAddress,
  amount,
  password,
  chain,
  onToChange,
  onAmountChange,
  onPasswordChange,
  onChainChange,
  onClose,
  onSend,
}: Props) {
  const canSend =
    !!fromAddress && !!toAddress.trim() && !!amount.trim() && !!password.trim();
  const chains = [
    { id: "base", label: "Base", icon: <BaseIcon /> },
    { id: "optimism", label: "Optimism", icon: <OPIcon /> },
    { id: "celo", label: "Celo", icon: <CeloIcon /> },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(15,23,42,0.25)",
        },
      }}
    >
      <Box
        sx={{
          background: "linear-gradient(135deg, #1f50ff 0%, #19a3b7 50%, #16a34a 100%)",
          px: 3,
          py: 2.2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          color: "#fff",
        }}
      >
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2.5,
            background: "rgba(255,255,255,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
          }}
        >
          <SendIcon />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={900} fontSize={18.5} sx={{ lineHeight: 1.2 }}>
            Enviar fondos
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Elige la chain destino e ingresa address, monto y contrasena.
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ px: 3, pb: 1.5, pt: 2.5 }}>
        <Stack spacing={2.2}>
          <TextField
            select
            label="Chain destino"
            fullWidth
            size="medium"
            value={chain}
            onChange={(e) => onChainChange(e.target.value)}
          >
            {chains.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                <Stack direction="row" alignItems="center" spacing={1.2}>
                  {c.icon}
                  <Typography>{c.label}</Typography>
                </Stack>
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Address destino"
            fullWidth
            size="medium"
            value={toAddress}
            onChange={(e) => onToChange(e.target.value)}
            placeholder="0x..."
          />
          <TextField
            label="Monto"
            fullWidth
            size="medium"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            type="number"
            inputProps={{ min: "0", step: "0.0001" }}
          />
          <TextField
            label="Password de la wallet"
            fullWidth
            size="medium"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="********"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            textTransform: "none",
            borderRadius: 1.5,
            fontWeight: 700,
            borderColor: "#e2e8f0",
            color: "#0f172a",
            backgroundColor: "#fff",
            "&:hover": {
              borderColor: "#cbd5e1",
              backgroundColor: "#f8fafc",
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onSend}
          disabled={!canSend}
          sx={{
            textTransform: "none",
            borderRadius: 1.5,
            fontWeight: 800,
            letterSpacing: 0.2,
            boxShadow: "0 14px 35px rgba(26,146,255,0.35)",
            background: "linear-gradient(135deg, #0f7bff 0%, #0ac5a8 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #0d6bdc 0%, #09ad93 100%)",
            },
          }}
        >
          Enviar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
