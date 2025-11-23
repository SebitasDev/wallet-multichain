"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ShieldIcon from "@mui/icons-material/Shield";
import SpeedIcon from "@mui/icons-material/Speed";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupsIcon from "@mui/icons-material/Groups";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Link from "next/link";

const features = [
  {
    title: "Multi-chain sin fricción",
    desc: "Gestiona direcciones, tokens y balances en mÃºltiples chains desde un solo panel.",
    icon: <RocketLaunchIcon />,
  },
  {
    title: "Onboarding en segundos",
    desc: "Importa tu seed de forma segura o agrega addresses watch-only sin fricciónes.",
    icon: <SpeedIcon />,
  },
  {
    title: "Seguridad por diseño",
    desc: "Cifrado local de seeds, sin exponer llaves. Copias rápidas y QR listos para recibir fondos.",
    icon: <ShieldIcon />,
  },
];

const steps = [
  {
    title: "1. Conecta tus wallets",
    desc: "Agrega tu seed o pega tus addresses para ver balances multi-chain al instante.",
  },
  {
    title: "2. Visualiza y organiza",
    desc: "Resumen unificado de cadenas, tokens y valor total con cards claras y accesibles.",
  },
  {
    title: "3. Envía y recibe seguro",
    desc: "Flujos guiados para Envíar/recibir con QR, selección de chain y feedback en tiempo real.",
  },
];

const values = [
  {
    title: "Transparencia",
    desc: "Código y flujos claros, sin pantallas ocultas ni fees sorpresa.",
    icon: <CheckCircleIcon />,
  },
  {
    title: "Confianza",
    desc: "UI sólida y consistente, pensada para demos y hackathons exigentes.",
    icon: <GroupsIcon />,
  },
  {
    title: "Eficiencia",
    desc: "Accesos rápidos, copiado Ã¡gil y acciones directas para ahorrar clics.",
    icon: <TrendingUpIcon />,
  },
];

