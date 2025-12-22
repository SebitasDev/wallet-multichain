import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";


export type FormValues = {
    chain: string;
    to: string;
    amount: string;
};

export const availableChains = ["Base", "Arbitrum", "Polygon", "Optimism", "Unichain", "Avalanche"];

export const useSendMoneyMainWallet = () => {
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
