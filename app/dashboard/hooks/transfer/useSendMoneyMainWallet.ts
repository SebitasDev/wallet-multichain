import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useXOContracts } from "@/app/dashboard/hooks/wallet/useXOConnect";
import { useFacilitator } from "@/app/facilitator";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { Address } from "abitype";

export type FormValues = {
    chain: string;
    to: string;
    amount: string;
};

export const availableChains = ["Base", "Arbitrum", "Polygon", "Optimism", "Unichain", "Avalanche"];

export const useSendMoneyMainWallet = () => {
    const [open, setOpen] = useState(false);
    const { address } = useXOContracts();

    // We assume Main Wallet uses standard Facilitator flow (Gasless or CCTP)
    // For now, this hook seems restricted to EVM? The original code had "base" or "polygon".

    // Setup Facilitator
    // Note: If using XO Connect, provider is handled there. If local wallet, we might need private key logic here
    // similar to useCrossChainTransfer. However, useSendMoneyMainWallet seems to rely on useXOContracts for `payX402`
    // which implies it prefers the XO provider/Account.
    // The previous implementation used `payX402` which likely used the XO signer.
    // `useFacilitator` expects a provider to sign.

    const { provider: xoProvider, isUsingXO } = useXOContracts();
    const mainWallet = useXOWalletStore((s) => s.mainWallet);
    const currentPassword = useWalletPasswordStore((s) => s.currentPassword);

    // Simplification: We instantiate Facilitator with best guess of credentials.
    // If XO is active, utilize it.

    const { executeTransfer, isLoading: sendLoading } = useFacilitator({
        provider: xoProvider,  // If XO is connected, this is populated? useXOContracts mostly returns actions.
        userAddress: address as Address,
        // If we needed private key decrypting like in useCrossChainTransfer, we'd add it here.
        // Assuming for "Main Wallet" send, we rely on the primary connected method.
    });

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

        toast.info("Procesando pago...");

        try {
            // Using unified executeTransfer
            // Note: sourceChain and destinationChain are the SAME for a simple "Send Money" usually.
            // But if user selects "Chain" in form, it might mean "Destination Chain" or "Network to use"?
            // Usually "Send Money" implies sending FROM your current chain TO a recipient.
            // But if `data.chain` is a selection, presumably it's the network to send ON.
            // So Source = Dest = data.chain.

            const result = await executeTransfer({
                amount: data.amount,
                sourceChain: data.chain as any,
                destinationChain: data.chain as any,
                recipient: data.to
            });

            if (result.success) {
                toast.success(
                    `Pago exitoso! TX: ${result.transactionHash?.slice(0, 10)}...`
                );
                closeModal();
            } else {
                toast.error(`Error: ${result.errorReason}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Error al procesar el pago");
        }
    };

    return {
        open,
        openModal,
        closeModal,
        control,
        handleSubmit,
        onSubmit,
        sendLoading,
        address,
    };
};

