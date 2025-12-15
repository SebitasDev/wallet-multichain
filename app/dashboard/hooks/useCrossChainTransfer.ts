import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Address } from "abitype";

import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";
import { useFacilitator, FacilitatorChainKey } from "@/app/facilitator";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { STELLAR } from "@/app/constants/chais/Stellar";

// Types
export const STELLAR_CHAIN_KEY = "Stellar";

export type FormValues = {
    sourceChain: FacilitatorChainKey;
    destChain: FacilitatorChainKey | typeof STELLAR_CHAIN_KEY;
    recipient: string;
    amount: string;
};

export const useCrossChainTransfer = () => {
    const [open, setOpen] = useState(false);
    const [privateKey, setPrivateKey] = useState<`0x${string}` | null>(null);
    const [provider, setProvider] = useState<any>(null);

    const { address, isUsingXO } = useXOContracts();
    const mainWallet = useXOWalletStore((s) => s.mainWallet);
    const currentPassword = useWalletPasswordStore((s) => s.currentPassword);

    // Setup provider or private key
    useEffect(() => {
        const setup = async () => {
            if (isUsingXO) {
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
        transferStellar,
        getFee,
        getTotalWithFee,
        isLoading,
        error,
    } = useFacilitator({
        provider: provider || undefined,
        privateKey: !provider ? privateKey || undefined : undefined,
        userAddress: address as Address,
    });

    const form = useForm<FormValues>({
        defaultValues: {
            sourceChain: "Base",
            destChain: "Polygon",
            recipient: "",
            amount: "",
        },
    });

    const { watch, reset, handleSubmit } = form;
    const watchAmount = watch("amount");
    const watchSourceChain = watch("sourceChain");
    const watchDestChain = watch("destChain");

    const isCrossChain = watchSourceChain !== watchDestChain;

    // Logic: "Minimun calculated based on SOURCE chain fee" (Reverted logic)
    const minAmount = useMemo(() => {
        if (watchSourceChain === watchDestChain) {
            return 0;
        }

        if (watchDestChain === STELLAR_CHAIN_KEY) {
            return 0.001; // Testing minimum for 1-Click Bridge
        }

        const sourceConfig = NETWORKS[watchSourceChain];
        return sourceConfig?.aproxFromFee || 0;
    }, [watchSourceChain, watchDestChain]);

    const isAmountValid = useMemo(() => {
        if (!watchAmount || watchAmount.trim() === "") return true;
        const amount = parseFloat(watchAmount);
        if (isNaN(amount)) return false;
        return amount >= minAmount;
    }, [watchAmount, minAmount]);

    const openModal = () => setOpen(true);
    const closeModal = () => {
        reset();
        setOpen(false);
    };

    const fee = useMemo(() => {
        if (!watchAmount) return "0.00";
        if (watchDestChain === STELLAR_CHAIN_KEY) {
            return STELLAR.aproxFromFee.toString();
        }
        return getFee();
    }, [watchAmount, watchDestChain, getFee]);

    const total = watchAmount ? getTotalWithFee(watchAmount) : "0.00";

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

        if (isNaN(amount) || amount < minAmount) {
            toast.error(`El monto mínimo es ${minAmount} USDC`);
            return;
        }

        // Stellar Logic
        if (data.destChain === STELLAR_CHAIN_KEY) {
            toast.info("Firmando autorización para Stellar...");
            try {
                const result = await transferStellar(
                    data.amount,
                    data.sourceChain,
                    data.recipient
                );

                if (result.success) {
                    toast.success(`Transfer a Stellar exitoso! TX EVM: ${result.transactionHash?.slice(0, 10)}...`);
                    closeModal();
                } else {
                    toast.error(`Error Stellar: ${result.errorReason}`);
                }
            } catch (err) {
                console.error(err);
                toast.error("Error al procesar el transfer a Stellar");
            }
            return;
        }

        toast.info("Firmando autorización...");

        try {
            let result;

            if (data.sourceChain === data.destChain) {
                result = await transferDirect(
                    data.amount,
                    data.sourceChain,
                    data.recipient as Address
                );
            } else {
                result = await transferCrossChain(
                    data.amount,
                    data.sourceChain,
                    data.destChain as FacilitatorChainKey,
                    data.recipient as Address
                );
            }

            if (result.success) {
                toast.success(`Transfer exitoso! TX: ${result.transactionHash?.slice(0, 10)}...`);
                if (result.burnTransactionHash) {
                    toast.info(`Burn TX: ${result.burnTransactionHash.slice(0, 10)}... Circle minteará automáticamente.`);
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

    return {
        // State
        open,
        address,
        privateKey,
        provider,
        isLoading,
        error,

        // Form
        form,
        watchAmount,
        watchSourceChain,
        watchDestChain,
        isCrossChain,
        minAmount,
        isAmountValid,

        // Computed
        fee,
        total,

        // Actions
        openModal,
        closeModal,
        onSubmit: handleSubmit(onSubmit),
    };
};
