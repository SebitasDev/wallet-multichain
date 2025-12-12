"use client";

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Typography,
    IconButton,
    CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
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
                    border: "3px solid #000000",
                    boxShadow: "8px 8px 0px #000000",
                    background: "#ffffff",
                },
            }}
        >
            {/* HEADER */}
            <Box
                sx={{
                    background: "#000000",
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    color: "#fff",
                    borderBottom: "3px solid #000000",
                }}
            >
                <Box
                    sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 2.5,
                        background: "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid rgba(255,255,255,0.2)",
                    }}
                >
                    <SendIcon />
                </Box>

                <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={800} fontSize={18} sx={{ lineHeight: 1.2 }}>
                        Enviar fondos
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, fontSize: 13 }}>
                        Elige la chain destino e ingresa address, monto y contraseña.
                    </Typography>
                </Box>

                <IconButton
                    size="small"
                    onClick={() => setSendModal(false)}
                    disabled={sendLoading}
                    sx={{
                        color: "white",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 2,
                        "&:hover": {
                            background: "rgba(255,255,255,0.2)",
                        },
                        "&:disabled": {
                            color: "rgba(255,255,255,0.3)",
                        }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: 3, py: 3, background: "#ffffff" }}>
                {!routeReady ? (
                    <FormSendMoney control={control} sendLoading={sendLoading} errors={errors} />
                ) : (
                    <FinishRoute
                        routeSummary={routeSummary}
                        routeDetails={routeDetails}
                        routeReady={routeReady}
                        selected={selected}
                    />
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 2, background: "#ffffff" }}>
                <Button
                    variant="outlined"
                    onClick={() => setSendModal(false)}
                    disabled={sendLoading}
                    sx={{
                        flex: 1,
                        textTransform: "none",
                        borderRadius: 3,
                        py: 1.4,
                        fontWeight: 800,
                        fontSize: 15,
                        background: "#ffffff",
                        color: "#000000",
                        border: "3px solid #000000",
                        boxShadow: "4px 4px 0px #000000",
                        transition: "all 0.2s",
                        "&:hover": {
                            background: "#f5f5f5",
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000",
                        },
                        "&:disabled": {
                            opacity: 0.4,
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
                        flex: 1,
                        textTransform: "none",
                        borderRadius: 3,
                        py: 1.4,
                        fontWeight: 800,
                        fontSize: 15,
                        background: "#7852FF",
                        color: "#ffffff",
                        border: "3px solid #000000",
                        boxShadow: "4px 4px 0px #000000",
                        transition: "all 0.2s",
                        "&:hover": {
                            background: "#6342E6",
                            transform: "translate(2px, 2px)",
                            boxShadow: "2px 2px 0px #000000",
                        },
                        "&:disabled": {
                            opacity: 0.4,
                            background: "#cccccc",
                            transform: "none",
                        },
                    }}
                >
                    {sendLoading ? (
                        <>
                            <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                            Cargando...
                        </>
                    ) : routeReady ? "Confirmar" : "Aceptar"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}