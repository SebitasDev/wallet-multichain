"use client";

import { Box, Container } from "@mui/material";
import { CircleOnrampPanel } from "../dashboard/components/CircleOnrampPanel";

export default function OfframpPage() {
  return (
    <Box
      sx={{ minHeight: "100vh", backgroundColor: "#0f1219" }}
      suppressHydrationWarning
    >
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 7 } }}>
        <CircleOnrampPanel />
      </Container>
    </Box>
  );
}
