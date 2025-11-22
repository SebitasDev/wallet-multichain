"use client";

import { formatCurrency } from "@/app/utils/formatCurrency";
import { Box, Typography } from "@mui/material";
import {useBalanceStore} from "@/app/store/useBalanceStore";

type Props = {
  background: string;
};

export function HeroBanner({ background }: Props) {
  const { totalChains, value } = useBalanceStore();

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        position: "relative",
        overflow: "hidden",
        background,
        color: "#fff",
        textAlign: "center",
        py: { xs: 6, md: 7 },
        borderRadius: "24px",
        boxShadow: "0 26px 55px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0, transparent 30%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.18) 0, transparent 25%)",
          opacity: 0.7,
        }}
      />
        <Typography
          variant="body2"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 0.6,
            fontSize: 12,
            position: "relative",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Balance Total
        </Typography>
        <Typography
          sx={{
          fontSize: { xs: 42, md: 54 },
          fontWeight: 900,
          mt: 1,
          lineHeight: 1,
          position: "relative",
          textShadow: "0 6px 18px rgba(0,0,0,0.18)",
        }}
        >
          {value !== null ? formatCurrency(value) : "--"}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontSize: 13, position: "relative" }}>
          {totalChains} addresses conectadas
      </Typography>
    </Box>
  );
}
