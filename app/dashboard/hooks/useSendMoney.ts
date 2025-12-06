import {SendForm, sendSchema } from "@/app/lib/zod/sendSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {JSX, useEffect, useState} from "react";
import { useForm } from "react-hook-form";
import { AllocationSummary } from "../types";
import { useFindBestRoute } from "./useFindBestRoute";
import { useWalletStore } from "@/app/store/useWalletsStore";
import {useGeneralWalletStore} from "@/app/store/useGeneralWalletStore";
import {useSendModalState} from "@/app/dashboard/store/useSendModalState";
import {toast} from "react-toastify";
import {Address, createPublicClient, http, parseUnits} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {CHAIN_ID_TO_KEY, ChainKey, NETWORKS} from "@/app/constants/chainsInformation";
import { getPrivateClientByNetworkName } from "@/app/utils/getClientByNetworkName";
import {createAccount} from "@/app/cross-chain-core/clientFactory";
import {createPaymaster} from "@/app/cross-chain-core/paymasterFactory";
import {bundlerClientFactory} from "@/app/cross-chain-core/bundlerClientFactory";
import {createAuthorization} from "@/app/cross-chain-core/autorizationFactory";
import {usdcAbi} from "@/app/cross-chain-core/usdcAbi";
import {toUSDCBigInt} from "@/app/utils/toUSDCBigInt";
import {useBridgeUsdcStream} from "@/app/dashboard/hooks/useBridgeUsdcStream";

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


export const useSendMoney = (walletNames?: Record<string, string>) => {
    const [sendLoading, setSendLoading] = useState(false);
    const [routeReady, setRouteReady] = useState(false);
    const [routeSummary, setRouteSummary] = useState<AllocationSummary | null>(null);
    const { allocateAcrossNetworks } = useFindBestRoute();
    const { unlockWallet } = useWalletStore();
    const { privateKey } = useGeneralWalletStore();
    const { setSendModal, isOpen } = useSendModalState();
    const [routeDetails, setRouteDetails] = useState<RouteDetail[]>([]);

    useEffect(() => {
        if (!routeSummary) return;

        const details = routeSummary.allocations.map((a) => ({
            wallet: a.from,
            walletName: walletNames?.[a.from.toLowerCase()] || a.from,
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
            const chainId = NETWORKS[e.payload.chain as ChainKey].chain.id.toString();

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


    const { control, handleSubmit, formState: { errors }, reset, watch } = useForm<SendForm>({
        resolver: zodResolver(sendSchema),
        defaultValues: {
            toAddress: "",
            sendAmount: "",
            sendPassword: "",
            sendChain: "Base",
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
                sendChain
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

        const account = privateKeyToAccount(privateKey!);
        console.log("Account:", account.address);

        const toValidChain = (watch("sendChain") in NETWORKS ? watch("sendChain") : "Base") as ChainKey;
        console.log("Destination chain:", toValidChain);

        const getWriter = (chainName: ChainKey) => {
            console.log("Getting client for chain:", chainName);
            return getPrivateClientByNetworkName(NETWORKS[chainName].chain.id, account);
        };

        const transfer = async (
            chainName: ChainKey,
            to: string,
            amount: bigint,
            optionalPrivateKey?: string,
        ) => {
            const token = NETWORKS[chainName].usdc;

            const client = optionalPrivateKey
                ? getPrivateClientByNetworkName(NETWORKS[chainName].chain.id, privateKeyToAccount(optionalPrivateKey as Address))
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

            console.log("Lo q mandaria", amount)

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
                        args: [to, amount - toUSDCBigInt(NETWORKS[chainName].aproxFromFee)],
                    }
                ],
                authorization: authorization,
            });

            console.log("UserOperation hash para supplier", hash);

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
            console.log("Unlocking wallet for:", allocation.from);
            const unlocked = await unlockWallet(allocation.from, watch("sendPassword"));

            console.log(watch("sendPassword"))

            if (!unlocked) {
                throw new Error(`❌ Password incorrecta para wallet ${allocation.from}`);
            }

            console.log("Wallet unlocked:", unlocked ? "✅" : "❌");
            console.log("Unlocked:", unlocked);

            for (const chain of allocation.chains) {
                console.log(chain)

                const fromValidChain = CHAIN_ID_TO_KEY[chain.chainId] ?? "Base";

                const normalizedAmount = Math.max(Number(chain.amount), 0);

                const amount = parseUnits(
                    normalizedAmount.toFixed(6),
                    6
                );
                console.log(`Processing chain ${fromValidChain} with amount ${chain.amount} (parsed: ${amount})`);

                console.log("fromValidChain", fromValidChain);
                console.log("ToValidChain", toValidChain);

                if (fromValidChain === toValidChain) {
                    console.log(fromValidChain, toValidChain)
                    console.log("🟢 Same chain, transferring directly");
                    await transfer(fromValidChain, watch("toAddress"), amount, unlocked);
                } else {
                    console.log("🔵 Different chain, bridging via API");
                    await fetch("/api/bridge-usdc", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            amount: Math.max(chain.amount, 0),
                            fromChain: fromValidChain,
                            toChain: toValidChain,
                            recipient: watch("toAddress"),
                            privateKey: unlocked,
                        }),
                    });
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

    const canSend = !!watch("toAddress") && !!watch("sendAmount") && !!watch("sendPassword");

    const resolveChain = (chainId: string | number) => {
        const id = String(chainId);

        if (id in NETWORKS) return NETWORKS[id as ChainKey];

        const found = Object.values(NETWORKS).find(
            (c) => String(c.chain.id) === id,
        );

        return found ?? { label: id.toUpperCase(), icon: null };
    };

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
        setRouteSummary
    }

}
