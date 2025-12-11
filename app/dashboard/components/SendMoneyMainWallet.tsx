"use client";

import { useState } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";
import { TextField, MenuItem, Stack, Typography } from "@mui/material";

type FormValues = {
    chain: string;
    to: string;
    amount: string;
};

export const SendMoneyMainWallet = () => {
    const [open, setOpen] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);
    const { payX402, address } = useXOContracts();

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            chain: "base",
            to: "",
            amount: "",
        },
    });

    const openModal = () => setOpen(true);
    const closeModal = () => {
        reset();
        setOpen(false);
    };

    const onSubmit = async (data: FormValues) => {
        if (!address) {
            toast.error("No hay wallet conectada");
            return;
        }

        setSendLoading(true);
        toast.info("Procesando pago...");

        try {
            const result = await payX402(data.amount, data.to, data.chain as "base" | "polygon");

            if (result.success) {
                toast.success(
                    `Pago exitoso! TX: ${result.txHash?.slice(0, 10)}...`
                );
                closeModal();
            } else {
                toast.error(`Error: ${result.error}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Error al procesar el pago");
        } finally {
            setSendLoading(false);
        }
    };

    return (
        <>
            {/* BOTÓN QUE ABRE EL MODAL */}
            <Button
                variant="contained"
                onClick={openModal}
                disabled={!address}
                sx={{
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "white",
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": {
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    },
                    "&:disabled": {
                        background: "#4b5563",
                        color: "#9ca3af",
                    },
                }}
            >
                Enviar dinero desde Main wallet
            </Button>

            {/* MODAL */}
            <Dialog open={open} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle>Enviar dinero</DialogTitle>

                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        {/* CHAIN */}
                        <Controller
                            control={control}
                            name="chain"
                            render={({ field }) => (
                                <TextField select label="Chain destino" fullWidth {...field}>

                                    <MenuItem value="base">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography>Base</Typography>
                                        </Stack>
                                    </MenuItem>

                                    <MenuItem value="arbitrum">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography>Arbitrum</Typography>
                                        </Stack>
                                    </MenuItem>

                                    <MenuItem value="polygon">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography>Polygon</Typography>
                                        </Stack>
                                    </MenuItem>

                                </TextField>
                            )}
                        />

                        {/* ADDRESS DESTINO */}
                        <Controller
                            control={control}
                            name="to"
                            render={({ field }) => (
                                <TextField
                                    label="Address destino"
                                    placeholder="0x..."
                                    fullWidth
                                    {...field}
                                />
                            )}
                        />

                        {/* MONTO */}
                        <Controller
                            control={control}
                            name="amount"
                            render={({ field }) => (
                                <TextField
                                    label="Monto"
                                    type="number"
                                    placeholder="0.00"
                                    fullWidth
                                    inputProps={{ min: 0, step: "0.0001" }}
                                    {...field}
                                />
                            )}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={closeModal} disabled={sendLoading}>
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleSubmit(onSubmit)}
                        disabled={sendLoading}
                        sx={{
                            background:
                                "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        }}
                    >
                        {sendLoading ? (
                            <>
                                <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                                Enviando...
                            </>
                        ) : (
                            "Enviar"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
