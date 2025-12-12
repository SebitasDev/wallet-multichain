"use client";

import { useState } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogActions,
    Box,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";
import { TextField, MenuItem, Stack, Typography } from "@mui/material";
import {NETWORKS} from "@/app/constants/chainsInformation";

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
            chain: "Base",
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

    // Chains disponibles (puedes filtrar según tus necesidades)
    const availableChains = ["Base", "Arbitrum", "Polygon", "Optimism", "Unichain", "Avalanche"];

    return (
        <>
            {/* BOTÓN QUE ABRE EL MODAL */}
            <Button
                variant="contained"
                onClick={openModal}
                disabled={!address}
                sx={{
                    background: "#7852FF",
                    color: "white",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    px: 3.4,
                    py: 1.5,
                    minHeight: 50,
                    borderRadius: 3,
                    textTransform: "none",
                    border: "3px solid #000000",
                    boxShadow: "4px 4px 0px #000000",
                    whiteSpace: "nowrap",
                    width: "100%",
                    minWidth: 0,
                    maxWidth: 240,
                    transition: "all 0.2s",
                    "&:hover": {
                        background: "#6342E6",
                        transform: "translate(2px, 2px)",
                        boxShadow: "2px 2px 0px #000000",
                    },
                    "&:disabled": {
                        background: "#cccccc",
                        color: "#666666",
                        border: "3px solid #999999",
                        boxShadow: "none",
                        transform: "none",
                    },
                }}
            >
                Enviar desde Main
            </Button>

            {/* MODAL */}
            <Dialog
                open={open}
                onClose={closeModal}
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
                        display: "flex",
                        alignItems: "center",
                        px: 3,
                        py: 2.5,
                        background: "#000000",
                        color: "#fff",
                        borderBottom: "3px solid #000000",
                    }}
                >
                    <Typography sx={{ flex: 1 }} fontSize={18} fontWeight={800}>
                        Enviar dinero
                    </Typography>

                    <IconButton
                        onClick={closeModal}
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
                    <Stack spacing={2.5} mt={0.5}>
                        {/* CHAIN */}
                        <Box>
                            <Typography
                                fontWeight={700}
                                fontSize={13}
                                sx={{
                                    mb: 1,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                    color: "#666666"
                                }}
                            >
                                Chain destino
                            </Typography>
                            <Controller
                                control={control}
                                name="chain"
                                render={({ field }) => (
                                    <TextField
                                        select
                                        fullWidth
                                        {...field}
                                        InputProps={{
                                            sx: {
                                                borderRadius: 2,
                                                background: "#f5f5f5",
                                                border: "2px solid #000000",
                                                fontWeight: 600,
                                                "&:hover": {
                                                    background: "#ffffff",
                                                },
                                                "&.Mui-focused": {
                                                    background: "#ffffff",
                                                }
                                            }
                                        }}
                                    >
                                        {availableChains.map((chainKey) => {
                                            const chainConfig = NETWORKS[chainKey as keyof typeof NETWORKS];
                                            return (
                                                <MenuItem key={chainKey} value={chainKey}>
                                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                                        <Box sx={{
                                                            width: 24,
                                                            height: 24,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            "& svg": {
                                                                width: "100%",
                                                                height: "100%",
                                                            }
                                                        }}>
                                                            {chainConfig.icon}
                                                        </Box>
                                                        <Typography fontWeight={600}>
                                                            {chainConfig.label}
                                                        </Typography>
                                                    </Stack>
                                                </MenuItem>
                                            );
                                        })}
                                    </TextField>
                                )}
                            />
                        </Box>

                        {/* ADDRESS DESTINO */}
                        <Box>
                            <Typography
                                fontWeight={700}
                                fontSize={13}
                                sx={{
                                    mb: 1,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                    color: "#666666"
                                }}
                            >
                                Address destino
                            </Typography>
                            <Controller
                                control={control}
                                name="to"
                                render={({ field }) => (
                                    <TextField
                                        placeholder="0x..."
                                        fullWidth
                                        {...field}
                                        InputProps={{
                                            sx: {
                                                borderRadius: 2,
                                                background: "#f5f5f5",
                                                border: "2px solid #000000",
                                                fontWeight: 600,
                                                fontFamily: "monospace",
                                                "&:hover": {
                                                    background: "#ffffff",
                                                },
                                                "&.Mui-focused": {
                                                    background: "#ffffff",
                                                }
                                            }
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* MONTO */}
                        <Box>
                            <Typography
                                fontWeight={700}
                                fontSize={13}
                                sx={{
                                    mb: 1,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                    color: "#666666"
                                }}
                            >
                                Monto (USD)
                            </Typography>
                            <Controller
                                control={control}
                                name="amount"
                                render={({ field }) => (
                                    <TextField
                                        type="number"
                                        placeholder="0.00"
                                        fullWidth
                                        inputProps={{ min: 0, step: "0.0001" }}
                                        {...field}
                                        InputProps={{
                                            sx: {
                                                borderRadius: 2,
                                                background: "#f5f5f5",
                                                border: "2px solid #000000",
                                                fontWeight: 700,
                                                fontSize: 16,
                                                "&:hover": {
                                                    background: "#ffffff",
                                                },
                                                "&.Mui-focused": {
                                                    background: "#ffffff",
                                                }
                                            }
                                        }}
                                    />
                                )}
                            />
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 3, gap: 2, background: "#ffffff" }}>
                    <Button
                        onClick={closeModal}
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
                        onClick={handleSubmit(onSubmit)}
                        disabled={sendLoading}
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
                            },
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