"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  Stack,
  TextField,
  Typography,
  Paper,
  IconButton,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export function CircleOnrampPanel() {
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [amount, setAmount] = useState("1.00");
  const [destinationId, setDestinationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [payoutId, setPayoutId] = useState("");
  const [lastPayoutId, setLastPayoutId] = useState("");
  const [visible, setVisible] = useState(true);
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const router = useRouter();

  const step1Active = activeStep === 1;
  const step2Active = activeStep === 2;

  const generateKey = () => crypto.randomUUID();

  useEffect(() => {
    const savedDest = localStorage.getItem("circle_last_destination");
    if (savedDest) setDestinationId(savedDest);
    const savedPayout = localStorage.getItem("circle_last_payout");
    if (savedPayout) {
      setPayoutId(savedPayout);
      setLastPayoutId(savedPayout);
    }
  }, []);

  const linkWire = async () => {
    const idempotencyKey = generateKey();
    setLoading(true);
    try {
      const res = await fetch("/api/circle/link-wire", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          billingDetails: {
            name: "Nombre Demo",
            city: "City",
            country: "US",
            line1: "100 Demo Street",
            district: "CA",
            postalCode: "00000",
          },
          bankAddress: {
            bankName: bankName || "Demo Bank",
            city: "City",
            country: "US",
            line1: "100 Demo Street",
            district: "CA",
          },
          idempotencyKey,
          accountNumber,
          routingNumber,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg =
          json?.detail ||
          json?.message ||
          json?.error?.message ||
          json?.error?.code ||
          json?.error?.errId ||
          JSON.stringify(json);
        console.error("link-wire error", json);
        throw new Error(msg);
      }
      const id = json?.data?.id;
      if (id) {
        setDestinationId(id);
        localStorage.setItem("circle_last_destination", id);
        toast.success(`Cuenta wire creada: ${id}`);
      } else {
        toast.info("Cuenta wire creada");
      }
    } catch (err: any) {
      toast.error(err.message || "No se pudo crear la cuenta wire");
    } finally {
      setLoading(false);
    }
  };

  const sendPayout = async () => {
    const idempotencyKey = generateKey();
    setLoading(true);
    try {
      if (!destinationId) throw new Error("Primero crea o selecciona un destino wire");
      const res = await fetch("/api/circle/payout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destination: { type: "wire", id: destinationId },
          amount: { currency: "USD", amount },
          idempotencyKey,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg =
          json?.detail ||
          json?.message ||
          json?.error?.message ||
          json?.error?.code ||
          json?.error?.errId ||
          JSON.stringify(json);
        console.error("payout error", json);
        throw new Error(msg);
      }
      const id = json?.data?.id;
      if (id) {
        setPayoutId(id);
        setLastPayoutId(id);
        localStorage.setItem("circle_last_payout", id);
        toast.success(`Payout creado: ${id}`);
      } else {
        toast.info("Payout creado");
      }
    } catch (err: any) {
      toast.error(err.message || "No se pudo crear el payout");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Paper
      sx={{
        p: { xs: 2.75, md: 3.5 },
        borderRadius: 4,
        background: "linear-gradient(180deg, #f9fbff 0%, #eef3ff 60%, #e7edf6 100%)",
        border: "1px solid rgba(15,23,42,0.08)",
        color: "#0f172a",
        boxShadow: "0 32px 80px rgba(10,18,36,0.16)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 15% 15%, rgba(15,123,255,0.12), transparent 36%), radial-gradient(circle at 82% 12%, rgba(10,197,168,0.12), transparent 32%)",
        }}
      />
      <IconButton
        aria-label="Cerrar panel"
        size="small"
        onClick={() => {
          setVisible(false);
          router.push("/dashboard");
        }}
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          color: "#475569",
          zIndex: 2,
          "&:hover": { background: "rgba(0,0,0,0.06)" },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <Stack spacing={1} mb={3} sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          sx={{
            fontSize: { xs: 22, md: 30 },
            fontWeight: 900,
            letterSpacing: 1,
            color: "#0b1220",
            textTransform: "uppercase",
            textShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          OFFRAMP
        </Typography>
       
      </Stack>

      <Grid container spacing={3} alignItems="stretch" sx={{ position: "relative", zIndex: 1 }}>
        <Grid item xs={12} md={6} display="flex">
          <Stack
            spacing={1.25}
            sx={{
              flex: 1,
              minHeight: "100%",
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(15,23,42,0.06)",
              borderRadius: 3,
              p: 2.5,
              boxShadow: "0 14px 34px rgba(15,23,42,0.08)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip
                label="Paso 1"
                size="small"
                variant="filled"
                sx={{
                  fontWeight: 700,
                  bgcolor: step1Active ? "#0f7bff" : "#e2e8f0",
                  color: step1Active ? "#fff" : "#0f172a",
                  boxShadow: step1Active ? "0 8px 18px rgba(15,123,255,0.25)" : "none",
                  "& .MuiChip-label": {
                    fontWeight: 800,
                    color: "inherit",
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: "#334155", fontWeight: 800 }}>
                Crear destino wire
              </Typography>
            </Stack>
            <TextField
              label="Numero de ruta" 
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              size="small"
              onFocus={() => setActiveStep(1)}
            />
            <TextField
              label="Número de cuenta"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              size="small"
              onFocus={() => setActiveStep(1)}
            />
            <TextField
              label="Nombre del banco"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              size="small"
              onFocus={() => setActiveStep(1)}
            />
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Idempotency: se genera automáticamente en cada envío.
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              onClick={linkWire}
              disabled={loading}
              onFocus={() => setActiveStep(1)}
              onMouseEnter={() => setActiveStep(1)}
              endIcon={<ArrowForwardIosIcon fontSize="small" />}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 2,
                background: "linear-gradient(135deg, #0f7bff, #0ac5a8)",
                boxShadow: "0 14px 34px rgba(15,123,255,0.25)",
              }}
            >
              Crear cuenta wire
            </Button>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6} display="flex">
          <Stack
            spacing={1.25}
            sx={{
              flex: 1,
              minHeight: "100%",
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(15,23,42,0.06)",
              borderRadius: 3,
              p: 2.5,
              boxShadow: "0 14px 34px rgba(15,23,42,0.08)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip
                label="Paso 2"
                size="small"
                variant="filled"
                sx={{
                  fontWeight: 700,
                  bgcolor: step2Active ? "#0f7bff" : "#e2e8f0",
                  color: step2Active ? "#fff" : "#0f172a",
                  boxShadow: step2Active ? "0 8px 18px rgba(15,123,255,0.25)" : "none",
                  "& .MuiChip-label": {
                    fontWeight: 800,
                    color: "inherit",
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: "#334155", fontWeight: 800 }}>
                Crear payout a banco
              </Typography>
            </Stack>
            <TextField
              label="ID de destino"
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              size="small"
              helperText="ID de la cuenta wire creada"
              onFocus={() => setActiveStep(2)}
            />
            <TextField
              label="Monto USD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              size="small"
              helperText="Mínimo 1.00 USD y saldo suficiente en Circle"
              onFocus={() => setActiveStep(2)}
            />
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              onClick={sendPayout}
              disabled={loading}
              onFocus={() => setActiveStep(2)}
              onMouseEnter={() => setActiveStep(2)}
              endIcon={<ArrowForwardIosIcon fontSize="small" />}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 2,
                background: "linear-gradient(135deg, #0f7bff, #0ac5a8)",
                boxShadow: "0 14px 34px rgba(15,123,255,0.25)",
              }}
            >
              Enviar payout
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {lastPayoutId && (
        <Box sx={{ mt: 2, position: "relative", zIndex: 1 }}>
          <Typography variant="body2" sx={{ color: "#0f172a" }}>
            Último payout ID: {lastPayoutId}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
