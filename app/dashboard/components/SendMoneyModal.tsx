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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CircularProgress from "@mui/material/CircularProgress";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { BaseIcon } from "@/app/components/atoms/BaseIcon";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import CeloIcon from "@/app/components/atoms/CeloIcon";
import { formatCurrency } from "@/app/utils/formatCurrency";

type Props = {
  open: boolean;
  fromAddress: string;
  toAddress: string;
  amount: string;
  password: string;
  chain: string;
  loading: boolean;
  routeReady: boolean;
  recipient: string;
  netAmount: string;
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
  loading,
  routeReady,
  recipient,
  netAmount,
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
  const routeDetails = [
    {
      wallet: "Tobias Wallet",
      chains: [
        { id: "base", label: "Base", icon: <BaseIcon />, amount: 4 },
        { id: "optimism", label: "Optimism", icon: <OPIcon />, amount: 3 },
      ],
    },
    {
      wallet: "Sebas Wallet",
      chains: [{ id: "celo", label: "Celo", icon: <CeloIcon />, amount: 2 }],
    },
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
        {loading && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexDirection: "column",
              textAlign: "center",
            }}
          >
            <CircularProgress size={22} thickness={5} />
            <Typography fontWeight={800} fontSize={14}>
              Buscando la mejor ruta...
            </Typography>
            <Typography fontWeight={600} fontSize={13} color="text.secondary">
              Enviando transaccion...
            </Typography>
          </Box>
        )}
        {!routeReady ? (
          <Stack spacing={2.2}>
            <TextField
              select
              label="Chain destino"
              fullWidth
              size="medium"
              value={chain}
              onChange={(e) => onChainChange(e.target.value)}
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
            <TextField
              label="Password de la wallet"
              fullWidth
              size="medium"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="********"
              disabled={loading}
            />
          </Stack>
        ) : (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Typography fontWeight={800} fontSize={15}>
              Ruta encontrada
            </Typography>
            <Stack spacing={1}>
              {routeDetails.map((wallet) => (
                <Accordion
                  key={wallet.wallet}
                  disableGutters
                  elevation={0}
                  sx={{
                    backgroundColor: "#fff",
                    borderRadius: 1.5,
                    boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
                    "&::before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ width: "100%" }}
                      spacing={2}
                    >
                      <Typography fontWeight={800}>{wallet.wallet}</Typography>
                      <Box textAlign="right">
                        <Typography fontSize={12} color="text.secondary">
                          Total
                        </Typography>
                        <Typography fontWeight={800}>
                          {formatCurrency(
                            wallet.chains.reduce((acc, c) => acc + c.amount, 0),
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      {wallet.chains.map((r) => (
                        <Box
                          key={r.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: "#f8fafc",
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {r.icon}
                            <Typography fontWeight={700}>{r.label}</Typography>
                          </Stack>
                          <Box textAlign="right">
                            <Typography fontWeight={800}>
                              {formatCurrency(r.amount)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              - {formatCurrency(r.amount * 0.01)}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: "#fff",
                boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Box>
                <Typography fontWeight={800}>Destinatario</Typography>
                <Typography variant="body2" color="text.secondary">
                  {recipient || "N/D"}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                  {chains.find((c) => c.id === chain)?.icon}
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Llega en {chains.find((c) => c.id === chain)?.label || "Chain destino"}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <Box textAlign={{ xs: "left", sm: "right" }}>
                <Typography fontWeight={800}>Recibe</Typography>
                <Typography fontWeight={900}>{formatCurrency(Number(netAmount) || 0)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Monto neto luego de comisión estimada
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
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
          disabled={!canSend || loading}
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
          {loading ? "Aceptar" : routeReady ? "Enviar" : "Aceptar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
