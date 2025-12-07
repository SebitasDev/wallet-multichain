"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import {useSendMoney} from "@/app/dashboard/hooks/useSendMoney";
import {FormSendMoney} from "@/app/dashboard/components/sendMoney/FormSendMoney";
import {FinishRoute} from "@/app/dashboard/components/sendMoney/FinishRoute";

type Props = {
    walletNames?: Record<string, string>;
};

export function SendMoneyModal({walletNames}: Props) {

    const { sendLoading, control, handleSubmit, errors, handleOnSend, handleOnConfirm,
        canSend, routeDetails, selected, isOpen, setSendModal, routeReady, routeSummary,
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
      slotProps={{
          backdrop: {
              sx: {
                  backdropFilter: "blur(25px) brightness(0.7)",
                  backgroundColor: "rgba(255,255,255,0.05)", // glass suave
              },
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
        {!routeReady ? ( <FormSendMoney control={control} sendLoading={sendLoading} errors={errors} />) : (
          <FinishRoute routeSummary={routeSummary} routeDetails={routeDetails} routeReady={routeReady} selected={selected} />
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
