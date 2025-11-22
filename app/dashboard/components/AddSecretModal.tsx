"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";

type Props = {
  open: boolean;
  walletName: string;
  phrase: string;
  wordsCount: number;
  password: string;
  onWalletNameChange: (value: string) => void;
  onPhraseChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function AddSecretModal({
  open,
  walletName,
  phrase,
  wordsCount,
  password,
  onWalletNameChange,
  onPhraseChange,
  onPasswordChange,
  onConfirm,
  onClose,
}: Props) {
  const has12Words = wordsCount === 12;
  const canConfirm = walletName.trim().length > 0 && password.trim().length > 0 && has12Words;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
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
          <AccountBalanceWalletOutlined />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={900} fontSize={18.5} sx={{ lineHeight: 1.2 }}>
            Agregar Frase Secreta (12 palabras)
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Pega las 12 palabras de tu seed en el orden correcto para vincular tu wallet.
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, pb: 1.5, pt: 2.5 }}>
        <Stack spacing={2.2}>
          <Box>
            <Typography fontWeight={700} fontSize={13} sx={{ mb: 0.6, color: "#111827" }}>
              Nombre de la Wallet
            </Typography>
            <TextField
              fullWidth
              size="medium"
              value={walletName}
              onChange={(e) => onWalletNameChange(e.target.value)}
              placeholder="Ej: Mi Wallet Principal"
              InputProps={{ sx: { borderRadius: 2, background: "#f8fafc" } }}
            />
          </Box>
          <Box>
            <Typography fontWeight={700} fontSize={13} sx={{ mb: 0.6, color: "#111827" }}>
              Frase secreta (12 palabras)
            </Typography>
            <TextField
              fullWidth
              size="medium"
              value={phrase}
              onChange={(e) => onPhraseChange(e.target.value)}
              placeholder="palabra1 palabra2 ... palabra12"
              InputProps={{ sx: { borderRadius: 2, background: "#f8fafc" } }}
              helperText={
                phrase
                  ? `${wordsCount}/12 palabras`
                  : "Separa cada palabra con espacio y respeta el orden exacto."
              }
              multiline
              minRows={3}
            />
          </Box>
          <Box>
            <Typography fontWeight={700} fontSize={13} sx={{ mb: 0.6, color: "#111827" }}>
              Password para cifrar
            </Typography>
            <TextField
              fullWidth
              size="medium"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              InputProps={{ sx: { borderRadius: 2, background: "#f8fafc" } }}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2.8,
          pt: 1.2,
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Button
          fullWidth
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
          fullWidth
          variant="contained"
          onClick={onConfirm}
          disabled={!canConfirm}
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
          Agregar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
