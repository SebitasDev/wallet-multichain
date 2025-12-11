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
      boxShadow: "0 0 0 4px rgba(255,255,255,0.06), 0 8px 18px rgba(0,0,0,0.35)",
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
      background: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))",
      color: "#f3f4f6",
      fontWeight: 700,
      textTransform: "uppercase",
      border: "1px solid rgba(255,255,255,0.16)",
      letterSpacing: "0.4px",
      backdropFilter: "blur(10px)",
      boxShadow: "0 14px 34px rgba(0,0,0,0.4)",
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
        minWidth: { xs: "78vw", sm: 320 },
        maxWidth: 360,
        flex: "0 0 auto",
        display: "inline-flex",
        mr: { xs: 1, sm: 1.75 },
        mb: { xs: 1.8, sm: 2.5 },
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        position: "relative",
        isolation: "isolate",
        borderRadius: 22,
        overflow: "hidden",
        boxShadow:
          "0 25px 70px rgba(0,0,0,0.78), 0 12px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
        border: "1px solid rgba(126,87,255,0.22)",
        backgroundColor: "#0a0818",
        backgroundImage:
          "radial-gradient(circle at 18% 12%, rgba(118,87,255,0.24) 0%, transparent 26%), radial-gradient(circle at 82% 0%, rgba(255,72,160,0.22) 0%, transparent 22%), linear-gradient(185deg, #0f0a1f 0%, #0c0a1a 45%, #060510 100%)",
        color: "#f9fafb",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: -6,
          borderRadius: "inherit",
          background: "linear-gradient(135deg, rgba(126,87,255,0.38), rgba(255,72,160,0.32))",
          filter: "blur(20px)",
          opacity: 0.4,
          zIndex: 0,
        },
      }}
    >
      <CardContent sx={{ p: 0, position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            pt: 2.4,
            pb: 1.25,
            backgroundColor: "transparent",
            boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.08)",
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
                color: "#f9fafb",
                maxWidth: { xs: 160, sm: 220 },
                minWidth: 0,
                whiteSpace: showNameExpanded ? "normal" : "nowrap",
                textOverflow: showNameExpanded ? "clip" : "ellipsis",
                overflow: "hidden",
                letterSpacing: "0.35px",
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
                sx={{
                  color: "rgba(255,255,255,0.85)",
                  p: 0.25,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.14)" },
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
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
                color: "#f3f4f6",
                background: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.07))",
                borderRadius: "999px",
                fontWeight: 700,
                border: "1px solid rgba(255,255,255,0.2)",
                letterSpacing: "0.3px",
                backdropFilter: "blur(12px)",
                boxShadow: "0 14px 36px rgba(0,0,0,0.48)",
              }}
            />
          </Stack>
          <Box sx={{ textAlign: "right" }}>
            <Typography fontWeight={800} fontSize={21} sx={{ color: "#f9fafb" }} lineHeight={1}>
              {formatCurrency(wallet.total)}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12, mt: 0.4, color: "rgba(249,250,251,0.6)" }}>
              Valor Total
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            px: 3,
            py: 1,
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Typography variant="body2" sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            {wallet.address}
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              sx={{
                color: "rgba(255,255,255,0.85)",
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "#ffffff",
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(wallet.address, "Address");
              }}
            >
              <ContentCopyOutlined fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                color: "rgba(255,255,255,0.85)",
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "#ffffff",
                },
              }}
            >
              <LinkOutlined fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                color: "rgba(255,255,255,0.85)",
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "#ffffff",
                },
              }}
            >
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
              py: 1.05,
              borderBottom:
                index === visibleChains.length - 1 ? "none" : "1px solid rgba(255,255,255,0.06)",
              transition: "background-color 0.2s ease, border-color 0.2s ease",
              backgroundColor: "rgba(8,8,18,0.9)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Dot color={chain.color} />
              <Box>
                <Typography fontWeight={600} fontSize={14} sx={{ color: "#f9fafb" }}>
                  {chain.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: 12, mt: 0.4, color: "rgba(249,250,251,0.6)" }}
                >
                  {chain.tokens} tokens
                </Typography>
              </Box>
              <TagChip label={chain.tag} />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Typography fontWeight={700} fontSize={14} sx={{ color: "#f9fafb" }}>
                {formatCurrency(chain.value)}
              </Typography>
              <ArrowForwardIos sx={{ fontSize: 14, color: "rgba(249,250,251,0.55)" }} />
            </Stack>
          </Box>
        ))}

        <Divider sx={{ mx: 3, backgroundColor: "rgba(255,255,255,0.07)" }} />

        {wallet.chains.length > 2 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 3,
              py: 1.05,
              color: "rgba(249,250,251,0.75)",
              cursor: "pointer",
              userSelect: "none",
              transition: "color 0.2s ease, background-color 0.2s ease",
              "&:hover": {
                color: "#ffffff",
                backgroundColor: "rgba(255,255,255,0.04)",
              },
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
