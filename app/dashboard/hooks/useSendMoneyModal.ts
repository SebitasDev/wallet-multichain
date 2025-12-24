import { SendForm, sendSchema } from "@/app/lib/zod/sendSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { JSX, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AllocationSummary } from "../types";
import { useFindBestRoute } from "./useFindBestRoute";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useSessionWalletStore } from "@/app/store/useSessionWalletStore";
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore";
import { toast } from "react-toastify";
import { Address } from "viem";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { useBridgeUsdcStream } from "@/app/dashboard/hooks/useBridgeUsdcStream";
import { useFacilitator, FacilitatorChainKey } from "@/app/facilitator";

export type RouteStatus =
    | "idle"
    | "starting"
    | "approving"
    | "burning"
    | "waiting"
    | "minting"
    | "done"
    | "error";

export type RouteDetail = {
    wallet: string;
    walletName: string;
    chains: {
        id: string;
        label: string;
        icon: JSX.Element | null;
        amount: number;
        status: RouteStatus;
        message: string;
    }[];
};


export const useSendMoneyModal = () => {
    const [sendLoading, setSendLoading] = useState(false);
    const [routeReady, setRouteReady] = useState(false);
    const [routeSummary, setRouteSummary] = useState<AllocationSummary | null>(null);
    const { allocateAcrossNetworks } = useFindBestRoute();
    const { unlockWallet, transferBalance } = useWalletStore();
    const generalWallet = useSessionWalletStore(state => state.address);
    const { setSendModal, isOpen } = useSendMoneyStore();
    const [routeDetails, setRouteDetails] = useState<RouteDetail[]>([]);

    const resolveChain = (chainId: string | number) => {
        const id = String(chainId);

        // Check if it's a key first (unlikely but possible based on usage)
        if (id in NETWORKS) return NETWORKS[id as ChainKey];

        const found = Object.values(NETWORKS).find(
            (c) => String(c.evm?.chain.id) === id,
        );

        return found ?? { label: id.toUpperCase(), icon: null };
    };

    useEffect(() => {
        if (!routeSummary) return;

        const details = routeSummary.allocations.map((a) => ({
            wallet: a.from,
            walletName: a.from,
            chains: a.chains.map((c) => {
                const chainDef = resolveChain(c.chainId);
                return {
                    id: c.chainId,
                    label: chainDef.label,
                    icon: chainDef.icon,
                    amount: c.amount,
                    status: "idle" as RouteStatus,
                    message: "",
                };
            }),
        }));

        setRouteDetails(details);
    }, [routeSummary]);

    useBridgeUsdcStream((e) => {
        console.log("📩 Evento recibido en useBridgeUsdcStream:", e);

        if (!e) return;

        if (e.type === "chain-step") {
            const chainId = NETWORKS[e.payload.chain as ChainKey]?.evm?.chain.id.toString();

            if (!chainId) return;

            setRouteDetails(prev =>
                prev.map(wallet =>
                    wallet.wallet.toLowerCase() === e.payload.wallet.toLowerCase()
                        ? {
                            ...wallet,
                            chains: wallet.chains.map(c =>
                                c.id.toString() === chainId
                                    ? {
                                        ...c,
                                        status: e.payload.step as RouteStatus,
                                        message: e.payload.message,
                                    }
                                    : c
                            )
                        }
                        : wallet
                )
            );
        }
        else {
            console.log("ℹ️ Evento con otro type:", e.type);
        }
    });


    const { control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<SendForm>({
        resolver: zodResolver(sendSchema),
        defaultValues: {
            toAddress: "",
            sendAmount: "",
            sendPassword: "",
            sendChain: "Base",
            optimize: false
        },
    });

    useEffect(() => {
        if (!isOpen) {
            reset({
                toAddress: "",
                sendAmount: "",
                sendPassword: "",
                sendChain: "Base",
            });

            setSendLoading(false);
            setRouteReady(false);
            setRouteSummary(null);
            setRouteDetails([]);
        }
    }, [isOpen, reset]);

    const handleOnSend = async (data: SendForm) => {
        const { sendChain, sendAmount, toAddress } = data;

        if (routeReady) {
            toast.success("Transferencia iniciada (demo)");
            setSendModal(false);
            reset();
            return;
        }

        try {
            setSendLoading(true);

            const summary = await allocateAcrossNetworks(
                Number(sendAmount),
                toAddress as Address,
                sendChain,
                watch("optimize")
            );

            setRouteSummary(summary);
            setRouteReady(true);
            toast.info("Ruta encontrada. Ahora puedes enviar.");
        } catch (err) {
            console.error(err);
            toast.error("No se pudo calcular la ruta");
        } finally {
            setSendLoading(false);
        }
    };

    // Note: useFacilitator expects a base config. We can init with defaults or connection state.
    // For the LOOP, we will use the `overrideCredentials` param we added to `executeTransfer`.
    const { executeTransfer } = useFacilitator({
        userAddress: "0x0000000000000000000000000000000000000000", // Dummy init, will override
    });


    const handleOnConfirm = async () => {
        console.log("🔹 Starting handleOnConfirm (Refactored)");

        const toValidChain = (watch("sendChain") in NETWORKS ? watch("sendChain") : "Base") as ChainKey;
        const recipient = watch("toAddress");

        console.log("Destination:", toValidChain, recipient);

        // Loop Allocations
        for (const allocation of routeSummary!.allocations) {

            // 1. Unlock Wallet (Get Private Key)
            const unlockedKey = await unlockWallet(allocation.from, watch("sendPassword"));
            if (!unlockedKey) {
                toast.error(`No se pudo desbloquear la wallet ${allocation.from}`);
                continue;
            }

            for (const chain of allocation.chains) {
                const fromValidChain = CHAIN_ID_TO_KEY[chain.chainId] ?? "Base";
                const amountFloat = Number(chain.amount);
                const amountString = amountFloat.toString(); // executeTransfer expects string

                // Safe checks
                const fromNet = NETWORKS[fromValidChain as ChainKey];
                const toNet = NETWORKS[toValidChain as ChainKey];

                if (!fromNet || !fromNet.evm || !toNet || !toNet.evm) {
                    toast.error("Invalid chain for EVM transfer");
                    continue;
                }

                // Update UI Status
                setRouteDetails(prev =>
                    prev.map(wallet =>
                        wallet.wallet.toLowerCase() === allocation.from.toLowerCase()
                            ? {
                                ...wallet,
                                chains: wallet.chains.map(c =>
                                    c.id.toString() === chain.chainId.toString()
                                        ? { ...c, status: "starting", message: "Iniciando..." }
                                        : c
                                )
                            }
                            : wallet
                    )
                );

                // Determine Fee (Same logic as useCrossChainTransfer)
                // 0.01 for Same Chain, 0.02 for Cross Chain
                const currentFee = fromValidChain === toValidChain ? 0.01 : 0.02;

                // Add fee to the amount to be signed/transferred
                // Because we removed the auto-add in createAuthorizationPayload
                const totalAmount = (amountFloat + currentFee).toFixed(6);

                try {
                    // EXECUTE UNIFIED TRANSFER
                    // This handles Same-Chain (Gasless) AND Cross-Chain (CCTP) automatically via Smart Router

                    const result = await executeTransfer({
                        amount: totalAmount, // Send total (Amount + Fee)
                        sourceChain: fromValidChain as FacilitatorChainKey,
                        destinationChain: toValidChain as FacilitatorChainKey,
                        recipient: recipient,
                        overrideCredentials: {
                            privateKey: unlockedKey as `0x${string}`,
                            userAddress: allocation.from as Address
                        }
                    });

                    if (result.success) {
                        // Update UI Success
                        setRouteDetails(prev =>
                            prev.map(wallet =>
                                wallet.wallet.toLowerCase() === allocation.from.toLowerCase()
                                    ? {
                                        ...wallet,
                                        chains: wallet.chains.map(c =>
                                            c.id.toString() === chain.chainId.toString()
                                                ? { ...c, status: "done", message: "Completado" }
                                                : c
                                        )
                                    }
                                    : wallet
                            )
                        );

                        // Update Balance Store (Simulated)
                        transferBalance(
                            allocation.from as Address,
                            recipient as Address,
                            fromNet.evm.chain.id.toString(),
                            toNet.evm.chain.id.toString(),
                            amountFloat
                        );

                    } else {
                        throw new Error(result.errorReason);
                    }

                } catch (e: any) {
                    console.error("Transfer error:", e);
                    setRouteDetails(prev =>
                        prev.map(wallet =>
                            wallet.wallet.toLowerCase() === allocation.from.toLowerCase()
                                ? {
                                    ...wallet,
                                    chains: wallet.chains.map(c =>
                                        c.id.toString() === chain.chainId.toString()
                                            ? { ...c, status: "error", message: e.message || "Error" }
                                            : c
                                    )
                                }
                                : wallet
                        )
                    );
                }
            }
        }

        console.log("✅ Final transfer completed");
        toast.success("Transacciones completadas");
    };

    const wallets = useWalletStore((state) => state.wallets);

    const getOriginFee = (id: string) => {
        const key = CHAIN_ID_TO_KEY[id] as ChainKey;
        if (!key) return 0.003;
        return NETWORKS[key]?.crossChainInformation?.circleInformation?.aproxFromFee || 0.003;
    };

    const maxSendAmount = wallets.reduce((total, wallet) => {
        const walletTotal = wallet.chains.reduce((sum, chain) => {
            const amount = Number(chain.amount);
            const fee = getOriginFee(chain.chainId);
            // Logic matching useFindBestRoute:
            // Available = Amount - 0.01 (buffer) - Fee
            const available = amount - 0.01 - fee;

            return available > 0 ? sum + available : sum;
        }, 0);
        return total + walletTotal;
    }, 0);

    // Format to 6 decimals to match precision
    const formattedMaxSendAmount = maxSendAmount > 0 ? parseFloat(maxSendAmount.toFixed(6)) : 0;

    const currentSendAmount = Number(watch("sendAmount") || 0);
    const isExceedingMax = currentSendAmount > formattedMaxSendAmount;

    const canSend = !!watch("toAddress") && !!watch("sendAmount") && !!watch("sendPassword") && !isExceedingMax;

    const selected = NETWORKS[watch("sendChain") as ChainKey];

    return {
        sendLoading,
        control,
        handleSubmit,
        errors,
        handleOnSend,
        handleOnConfirm,
        canSend,
        routeDetails,
        selected,
        isOpen,
        setSendModal,
        routeReady,
        routeSummary,
        setRouteSummary,
        setValue,
        maxSendAmount: formattedMaxSendAmount,
        isExceedingMax
    }

}
