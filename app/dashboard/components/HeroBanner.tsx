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
        background,
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
        {value !== null ? formatCurrency(value) : "--"}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, fontSize: 13 }}>
          {totalChains} addresses conectadas
      </Typography>
    </Box>
  );
}
