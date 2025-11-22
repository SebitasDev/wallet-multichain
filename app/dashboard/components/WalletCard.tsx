"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ArrowForwardIos from "@mui/icons-material/ArrowForwardIos";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ChainInfo, Wallet } from "../types";
import { formatCurrency } from "@/app/utils/formatCurrency";

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

type Props = { wallet: Wallet };

export function WalletCard({ wallet }: Props) {
  const [expanded, setExpanded] = useState(wallet.defaultExpanded ?? false);
  const [showNameExpanded, setShowNameExpanded] = useState(false);
  const visibleChains = useMemo(
    () => (expanded ? wallet.chains : wallet.chains.slice(0, 2)),
    [expanded, wallet.chains],
  );

  const copyToClipboard = async (value: string, label: string) => {
    const text = value ? String(value) : "";
    if (!text) {
      toast.error("No hay nada para copiar");
      return;
    }
    const onSuccess = () => toast.success(`${label} copiado`);
    const onError = () => toast.error("No se pudo copiar");
    const promptFallback = () => {
      const manual = window.prompt("Copia y pega:", text);
      if (manual !== null) onSuccess();
    };
    const fallbackCopy = () => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        const ok = document.execCommand("copy");
        ok ? onSuccess() : onError();
      } catch {
        onError();
        promptFallback();
      } finally {
        document.body.removeChild(textarea);
      }
    };

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        onSuccess();
      } else {
        fallbackCopy();
      }
    } catch {
      fallbackCopy();
    }
  };

  const exceedsNameLimit = wallet.name.length > 12;
  const displayName =
    exceedsNameLimit && !showNameExpanded
      ? `${wallet.name.slice(0, 12)}...`
      : wallet.name;

  return (
    <Card
      sx={{
        borderRadius: 12,
        overflow: "hidden",
        boxShadow:
          "0 0 0 1.5px rgba(255,255,255,0.1), 0 0 10px rgba(200,200,200,0.6), 0 10px 24px rgba(15,23,42,0.18), inset 0 0 0 1.5px rgba(210,210,210,0.7)",
        border: "1.25px solid rgba(215,215,215,0.85)",
        background: "#ffffff",
        color: "#0f172a",
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
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            flexWrap="nowrap"
            sx={{ minWidth: 0, overflow: "hidden" }}
          >
            <Typography
              fontWeight={700}
              fontSize={17}
              sx={{
                color: "#0f172a",
                maxWidth: { xs: 150, sm: 200 },
                minWidth: 0,
                whiteSpace: showNameExpanded ? "normal" : "nowrap",
                textOverflow: showNameExpanded ? "clip" : "ellipsis",
                overflow: "hidden",
              }}
              title={wallet.name}
            >
              {displayName}
            </Typography>
            {exceedsNameLimit && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNameExpanded((prev) => !prev);
                }}
                sx={{ color: "#2563eb", p: 0.25 }}
              >
                {showNameExpanded ? (
                  <ExpandLess sx={{ fontSize: 18 }} />
                ) : (
                  <ExpandMore sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            )}
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
            <Typography fontWeight={800} fontSize={20} sx={{ color: "#0f172a" }} lineHeight={1}>
              {formatCurrency(wallet.total)}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12, mt: 0.4, color: "#cbd5e1" }}>
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
          <Typography variant="body2" sx={{ fontSize: 13, color: "#4b5563" }}>
            {wallet.address}
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              sx={{ color: "#6b7280" }}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(wallet.address, "Address");
              }}
            >
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
                <Typography fontWeight={600} fontSize={14} sx={{ color: "#0f172a" }}>
                  {chain.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: 12, mt: 0.4, color: "#6b7280" }}
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