export default function Home() {
  return (
    <Box sx={{ backgroundColor: "#0c1018", color: "#e9ecf2", minHeight: "100vh" }}>
      <Hero />

      <Box id="features" component="section">
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          <SectionTitle
            label="Por quÃ© MultiChain Wallet"
            title="Unifica tu stack cripto en una sola experiencia"
          />
          <Grid container spacing={2.5} sx={{ mt: 2 }} justifyContent="center">
            {features.map((f) => (
              <Grid item xs={12} md={6} lg={5} key={f.title}>
                <Card
                  sx={{
                    height: "100%",
                    background: "#111827",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 3,
                    boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #0f7bff, #0ac5a8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        mb: 1.5,
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Typography fontWeight={800} sx={{ mb: 1, color: "#f8fafc" }}>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(233,236,242,0.85)" }}>
                      {f.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box
        id="como-funciona"
        component="section"
        sx={{ background: "#0e131d", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, scrollMarginTop: 96 }}>
          <Grid container spacing={1.5} alignItems="flex-start">
            <Grid item xs={12} md={6} sx={{ maxWidth: { md: 760 }, ml: { md: 0 } }}>
              <Card
                sx={{
                  height: "100%",
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 3,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
                  p: 3,
                }}
              >
                <SectionTitle label="Cómo funciona" title="De cero a productivo en minutos" compact />
                <Stack spacing={2.25} sx={{ mt: 2 }}>
                  {steps.map((s) => (
                    <Box key={s.title} sx={{ display: "flex", gap: 1.5 }}>
                      <Chip
                        label={s.title.split(".")[0]}
                        size="small"
                        sx={{
                          background: "rgba(124,195,255,0.18)",
                          color: "#7cc3ff",
                          fontWeight: 700,
                          minWidth: 36,
                        }}
                      />
                      <Box>
                        <Typography fontWeight={800} sx={{ color: "#f8fafc" }}>
                          {s.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(233,236,242,0.85)" }}>
                          {s.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                maxWidth: { md: 760 },
                ml: { md: "auto" },
                mt: { xs: 2.5, md: 6 },
                display: "flex",
              }}
            >
              <Card
                sx={{
                  height: "100%",
                  background: "linear-gradient(135deg, rgba(15,123,255,0.16), rgba(10,197,168,0.12))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 3,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
                  p: 3,
                  width: "100%",
                }}
              >
                <SectionTitle
                  label="Nuestro enfoque"
                  title="Seguridad y diseño centrado en el usuario"
                  compact
                />
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {values.map((v) => (
                    <Box
                      key={v.title}
                      sx={{
                        display: "flex",
                        gap: 1.25,
                        alignItems: "flex-start",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 2,
                        p: 1.5,
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#0ac5a8",
                        }}
                      >
                        {v.icon}
                      </Box>
                      <Box>
                        <Typography fontWeight={800} sx={{ color: "#f8fafc" }}>
                          {v.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(233,236,242,0.85)" }}>
                          {v.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <CTA />
    </Box>
  );
}

function Hero() {
  return (
    <Box
      component="section"
      sx={{
        background:
          "radial-gradient(circle at 20% 20%, rgba(18,51,90,0.6) 0, transparent 24%), radial-gradient(circle at 80% 0%, rgba(28,138,163,0.5) 0, transparent 18%), linear-gradient(120deg, #0b1220, #101726)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
        px: { xs: 2.5, md: 6 },
        py: { xs: 6, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack spacing={2.5}>
              <Chip
                label="MultiChain Wallet Â· ETHGlobal"
                sx={{
                  alignSelf: "flex-start",
                  background: "rgba(255,255,255,0.1)",
                  color: "#8bd0ff",
                  fontWeight: 700,
                }}
              />
              <Typography
                sx={{
                  fontSize: { xs: 32, md: 42 },
                  fontWeight: 900,
                  lineHeight: 1.1,
                  color: "#f9fafb",
                }}
              >
                Gestiona todas tus wallets multichain en un solo lugar, con flujos claros y seguros.
              </Typography>
              <Typography sx={{ color: "rgba(233,236,242,0.9)", maxWidth: 620 }}>
                Conecta, organiza y opera en mÃºltiples chains con una interfaz enfocada en claridad,
                seguridad y velocidad para demos y producciÃ³n.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="flex-start">
                <Button
                  component={Link}
                  href="/dashboard"
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    px: 3,
                    py: 1.2,
                    borderRadius: 2,
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #0f7bff 0%, #0ac5a8 100%)",
                    boxShadow: "0 14px 35px rgba(26,146,255,0.35)",
                  }}
                >
                  Ir al Dashboard
                </Button>
                <Button
                  component={Link}
                  href="#como-funciona"
                  variant="outlined"
                  sx={{
                    textTransform: "none",
                    px: 3,
                    py: 1.2,
                    borderRadius: 2,
                    fontWeight: 800,
                    color: "#f9fafb",
                    borderColor: "rgba(255,255,255,0.35)",
                    "&:hover": { borderColor: "#8bd0ff" },
                  }}
                >
                  Cómo funciona
                </Button>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ color: "rgba(233,236,242,0.8)", flexWrap: "wrap" }}>
                <Stack spacing={0.2}>
                  <Typography fontWeight={900} color="#8bd0ff">
                    + Múltiples tokens y wallets
                  </Typography>
                  <Typography variant="body2">Conecta y opera sin fricción</Typography>
                </Stack>
                <Stack spacing={0.2}>
                  <Typography fontWeight={900} color="#0ac5a8">
                    Envía guiado
                  </Typography>
                  <Typography variant="body2">Flujos seguros y claros</Typography>
                </Stack>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 3,
                boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
                p: 3,
              }}
            >
              <Typography fontWeight={800} sx={{ color: "#f9fafb", mb: 1 }}>
                Snapshot de la plataforma
              </Typography>
              <Stack spacing={1.5}>
                {["Dashboard unificado", "Copias rápidas y QR", "Envía/Recibe en 3 pasos"].map(
                  (item) => (
                    <Stack
                      key={item}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ color: "rgba(233,236,242,0.9)" }}
                    >
                      <CheckCircleIcon sx={{ color: "#0ac5a8" }} />
                      <Typography>{item}</Typography>
                    </Stack>
                  ),
                )}
              </Stack>
              <Box
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #0f7bff 0%, #7c3aed 100%)",
                  p: 2,
                  color: "#fff",
                }}
              >

                <Typography fontWeight={900} sx={{ fontSize: 24, lineHeight: 1.1 }}>
                  Simplificamos lo complejo de las chains
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function SectionTitle({
  label,
  title,
  compact = false,
}: {
  label: string;
  title: string;
  compact?: boolean;
}) {
  return (
    <Box sx={{ mb: compact ? 1.5 : 2 }}>
      <Typography
        variant="body2"
        sx={{ color: "rgba(233,236,242,0.75)", textTransform: "uppercase", letterSpacing: 1 }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: 22, md: 26 },
          fontWeight: 900,
          color: "#f9fafb",
          mt: 0.5,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}

function CTA() {
  return (
    <Box
      component="section"
      sx={{
        background: "linear-gradient(135deg, #0f7bff 0%, #7c3aed 50%, #0ac5a8 100%)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        mt: 6,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2.5}
          alignItems="center"
          justifyContent="space-between"
          sx={{ py: { xs: 5, md: 6 } }}
        >
          <Stack spacing={1}>
            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: { xs: 24, md: 28 } }}>
              Listo para ver tu wallet multichain en acción
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.92)" }}>
              Entra al dashboard, agrega tus addresses y empieza a operar en segundos.
            </Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={Link}
              href="/dashboard"
              variant="contained"
              sx={{
                textTransform: "none",
                px: 3,
                py: 1.1,
                borderRadius: 2,
                fontWeight: 800,
                background: "#0b1220",
                color: "#fff",
              }}
            >
              Ir al Dashboard
            </Button>
            <Button
              component="a"
              href="mailto:hola@multichainwallet.dev"
              variant="outlined"
              sx={{
                textTransform: "none",
                px: 3,
                py: 1.1,
                borderRadius: 2,
                fontWeight: 800,
                color: "#fff",
                borderColor: "rgba(255,255,255,0.65)",
              }}
            >
              ContÃ¡ctanos
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
