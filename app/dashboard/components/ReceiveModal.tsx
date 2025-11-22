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
import { QRCodeCanvas } from "qrcode.react";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import { BaseIcon } from "@/app/components/atoms/BaseIcon";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import CeloIcon from "@/app/components/atoms/CeloIcon";
import { useMemo } from "react";
import { toast } from "react-toastify";
import { WalletInfo } from "@/app/store/useWalletManager";

type Props = {
  open: boolean;
  wallets: WalletInfo[];
  selectedWallet: string;
  selectedChain: string;
  onWalletChange: (v: string) => void;
  onChainChange: (v: string) => void;
  onClose: () => void;
};

const chains = [
  { id: "base", label: "Base", icon: <BaseIcon /> },
  { id: "optimism", label: "Optimism", icon: <OPIcon /> },
  { id: "celo", label: "Celo", icon: <CeloIcon /> },
];

export function ReceiveModal({
  open,
  wallets,
  selectedWallet,
  selectedChain,
  onWalletChange,
  onChainChange,
  onClose,
}: Props) {
  const currentAddress = useMemo(() => {
    const found = wallets.find((w) => w.address === selectedWallet) ?? wallets[0];
    return found?.address ?? "";
  }, [selectedWallet, wallets]);

  const currentChain =
    chains.find((c) => c.id === selectedChain) || chains.find((c) => c.id === "celo");
  // Usamos esquema ethereum:<address> para compatibilidad con wallets (EIP-681 básico).
  const qrValue = currentAddress
    ? `ethereum:${currentAddress}`
    : "ethereum:0x0000000000000000000000000000000000000000";

  const copyToClipboard = async (value: string) => {
    if (!value) {
      toast.error("No hay address para copiar");
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        toast.success("Address copiado");
        return;
      }
    } catch {
      // fallback abajo
    }
    const manual = window.prompt("Copia y pega:", value);
    if (manual !== null) toast.success("Address copiado");
  };

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
          color: "#fff",
        }}
      >
        <Typography fontWeight={900} fontSize={18.5}>
          Recibir fondos
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Elige la wallet y la red para recibir.
        </Typography>
      </Box>

      <DialogContent
        sx={{
          px: 2.5,
          pb: 1.25,
          pt: 1.75,
          maxHeight: "none",
          overflow: "hidden",
        }}
      >
        <Stack spacing={1.25}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              select
              label="Wallet"
              fullWidth
              size="small"
              value={selectedWallet}
              onChange={(e) => onWalletChange(e.target.value)}
            >
              {wallets.map((w) => (
                <MenuItem key={w.address} value={w.address}>
                  {w.name} — {w.address.slice(0, 6)}...{w.address.slice(-4)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Chain"
              fullWidth
              size="small"
              value={selectedChain}
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
          </Stack>

          <Box
            sx={{
              mt: 0.5,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
              textAlign: "center",
            }}
          >
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
              {currentChain?.icon}
              <Typography fontWeight={800}>{currentChain?.label}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Usa esta dirección solo en redes compatibles.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 0.75 }}>
            <Box
              sx={{
                p: 0.9,
                borderRadius: 2,
                backgroundColor: "#eef2ff",
                boxShadow: "0 10px 30px rgba(59,130,246,0.25)",
              }}
            >
              <QRCodeCanvas value={qrValue} size={130} />
            </Box>
          </Box>

          <Box
            sx={{
              textAlign: "center",
              mt: 0.4,
              px: 1,
              wordBreak: "break-all",
            }}
          >
            <Typography fontWeight={800} color="#4f46e5" sx={{ fontSize: 14 }}>
              {currentAddress || "0x..."}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 1.25, pt: 0.5 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<ContentCopyOutlined />}
          onClick={() => copyToClipboard(currentAddress)}
          sx={{
            textTransform: "none",
            borderRadius: 999,
            fontWeight: 800,
            background: "linear-gradient(120deg, #1e62ff 0%, #1a9cff 100%)",
            boxShadow: "0 10px 25px rgba(32,114,255,0.35)",
            "&:hover": {
              background: "linear-gradient(120deg, #1b57e6 0%, #188bdf 100%)",
            },
          }}
        >
          Copiar dirección
        </Button>
      </DialogActions>
    </Dialog>
  );
}
