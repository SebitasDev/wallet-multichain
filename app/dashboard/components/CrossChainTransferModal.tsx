"use client";

import { useState, useEffect } from "react";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Stack,
    Typography,
    Box,
    Chip,
    Alert,
} from "@mui/material";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";
import { useFacilitator, FacilitatorChainKey } from "@/app/facilitator";
import { Address } from "abitype";
import { useMainWalletStore } from "@/app/store/useMainWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";

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
        facilitatorAddress,
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
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": {
                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    },
                    "&:disabled": {
                        background: "#4b5563",
                        color: "#9ca3af",
                    },
                }}
            >
                Cross-Chain Transfer (Facilitador)
            </Button>

            <Dialog open={open} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6">Cross-Chain Transfer</Typography>
                        <Chip
                            label="CCTP"
                            size="small"
                            sx={{ bgcolor: "#10b981", color: "white" }}
                        />
                    </Stack>
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
                            Este transfer usa tu propio facilitador. El usuario firma una
                            autorización (gasless) y el facilitador ejecuta el CCTP de Circle.
                        </Alert>

                        {/* SOURCE CHAIN */}
                        <Controller
                            control={control}
                            name="sourceChain"
                            render={({ field }) => (
                                <TextField select label="Chain origen" fullWidth {...field}>
                                    {CHAIN_OPTIONS.map((chain) => (
                                        <MenuItem key={chain} value={chain}>
                                            {chain}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />

                        {/* DEST CHAIN */}
                        <Controller
                            control={control}
                            name="destChain"
                            render={({ field }) => (
                                <TextField select label="Chain destino" fullWidth {...field}>
                                    {CHAIN_OPTIONS.map((chain) => (
                                        <MenuItem key={chain} value={chain}>
                                            {chain}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />

                        {/* RECIPIENT */}
                        <Controller
                            control={control}
                            name="recipient"
                            render={({ field }) => (
                                <TextField
                                    label="Address destino"
                                    placeholder="0x..."
                                    fullWidth
                                    {...field}
                                />
                            )}
                        />

                        {/* AMOUNT */}
                        <Controller
                            control={control}
                            name="amount"
                            render={({ field }) => (
                                <TextField
                                    label="Monto USDC"
                                    type="number"
                                    placeholder="0.00"
                                    fullWidth
                                    inputProps={{ min: 0, step: "0.01" }}
                                    {...field}
                                />
                            )}
                        />

                        {/* FEE INFO */}
                        {watchAmount && parseFloat(watchAmount) > 0 && (
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: "#1f2937",
                                    borderRadius: 2,
                                    border: "1px solid #374151",
                                }}
                            >
                                <Stack spacing={1}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography color="gray">Monto:</Typography>
                                        <Typography>{watchAmount} USDC</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography color="gray">Fee facilitador:</Typography>
                                        <Typography color="#10b981">{fee} USDC</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography color="gray" fontWeight={600}>
                                            Total a firmar:
                                        </Typography>
                                        <Typography fontWeight={600}>{total} USDC</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography color="gray">Tipo:</Typography>
                                        <Chip
                                            label={isCrossChain ? "Cross-Chain" : "Mismo Chain"}
                                            size="small"
                                            sx={{
                                                bgcolor: isCrossChain ? "#8b5cf6" : "#6366f1",
                                                color: "white",
                                            }}
                                        />
                                    </Stack>
                                </Stack>
                            </Box>
                        )}

                        {error && <Alert severity="error">{error}</Alert>}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={closeModal} disabled={isLoading}>
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleSubmit(onSubmit)}
                        disabled={isLoading || !watchAmount || !watch("recipient")}
                        sx={{
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        }}
                    >
                        {isLoading ? (
                            <>
                                <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
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
