"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ArrowForwardIos from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import { useEffect, useMemo, useState } from "react";

type ChainInfo = {
  name: string;
  tag: string;
  color: string;
  tokens: number;
  value: number;
};

type Wallet = {
  name: string;
  address: string;
  chains: ChainInfo[];
  total: number;
  defaultExpanded?: boolean;
};

const wallets: Wallet[] = [
  {
    name: "Main Wallet",
    address: "0x742d ... bBe7",
    total: 12847.32,
    defaultExpanded: true,
    chains: [
      { name: "Base", tag: "BASE", color: "#1d7bff", tokens: 2, value: 4234.56 },
      { name: "Optimism", tag: "OP", color: "#e53935", tokens: 2, value: 5612.76 },
      { name: "Ethereum", tag: "ETH", color: "#111827", tokens: 2, value: 3000.0 },
    ],
  },
  {
    name: "Trading Account",
    address: "0x8Ba1 ... Ba72",
    total: 8234.12,
    defaultExpanded: true,
    chains: [
      { name: "Base", tag: "BASE", color: "#1d7bff", tokens: 2, value: 6234.12 },
      { name: "Arbitrum", tag: "ARB", color: "#1c7ed6", tokens: 2, value: 2000.0 },
    ],
  },
];

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

const Dot = ({ color }: { color: string }) => (
  <Box
    sx={{
      width: 14,
      height: 14,
      borderRadius: "50%",
      background: color,
      boxShadow: "0 0 0 3px rgba(17,24,39,0.05)",
      flexShrink: 0,
    }}
  />
);

const TagChip = ({ label }: { label: string }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      fontSize: 11,
      height: 24,
      borderRadius: "999px",
      backgroundColor: "rgba(16,185,129,0.12)",
      color: "#16a34a",
      fontWeight: 700,
      textTransform: "uppercase",
    }}
  />
);

type WalletCardProps = { wallet: Wallet };

function WalletCard({ wallet }: WalletCardProps) {
  const [expanded, setExpanded] = useState(wallet.defaultExpanded ?? false);
  const visibleChains = useMemo(
    () => (expanded ? wallet.chains : wallet.chains.slice(0, 2)),
    [expanded, wallet.chains],
  );

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 10px 35px rgba(15,23,42,0.08)",
        border: "1px solid #e5e7eb",
        backgroundColor: "#fff",
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            pt: 2.75,
            pb: 1.5,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Typography fontWeight={700} fontSize={17} color="#0f172a">
              {wallet.name}
            </Typography>
            <Chip
              label={`${wallet.chains.length} chains`}
              size="small"
              sx={{
                fontSize: 11,
                height: 24,
                color: "#0f5132",
                backgroundColor: "rgba(16,185,129,0.15)",
                borderRadius: "999px",
                fontWeight: 700,
              }}
            />
          </Stack>
          <Box sx={{ textAlign: "right" }}>
            <Typography fontWeight={800} fontSize={20} color="#0f172a" lineHeight={1}>
              {formatCurrency(wallet.total)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 12, mt: 0.4 }}
            >
              Valor Total
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            px: 3,
            py: 1.25,
            background: "linear-gradient(120deg, #f1f7ff 0%, #e8f5f1 100%)",
            borderTop: "1px solid #e5e7eb",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
            {wallet.address}
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton size="small" sx={{ color: "#6b7280" }}>
              <ContentCopyOutlined fontSize="small" />
            </IconButton>
            <IconButton size="small" sx={{ color: "#6b7280" }}>
              <LinkOutlined fontSize="small" />
            </IconButton>
            <IconButton size="small" sx={{ color: "#6b7280" }}>
              <OpenInNewOutlined fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {visibleChains.map((chain, index) => (
          <Box
            key={chain.name}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 3,
              py: 1.25,
              borderBottom:
                index === visibleChains.length - 1 ? "none" : "1px solid #f1f5f9",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Dot color={chain.color} />
              <Box>
                <Typography fontWeight={600} fontSize={14} color="#0f172a">
                  {chain.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: 12, mt: 0.4 }}
                >
                  {chain.tokens} tokens
                </Typography>
              </Box>
              <TagChip label={chain.tag} />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Typography fontWeight={700} fontSize={14}>
                {formatCurrency(chain.value)}
              </Typography>
              <ArrowForwardIos sx={{ fontSize: 14, color: "#9ca3af" }} />
            </Stack>
          </Box>
        ))}

        <Divider sx={{ mx: 3, backgroundColor: "#f1f5f9" }} />

        {wallet.chains.length > 2 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 3,
              py: 1.25,
              color: "#4b5563",
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            <Typography fontWeight={600} fontSize={13}>
              {expanded ? "Mostrar menos" : "Mostrar mas"}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [heroBg, setHeroBg] = useState(
    "linear-gradient(110deg, #1f3fb8 0%, #0086b7 50%, #1aa167 100%)",
  );
  const [heroTotal, setHeroTotal] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [addressValue, setAddressValue] = useState("");

  useEffect(() => {
    const pastelOscuro = () =>
      `hsl(${Math.floor(Math.random() * 360)}, 80%, 65%)`;
    const c1 = pastelOscuro();
    const c2 = pastelOscuro();
    setHeroBg(`linear-gradient(135deg, ${c1}, ${c2})`);

    const randomTotal = Math.random() * 15000 + 12000;
    setHeroTotal(Number(randomTotal.toFixed(2)));
  }, []);

  const words = addressValue.trim() ? addressValue.trim().split(/\s+/).filter(Boolean) : [];
  const has12Words = words.length === 12;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f6fb" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2.5, md: 5 },
          py: 2.25,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
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
          onClick={() => setOpenModal(true)}
        >
          Agregar Address
        </Button>
      </Box>

      <Box
        sx={{
          background: heroBg,
          color: "#fff",
          textAlign: "center",
          py: 5,
        }}
      >
        <Typography
          variant="body2"
          sx={{ textTransform: "uppercase", letterSpacing: 0.6, fontSize: 12 }}
        >
          Balance Total
        </Typography>
        <Typography
          sx={{ fontSize: { xs: 34, md: 44 }, fontWeight: 900, mt: 1, lineHeight: 1 }}
        >
          {heroTotal !== null ? formatCurrency(heroTotal) : "--"}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontSize: 13 }}>
          2 addresses conectadas
        </Typography>
      </Box>

      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          px: { xs: 2.5, md: 4 },
          pb: 6,
          mt: 4,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{ alignItems: "stretch" }}
        >
          {wallets.map((wallet) => (
            <Box key={wallet.name} sx={{ flex: 1 }}>
              <WalletCard wallet={wallet} />
            </Box>
          ))}
          <Box sx={{ height: 250 }} />
        </Stack>
      </Box>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
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
          <IconButton
            size="small"
            onClick={() => setOpenModal(false)}
            sx={{ color: "#fff" }}
          >
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
                onChange={(e) => setWalletName(e.target.value)}
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
                value={addressValue}
                onChange={(e) => setAddressValue(e.target.value)}
                placeholder="palabra1 palabra2 ... palabra12"
                InputProps={{ sx: { borderRadius: 2, background: "#f8fafc" } }}
                helperText={
                  addressValue
                    ? `${words.length}/12 palabras`
                    : "Separa cada palabra con espacio y respeta el orden exacto."
                }
                multiline
                minRows={3}
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
            onClick={() => setOpenModal(false)}
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
            onClick={() => setOpenModal(false)}
            disabled={!walletName.trim() || !has12Words}
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
    </Box>
  );
}
