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
import { Address, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { getPrivateClientByNetworkName } from "@/app/utils/getClientByNetworkName";
import { createAccount } from "@/app/cross-chain-core/clientFactory";
import { createPaymaster } from "@/app/cross-chain-core/paymasterFactory";
import { bundlerClientFactory } from "@/app/cross-chain-core/bundlerClientFactory";
import { createAuthorization } from "@/app/cross-chain-core/autorizationFactory";
import { usdcAbi } from "@/app/cross-chain-core/usdcAbi";
import { toUSDCBigInt } from "@/app/utils/toUSDCBigInt";
import { useBridgeUsdcStream } from "@/app/dashboard/hooks/useBridgeUsdcStream";

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

    const handleOnConfirm = async () => {
        console.log("🔹 Starting handleOnTest");

        //change this
        const account = privateKeyToAccount("0x2817cf84953d5d6283c479ce478bb91c50e21eb7fef347b25a60e7b7708a71dc" as Address);
        console.log("Account:", account.address);

        const toValidChain = (watch("sendChain") in NETWORKS ? watch("sendChain") : "Base") as ChainKey;
        console.log("Destination chain:", toValidChain);

        const getWriter = (chainName: ChainKey) => {
            console.log("Getting client for chain:", chainName);
            const chainId = NETWORKS[chainName]?.evm?.chain.id;
            if (!chainId) throw new Error("Chain ID not found for " + chainName);
            return getPrivateClientByNetworkName(chainId, account);
        };

        const transfer = async (
            chainName: ChainKey,
            to: string,
            amount: bigint,
            optionalPrivateKey?: string,
        ) => {
            const networkOk = NETWORKS[chainName];
            if (!networkOk || !networkOk.evm) {
                throw new Error(`Chain ${chainName} is not valid for EVM transfer`);
            }

            const token = networkOk.assets.find(a => a.name === "USDC")?.address;
            const chainId = networkOk.evm.chain.id;

            if (!token) throw new Error("USDC address not found");

            const client = optionalPrivateKey
                ? getPrivateClientByNetworkName(chainId, privateKeyToAccount(optionalPrivateKey as Address))
                : getWriter(chainName);

            console.log(`➡️ Transferring ${amount} on ${chainName} to ${to} using ${optionalPrivateKey ? "custom key" : "main account"}`);

            const toClient = createPublicClient({
                chain: client.chain,
                transport: http()
            });

            const toAccount = await createAccount(toClient, optionalPrivateKey as Address)

            setRouteDetails?.((prev: any) =>
                prev.map((wallet: any) =>
                    wallet.wallet.toLowerCase() === toAccount.owner.address.toLowerCase()
                        ? {
                            ...wallet,
                            chains: wallet.chains.map((c: any) =>
                                c.id.toString() === client.chain.id.toString()
                                    ? {
                                        ...c,
                                        status: "transfer",
                                        message: "Transfiriendo...",
                                    }
                                    : c
                            ),
                        }
                        : wallet
                )
            );

            const paymasterTo =
                await createPaymaster.getPaymasterData(token as Address, toAccount.account, toClient)

            const bundlerClientTo = bundlerClientFactory({
                account: toAccount.account,
                client: toClient,
                paymaster: {
                    getPaymasterData: async () => paymasterTo,
                },
            });

            const authorization = await createAuthorization(toAccount.owner, toClient, toAccount.account)

            const hash = await bundlerClientTo.sendUserOperation({
                account: toAccount.account,
                calls: [
                    {
                        to: token as Address,
                        abi: usdcAbi,
                        functionName: "approve",
                        args: [process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" : "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d", toUSDCBigInt(10000),],
                    },
                    {
                        to: token as Address,
                        abi: usdcAbi,
                        functionName: "transfer",
                        args: [to, amount],
                    }
                ],
                authorization: authorization,
            });

            console.log("operation transfer", hash);

            const receiptSuply = await bundlerClientTo.waitForUserOperationReceipt({ hash: hash });
            console.log("Transaction realizada", receiptSuply.receipt.transactionHash);

            setRouteDetails?.((prev: any) =>
                prev.map((wallet: any) =>
                    wallet.wallet.toLowerCase() === toAccount.owner.address.toLowerCase()
                        ? {
                            ...wallet,
                            chains: wallet.chains.map((c: any) =>
                                c.id.toString() === client.chain.id.toString()
                                    ? {
                                        ...c,
                                        status: "done",
                                        message: "Transferencia finalizada",
                                    }
                                    : c
                            ),
                        }
                        : wallet
                )
            );

            return hash;
        };

        console.log("🔹 Starting main allocation loop");

        for (const allocation of routeSummary!.allocations) {
            const unlocked = await unlockWallet(allocation.from, watch("sendPassword"));

            for (const chain of allocation.chains) {
                const fromValidChain = CHAIN_ID_TO_KEY[chain.chainId] ?? "Base";
                const normalizedAmount = BigInt(Math.floor(Math.max(Number(chain.amount), 0) * 1e6));

                // Safe checks
                const fromNet = NETWORKS[fromValidChain as ChainKey];
                const toNet = NETWORKS[toValidChain as ChainKey];

                if (!fromNet || !fromNet.evm || !toNet || !toNet.evm) {
                    toast.error("Invalid chain for EVM transfer");
                    continue;
                }

                if (fromValidChain === toValidChain) {
                    await transfer(fromValidChain, watch("toAddress"), normalizedAmount, unlocked);

                    transferBalance(
                        allocation.from as Address,
                        watch("toAddress") as Address,
                        fromNet.evm.chain.id.toString(),
                        toNet.evm.chain.id.toString(),
                        Number(normalizedAmount) / 1e6
                    );
                } else {
                    await fetch("/api/bridge-usdc", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            amount: Number(normalizedAmount) / 1e6,
                            fromChain: fromValidChain,
                            toChain: toValidChain,
                            recipient: watch("toAddress"),
                            privateKey: unlocked,
                        }),
                    });

                    transferBalance(
                        allocation.from as Address,
                        watch("toAddress") as Address,
                        fromNet.evm.chain.id.toString(),
                        toNet.evm.chain.id.toString(),
                        Number(normalizedAmount) / 1e6
                    );
                }
            }
        }


        /*console.log("🔹All allocations processed, sending final transfer to destination");

        const totalChains = routeSummary!.allocations.reduce((acc, a) => acc + a.chains.length, 0);

        // Sumar todos los montos originales
        const totalAmountRaw = routeSummary!.allocations
            .flatMap(a => a.chains.map(c => c.amount))
            .reduce((acc, n) => acc + n, 0);

        // Restar 0.01 por cada chain solo para el envío final
        const adjustedTotal = Math.max(totalAmountRaw - 0.01 * totalChains, 0);

        const finalAmount = parseUnits(adjustedTotal.toFixed(6), 6);
        console.log(`Original: ${totalAmountRaw}, Chains: ${totalChains}, Ajustado: ${adjustedTotal}`);

        await transfer(toValidChain, toAddress, finalAmount);*/
        console.log("✅ Final transfer completed");
        toast.success("Transacciones completados");
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
