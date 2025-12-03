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
import { formatCurrency } from "@/app/utils/formatCurrency";
import {NETWORKS} from "@/app/constants/chainsInformation";
import {Controller} from "react-hook-form";
import {useSendMoney} from "@/app/dashboard/hooks/useSendMoney";

type Props = {
    walletNames?: Record<string, string>;
};

export function SendMoneyModal({walletNames}: Props) {

    const { sendLoading, control, handleSubmit, errors, handleOnSend, handleOnConfirm,
        canSend, routeDetails, selected, isOpen, setSendModal, routeReady, routeSummary
    } = useSendMoney(walletNames);


  return (
    <Dialog
      open={isOpen}
      onClose={() => setSendModal(false)}
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
        {sendLoading && (
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
              <Controller
                  control={control}
                  name="sendChain"
                  render={({ field }) => (
                      <TextField
                          select
                          label="Chain destino"
                          fullWidth
                          size="medium"
                          disabled={sendLoading}
                          {...field}
                          error={!!errors.sendChain}
                          helperText={errors.sendChain?.message}
                      >
                          {Object.entries(NETWORKS).map(([key, cfg]) => (
                              <MenuItem key={key} value={key}>
                                  <Stack direction="row" alignItems="center" spacing={1.2}>
                                      {cfg.icon}
                                      <Typography>{cfg.label}</Typography>
                                  </Stack>
                              </MenuItem>
                          ))}
                      </TextField>
                  )}
              />

              <Controller
                  control={control}
                  name="toAddress"
                  render={({ field }) => (
                      <TextField
                          label="Address destino"
                          fullWidth
                          size="medium"
                          placeholder="0x..."
                          disabled={sendLoading}
                          {...field}
                          error={!!errors.toAddress}
                          helperText={errors.toAddress?.message}
                      />
                  )}
              />


              <Controller
                  control={control}
                  name="sendAmount"
                  render={({ field }) => (
                      <TextField
                          label="Monto"
                          fullWidth
                          size="medium"
                          placeholder="0.00"
                          type="number"
                          inputProps={{ min: 0, step: "0.0001" }}
                          disabled={sendLoading}
                          {...field}
                          error={!!errors.sendAmount}
                          helperText={errors.sendAmount?.message}
                      />
                  )}
              />


              <Controller
                  control={control}
                  name="sendPassword"
                  render={({ field }) => (
                      <TextField
                          label="Password de la wallet"
                          fullWidth
                          size="medium"
                          type="password"
                          placeholder="********"
                          disabled={sendLoading}
                          {...field}
                          error={!!errors.sendPassword}
                          helperText={errors.sendPassword?.message}
                      />
                  )}
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
                      <Box>
                        <Typography fontWeight={800}>{wallet.walletName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {wallet.wallet}
                        </Typography>
                      </Box>
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
                                  {formatCurrency(
                                      r.amount
                                  )}
                              </Typography>

                              <Typography variant="body2" color="text.secondary">
                                  - {formatCurrency(
                                        (Object.values(NETWORKS).find(n => n.chain.id.toString() === r.id)?.aproxFromFee ?? 0) + 0.01
                                    )}
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
                        {routeReady || "N/D"}
                    </Typography>

                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                        {selected?.icon}
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Llega en {selected?.label || "Chain destino"}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Box textAlign={{ xs: "left", sm: "right" }}>
                    <Typography fontWeight={800}>Recibe</Typography>

                    <Typography fontWeight={900}>
                        {formatCurrency(routeSummary?.targetAmount ?? 0)}
                    </Typography>

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
          onClick={() => setSendModal(false)}
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
              disabled={!canSend || sendLoading}
              onClick={routeReady ? handleOnConfirm : handleSubmit(handleOnSend)}
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
              {sendLoading ? "Cargando..." : routeReady ? "Confirmar" : "Aceptar"}
          </Button>
      </DialogActions>
    </Dialog>
  );
}
