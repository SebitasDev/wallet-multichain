"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Stack,
    Typography,
    Box,
    Chip,
    Alert,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";
import { useFacilitator, FacilitatorChainKey } from "@/app/facilitator";
import { Address } from "abitype";
import { useMainWalletStore } from "@/app/store/useMainWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import {NETWORKS} from "@/app/constants/chainsInformation";

type FormValues = {
    sourceChain: FacilitatorChainKey;
    destChain: FacilitatorChainKey;
    recipient: string;
    amount: string;
};

const CHAIN_OPTIONS: FacilitatorChainKey[] = [
    "Base",
    "Polygon",
    "Arbitrum",
    "Optimism",
    "Unichain",
];

export const CrossChainTransferModal = () => {
    const [open, setOpen] = useState(false);
    const [privateKey, setPrivateKey] = useState<`0x${string}` | null>(null);
    const [provider, setProvider] = useState<any>(null);

    const { address, isUsingXO } = useXOContracts();
    const mainWallet = useMainWalletStore((s) => s.mainWallet);
    const currentPassword = useWalletPasswordStore((s) => s.currentPassword);

    // Cargar provider de XO o private key de wallet local
    useEffect(() => {
        const setup = async () => {
            if (isUsingXO) {
                // Obtener provider de XO
                try {
                    const { XOConnectProvider } = await import("xo-connect");
                    const xoProvider = new XOConnectProvider({
                        rpcs: { ["0x14a34"]: "https://base-sepolia.g.alchemy.com/v2/49fUGmuW05ynCui0VEvDN" },
                        defaultChainId: "0x14a34"
                    });
                    await xoProvider.request({ method: "eth_requestAccounts" });
                    setProvider(xoProvider);
                    console.log(">>> Provider XO configurado para firmar");
                } catch (e) {
                    console.error("Error setting up XO provider:", e);
                }
            } else if (mainWallet.encryptedPrivateKey && currentPassword) {
                // Cargar private key local
                try {
                    const pk = await decryptPrivateKey(
                        mainWallet.encryptedPrivateKey,
                        currentPassword,
                        mainWallet.salt!,
                        mainWallet.iv!
                    );
                    setPrivateKey(pk as `0x${string}`);
                    console.log(">>> Private key local cargada para firmar");
                } catch (e) {
                    console.error("Error decrypting private key:", e);
                }
            }
        };
        setup();
    }, [isUsingXO, mainWallet, currentPassword]);

    const {
        transferCrossChain,
        transferDirect,
        getFee,
        getTotalWithFee,
        isLoading,
        error,
    } = useFacilitator({
        provider: provider || undefined,
        privateKey: !provider ? privateKey || undefined : undefined,
        userAddress: address as Address,
    });

    const { control, handleSubmit, reset, watch } = useForm<FormValues>({
        defaultValues: {
            sourceChain: "Base",
            destChain: "Polygon",
            recipient: "",
            amount: "",
        },
    });

    const watchAmount = watch("amount");
    const watchSourceChain = watch("sourceChain");
    const watchDestChain = watch("destChain");

    // Calcular monto mínimo basado SOLO en la cadena de origen
    const minAmount = useMemo(() => {
        const sourceConfig = NETWORKS[watchSourceChain];
        return sourceConfig.aproxFromFee;
    }, [watchSourceChain]);

    // Validar si el monto es menor al mínimo - ARREGLADO
    const isAmountValid = useMemo(() => {
        if (!watchAmount || watchAmount.trim() === "") return true; // Si está vacío, no mostrar error
        const amount = parseFloat(watchAmount);
        if (isNaN(amount)) return false; // Si no es un número válido
        return amount >= minAmount;
    }, [watchAmount, minAmount]); // ⚠️ IMPORTANTE: agregar minAmount como dependencia

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

        if (!data.recipient || !data.amount) {
            toast.error("Completa todos los campos");
            return;
        }

        const amount = parseFloat(data.amount);

        // Validación final del monto mínimo
        if (isNaN(amount) || amount < minAmount) {
            toast.error(`El monto mínimo es ${minAmount} USDC`);
            return;
        }

        toast.info("Firmando autorización...");

        try {
            let result;

            if (data.sourceChain === data.destChain) {
                // Transfer directo (misma chain)
                result = await transferDirect(
                    data.amount,
                    data.sourceChain,
                    data.recipient as Address
                );
            } else {
                // Transfer cross-chain
                result = await transferCrossChain(
                    data.amount,
                    data.sourceChain,
                    data.destChain,
                    data.recipient as Address
                );
            }

            if (result.success) {
                toast.success(
                    `Transfer exitoso! TX: ${result.transactionHash?.slice(0, 10)}...`
                );
                if (result.burnTransactionHash) {
                    toast.info(
                        `Burn TX: ${result.burnTransactionHash.slice(0, 10)}... Circle minteará automáticamente.`
                    );
                }
                closeModal();
            } else {
                toast.error(`Error: ${result.errorReason}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Error al procesar el transfer");
        }
    };

    const isCrossChain = watchSourceChain !== watchDestChain;
    const fee = watchAmount ? getFee() : "0.00";
    const total = watchAmount ? getTotalWithFee(watchAmount) : "0.00";

    return (
        <>
            <Button
                variant="contained"
                onClick={openModal}
                disabled={!address || (!privateKey && !provider)}
                sx={{
                    background: "#00DC8C",
                    color: "#000000",
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
                    maxWidth: 280,
                    transition: "all 0.2s",
                    "&:hover": {
                        background: "#00CC7C",
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
                Cross-Chain Transfer
            </Button>

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
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                        <Typography fontSize={18} fontWeight={800}>
                            Cross-Chain Transfer
                        </Typography>
                        <Chip
                            label="CCTP"
                            size="small"
                            sx={{
                                bgcolor: "#00DC8C",
                                color: "#000000",
                                fontWeight: 800,
                                fontSize: 11,
                                border: "2px solid #000000",
                            }}
                        />
                    </Stack>

                    <IconButton
                        onClick={closeModal}
                        disabled={isLoading}
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
                        <Alert
                            severity="info"
                            sx={{
                                fontSize: "0.85rem",
                                border: "2px solid #3CD2FF",
                                borderRadius: 2,
                                bgcolor: "rgba(60, 210, 255, 0.1)",
                                color: "#000000",
                                fontWeight: 600,
                                "& .MuiAlert-icon": {
                                    color: "#3CD2FF"
                                }
                            }}
                        >
                            Este transfer usa tu propio facilitador. El usuario firma una
                            autorización (gasless) y el facilitador ejecuta el CCTP de Circle.
                        </Alert>

                        {/* SOURCE CHAIN */}
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
                                Chain origen
                            </Typography>
                            <Controller
                                control={control}
                                name="sourceChain"
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
                                        {CHAIN_OPTIONS.map((chain) => {
                                            const chainConfig = NETWORKS[chain as keyof typeof NETWORKS];
                                            return (
                                                <MenuItem key={chain} value={chain}>
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

                        {/* DEST CHAIN */}
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
                                name="destChain"
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
                                        {CHAIN_OPTIONS.map((chain) => {
                                            const chainConfig = NETWORKS[chain as keyof typeof NETWORKS];
                                            return (
                                                <MenuItem key={chain} value={chain}>
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

                        {/* RECIPIENT */}
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
                                name="recipient"
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

                        {/* AMOUNT */}
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography
                                    fontWeight={700}
                                    fontSize={13}
                                    sx={{
                                        textTransform: "uppercase",
                                        letterSpacing: 0.5,
                                        color: "#666666"
                                    }}
                                >
                                    Monto USDC
                                </Typography>
                                <Typography
                                    fontSize={11}
                                    fontWeight={700}
                                    sx={{
                                        color: "#00DC8C",
                                        bgcolor: "rgba(0, 220, 140, 0.1)",
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        border: "1px solid #00DC8C",
                                    }}
                                >
                                    Mínimo: {minAmount} USDC
                                </Typography>
                            </Stack>
                            <Controller
                                control={control}
                                name="amount"
                                render={({ field }) => (
                                    <TextField
                                        type="number"
                                        placeholder={`Mín. ${minAmount}`}
                                        fullWidth
                                        inputProps={{
                                            min: minAmount,
                                            step: "0.0001"
                                        }}
                                        {...field}
                                        error={!isAmountValid && !!watchAmount}
                                        helperText={
                                            !isAmountValid && watchAmount
                                                ? `El monto debe ser al menos ${minAmount} USDC`
                                                : ""
                                        }
                                        InputProps={{
                                            sx: {
                                                borderRadius: 2,
                                                background: "#f5f5f5",
                                                border: !isAmountValid && watchAmount
                                                    ? "2px solid #ff4444"
                                                    : "2px solid #000000",
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
                                        FormHelperTextProps={{
                                            sx: {
                                                fontWeight: 600,
                                                fontSize: 12,
                                                ml: 0.5,
                                            }
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* FEE INFO */}
                        {watchAmount && parseFloat(watchAmount) > 0 && (
                            <Box
                                sx={{
                                    p: 2.5,
                                    bgcolor: "#f5f5f5",
                                    borderRadius: 3,
                                    border: "2px solid #000000",
                                }}
                            >
                                <Stack spacing={1.5}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography color="#666666" fontWeight={600} fontSize={13}>
                                            Monto:
                                        </Typography>
                                        <Typography fontWeight={700} fontSize={14}>
                                            {watchAmount} USDC
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography color="#666666" fontWeight={600} fontSize={13}>
                                            Fee facilitador:
                                        </Typography>
                                        <Typography color="#00DC8C" fontWeight={700} fontSize={14}>
                                            {fee} USDC
                                        </Typography>
                                    </Stack>
                                    <Box sx={{
                                        borderTop: "2px solid #000000",
                                        pt: 1.5,
                                        mt: 0.5
                                    }}>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography color="#000000" fontWeight={800} fontSize={14}>
                                                Total a firmar:
                                            </Typography>
                                            <Typography fontWeight={800} fontSize={15}>
                                                {total} USDC
                                            </Typography>
                                        </Stack>
                                    </Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography color="#666666" fontWeight={600} fontSize={13}>
                                            Tipo:
                                        </Typography>
                                        <Chip
                                            label={isCrossChain ? "Cross-Chain" : "Mismo Chain"}
                                            size="small"
                                            sx={{
                                                bgcolor: isCrossChain ? "#7852FF" : "#3CD2FF",
                                                color: "#000000",
                                                fontWeight: 800,
                                                fontSize: 11,
                                                border: "2px solid #000000",
                                            }}
                                        />
                                    </Stack>
                                </Stack>
                            </Box>
                        )}

                        {/* ALERTA DE MONTO INSUFICIENTE */}
                        {!isAmountValid && watchAmount && (
                            <Alert
                                severity="warning"
                                sx={{
                                    border: "2px solid #FFA500",
                                    borderRadius: 2,
                                    bgcolor: "rgba(255, 165, 0, 0.1)",
                                    color: "#000000",
                                    fontWeight: 600,
                                    "& .MuiAlert-icon": {
                                        color: "#FFA500"
                                    }
                                }}
                            >
                                El monto debe ser al menos <strong>{minAmount} USDC</strong> para cubrir el fee del facilitador en {NETWORKS[watchSourceChain].label}.
                            </Alert>
                        )}

                        {error && (
                            <Alert
                                severity="error"
                                sx={{
                                    border: "2px solid #ff4444",
                                    borderRadius: 2,
                                    bgcolor: "rgba(255, 68, 68, 0.1)",
                                    color: "#000000",
                                    fontWeight: 600,
                                    "& .MuiAlert-icon": {
                                        color: "#ff4444"
                                    }
                                }}
                            >
                                {error}
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 3, gap: 2, background: "#ffffff" }}>
                    <Button
                        onClick={closeModal}
                        disabled={isLoading}
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
                        disabled={isLoading || !watchAmount || !watch("recipient") || !isAmountValid}
                        sx={{
                            flex: 1,
                            textTransform: "none",
                            borderRadius: 3,
                            py: 1.4,
                            fontWeight: 800,
                            fontSize: 15,
                            background: "#00DC8C",
                            color: "#000000",
                            border: "3px solid #000000",
                            boxShadow: "4px 4px 0px #000000",
                            transition: "all 0.2s",
                            "&:hover": {
                                background: "#00CC7C",
                                transform: "translate(2px, 2px)",
                                boxShadow: "2px 2px 0px #000000",
                            },
                            "&:disabled": {
                                opacity: 0.4,
                                background: "#cccccc",
                            },
                        }}
                    >
                        {isLoading ? (
                            <>
                                <CircularProgress size={20} sx={{ color: "#000000", mr: 1 }} />
                                Procesando...
                            </>
                        ) : (
                            `Enviar ${isCrossChain ? "(Cross-Chain)" : ""}`
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};