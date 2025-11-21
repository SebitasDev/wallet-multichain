"use client";

import { Box, Typography } from "@mui/material";
import { formatCurrency } from "../utils/formatCurrency";

type Props = {
  background: string;
  total: number | null;
};

export function HeroBanner({ background, total }: Props) {
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
        {total !== null ? formatCurrency(total) : "--"}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, fontSize: 13 }}>
        2 addresses conectadas
      </Typography>
    </Box>
  );
}
