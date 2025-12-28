import { SendForm, sendSchema } from "@/app/lib/zod/sendSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { JSX, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AllocationSummary, Wallet } from "../../types";
import { useFindBestRoute } from "./useFindBestRoute";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useSessionWalletStore } from "@/app/store/useSessionWalletStore";
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore";
import { toast } from "react-toastify";
import { Address } from "viem";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { useBridgeUsdcStream } from "@/app/dashboard/hooks/transfer/useBridgeUsdcStream";
import { useFacilitator, FacilitatorChainKey } from "@/app/facilitator";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { transactionsApi, CreateTransactionRequest } from "@/app/services/api";
import { createPublicClient, createWalletClient, http, parseEther, formatEther, maxUint256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { create7702Account } from "@/app/smart-account/clientFactory";

import { createAuthorization } from "@/app/smart-account/authorizationFactory";
import { erc20Abi } from "@/app/savings/vaultAbi";
import axios from "axios";



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
    const wallets = useWalletStore((state) => state.wallets);
    const { xoWallet, mainWallet } = useXOWalletStore();
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
        resolver: zodResolver(sendSchema) as any,
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
                sourceToken: "USDC"
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
                watch("optimize"),
                watch("sourceToken")
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

        const executedRoutes: any[] = [];
        let totalSentAmount = 0;
        let totalFeePaid = 0;

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
                const isDev = process.env.NEXT_PUBLIC_ENVIROMENT === "development" || process.env.NODE_ENV === "development";
                const baseFee = fromValidChain === toValidChain ? 0.01 : 0.02;
                const currentFee = isDev ? 0 : baseFee;

                // Add fee to the amount to be signed/transferred
                // Because we removed the auto-add in createAuthorizationPayload
                const totalAmount = (amountFloat + currentFee).toFixed(6);

                // Sanitize Token verify it exists on chain
                let finalToken = chain.token || watch("sourceToken") || "USDC";
                const assetExists = fromNet.assets.some(a => a.name === finalToken);
                if (!assetExists && fromNet.assets.length > 0) {
                    console.log(`[Sanitizer] Invalid token ${finalToken} for ${fromValidChain}. Defaulting to ${fromNet.assets[0].name}`);
                    finalToken = fromNet.assets[0].name;
                }

                try {
                    // [NEW] Native 7702 Relayer Strategy (Gasless Execution)
                    // Use watch("sourceToken") as source of truth to avoid chain loop variables confusing source/dest
                    const sourceToken = watch("sourceToken") || "USDC";
                    const isUSDC = sourceToken.toUpperCase().includes("USDC");
                    const supportCCTP = fromNet.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP ?? false;

                    console.log("[SendMoney] SourceToken:", sourceToken, "IsUSDC:", isUSDC, "SupportCCTP:", supportCCTP);

                    // We generate 7702 Authorization IF:
                    // 1. It is NOT USDC (e.g. USDT)
                    // OR
                    // 2. It IS USDC but the chain DOES NOT support CCTP (so we treat it like a generic token)
                    const useCCTP = isUSDC && supportCCTP;

                    if (!useCCTP) {
                        const supports7702 = fromNet.evm?.supports7702;

                        if (supports7702) {
                            console.log("[SendMoney] Triggering 7702 Flow (Not CCTP, Supported)");

                            setRouteDetails(prev => prev.map(w => w.wallet === allocation.from ? {
                                ...w, chains: w.chains.map(c => c.id.toString() === chain.chainId.toString() ? { ...c, message: "Firmando Autorización..." } : c)
                            } : w));

                            const publicClient = createPublicClient({
                                chain: fromNet.evm.chain,
                                transport: http()
                            });

                            // 1. Create & Sign Authorization
                            const { account: smartAccount, owner } = await create7702Account(publicClient, unlockedKey as `0x${string}`);
                            const authorization = await createAuthorization(owner, publicClient, smartAccount);

                            const serializedAuthorization = {
                                ...authorization,
                                chainId: authorization.chainId.toString(),
                                nonce: authorization.nonce.toString(),
                            };

                            setRouteDetails(prev => prev.map(w => w.wallet === allocation.from ? {
                                ...w, chains: w.chains.map(c => c.id.toString() === chain.chainId.toString() ? { ...c, message: "Procesando Envío (Gasless)..." } : c)
                            } : w));

                            const response = await axios.post("/api/bridge/settle", {
                                sourceChain: fromValidChain,
                                destChain: toValidChain,
                                sourceToken: finalToken,
                                destToken: watch("sourceToken"),
                                amount: totalAmount,
                                recipient: recipient,
                                senderAddress: allocation.from,
                                paymentPayload: {
                                    authorization: serializedAuthorization,
                                    type: "7702"
                                }
                            });

                            if (!response.data.success) {
                                throw new Error(response.data.errorReason || "Transfer failed");
                            }

                            const txHash = response.data.transactionHash;
                            console.log("Gasless Transfer Success:", txHash);

                            // Success Handling (duplicated from below for now to ensure flow continuity)
                            executedRoutes.push({
                                chainName: fromValidChain,
                                amount: amountFloat,
                                assetOrigin: finalToken,
                                status: "SUCCESS",
                                txHash: txHash
                            });
                            totalSentAmount += Number(totalAmount);
                            totalFeePaid += currentFee;

                            // Update UI to Done
                            setRouteDetails(prev => prev.map(w => w.wallet === allocation.from ? {
                                ...w, chains: w.chains.map(c => c.id.toString() === chain.chainId.toString() ? { ...c, status: "done", message: "Completado" } : c)
                            } : w));

                            transferBalance(
                                allocation.from as Address,
                                recipient as Address,
                                fromNet.evm.chain.id.toString(),
                                toNet.evm.chain.id.toString(),
                                amountFloat
                            );

                            continue;

                        } else {
                            // [NEW] Refuel / Standard Flow (Non-7702 Chains like Avalanche)
                            console.log("[SendMoney] Chain does not support 7702. Using Refuel/Standard Flow.");

                            setRouteDetails(prev => prev.map(w => w.wallet === allocation.from ? {
                                ...w, chains: w.chains.map(c => c.id.toString() === chain.chainId.toString() ? { ...c, message: "Verificando Gas..." } : c)
                            } : w));

                            const publicClient = createPublicClient({
                                chain: fromNet.evm.chain,
                                transport: http()
                            });

                            const walletClient = createWalletClient({
                                account: privateKeyToAccount(unlockedKey as `0x${string}`),
                                chain: fromNet.evm.chain,
                                transport: http()
                            });

                            const account = privateKeyToAccount(unlockedKey as `0x${string}`);

                            // 1. Check Native Balance
                            const nativeBalance = await publicClient.getBalance({ address: account.address });

                            // Estimate Gas for Transfer
                            const tokenInfo = fromNet.assets.find(a => a.name === finalToken);
                            if (!tokenInfo) throw new Error("Token info not found");

                            const amountBigInt = BigInt(Math.floor(parseFloat(totalAmount) * 10 ** tokenInfo.decimals));

                            // Hardcoded Facilitator Addr
                            const FACILITATOR_ADDR = "0xa08979ba1aac1c19dc659817c295c77018533a97";

                            const gasEstimate = await publicClient.estimateContractGas({
                                address: tokenInfo.address as Address,
                                abi: erc20Abi,
                                functionName: 'transfer',
                                args: [FACILITATOR_ADDR as Address, amountBigInt],
                                account
                            });

                            const gasPrice = await publicClient.getGasPrice();
                            const estimatedGasCost = gasEstimate * gasPrice;

                            console.log(`[Refuel] Estimate: ${gasEstimate}, Cost: ${formatEther(estimatedGasCost)} ${fromNet.chipLabel}`);

                            if (nativeBalance < estimatedGasCost) {
                                console.log("[Refuel] Insufficient Gas. Requesting Refuel...");
                                setRouteDetails(prev => prev.map(w => w.wallet === allocation.from ? {
                                    ...w, chains: w.chains.map(c => c.id.toString() === chain.chainId.toString() ? { ...c, message: "Solicitando Gasolina..." } : c)
                                } : w));

                                const refuelRes = await axios.post("/api/refuel", {
                                    chain: fromValidChain,
                                    address: account.address,
                                    estimatedGasCost: formatEther(estimatedGasCost)
                                });

                                if (!refuelRes.data.success) {
                                    throw new Error("Refuel Failed: " + refuelRes.data.error);
                                }
                                console.log("[Refuel] Success. Waiting for funds...");
                                // Wait a bit for funds to index? Usually fast.
                                await new Promise(r => setTimeout(r, 2000));
                            } else {
                                console.log("[Refuel] Sufficient Gas. Skipping Refuel.");
                            }

                            setRouteDetails(prev => prev.map(w => w.wallet === allocation.from ? {
                                ...w, chains: w.chains.map(c => c.id.toString() === chain.chainId.toString() ? { ...c, message: "Enviando Tx Estándar..." } : c)
                            } : w));

                            // 2. Send Tx
                            const txHash = await walletClient.writeContract({
                                address: tokenInfo.address as Address,
                                abi: erc20Abi,
                                functionName: 'transfer',
                                args: [FACILITATOR_ADDR as Address, amountBigInt],
                                chain: fromNet.evm.chain,
                                account
                            });
                            console.log("[Refuel] Tx Sent:", txHash);

                            setRouteDetails(prev => prev.map(w => w.wallet === allocation.from ? {
                                ...w, chains: w.chains.map(c => c.id.toString() === chain.chainId.toString() ? { ...c, message: "Procesando Puente..." } : c)
                            } : w));

                            // 3. Call Bridge Settle
                            const response = await axios.post("/api/bridge/settle", {
                                sourceChain: fromValidChain,
                                destChain: toValidChain,
                                sourceToken: finalToken,
                                destToken: watch("sourceToken"),
                                amount: totalAmount,
                                recipient: recipient,
                                senderAddress: allocation.from,
                                paymentPayload: {
                                    type: "STANDARD",
                                    txHash: txHash
                                }
                            });

                            if (!response.data.success) {
                                throw new Error(response.data.errorReason || "Transfer failed");
                            }

                            // Success Logic (Unified)
                            executedRoutes.push({
                                chainName: fromValidChain,
                                amount: amountFloat,
                                assetOrigin: finalToken,
                                status: "SUCCESS",
                                txHash: txHash
                            });
                            totalSentAmount += Number(totalAmount);
                            totalFeePaid += currentFee;

                            setRouteDetails(prev => prev.map(w => w.wallet === allocation.from ? {
                                ...w, chains: w.chains.map(c => c.id.toString() === chain.chainId.toString() ? { ...c, status: "done", message: "Completado" } : c)
                            } : w));

                            transferBalance(
                                allocation.from as Address,
                                recipient as Address,
                                fromNet.evm.chain.id.toString(),
                                toNet.evm.chain.id.toString(),
                                amountFloat
                            );

                            continue;
                        }
                    }
                    // End [NEW]


                    // EXECUTE UNIFIED TRANSFER
                    // This handles Same-Chain (Gasless) AND Cross-Chain (CCTP) automatically via Smart Router

                    const result = await executeTransfer({
                        amount: totalAmount, // Send total (Amount + Fee)
                        sourceChain: fromValidChain as FacilitatorChainKey,
                        destinationChain: toValidChain as FacilitatorChainKey,
                        recipient: recipient,
                        sourceToken: finalToken,
                        destToken: watch("sourceToken"), // Pass explicit intent
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

                        // Track success for DB
                        executedRoutes.push({
                            chainName: fromValidChain,
                            amount: amountFloat,
                            assetOrigin: finalToken,
                            status: "SUCCESS",
                            txHash: result.transactionHash
                        });
                        totalSentAmount += Number(totalAmount); // Track total SIGNED amount (Principal + Fee)
                        totalFeePaid += currentFee;

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

        if (executedRoutes.length > 0) {
            toast.success("Transacciones completadas");

            // Save Transaction to DB
            try {
                const txData = {
                    id: crypto.randomUUID(),
                    // Priority: XO Wallet -> XO Main Wallet -> Session fallback
                    fromAddress: xoWallet?.address?.toLowerCase() || mainWallet?.address?.toLowerCase() || generalWallet?.toLowerCase(),
                    toAddress: recipient.toLowerCase(),
                    destinationChain: toValidChain,
                    totalAmount: totalSentAmount,
                    status: "PENDING",
                    tokenSymbol: watch("sourceToken") || "USDC",
                    decimals: 6,
                    createdAt: Date.now(),
                    route: executedRoutes,
                    fee: totalFeePaid // [NEW] Save total fee paid
                };

                await transactionsApi.create(txData as unknown as CreateTransactionRequest);
                console.log("Transaction saved to DB");
                console.log("Transaction saved to DB");
            } catch (dbError) {
                console.error("Failed to save transaction to DB:", dbError);
            }
        } else {
            toast.error("No se completó ninguna transacción");
        }

        // Brief delay to show success state before closing
        setTimeout(() => {
            setSendModal(false);
            reset();
            setRouteReady(false);
            setRouteSummary(null);
            setRouteDetails([]);
        }, 2000);
    };



    const getOriginFee = (id: string) => {
        const key = CHAIN_ID_TO_KEY[id] as ChainKey;
        if (!key) return 0.003;
        return NETWORKS[key]?.crossChainInformation?.circleInformation?.aproxFromFee || 0.003;
    };

    const maxSendAmount = wallets.reduce((total, wallet) => {
        const walletTotal = wallet.chains.reduce((sum, chain) => {
            const amount = Number(chain.amount);
            // Dynamic Fee Calculation
            const sourceChainKey = CHAIN_ID_TO_KEY[chain.chainId];
            const destChainKey = watch("sendChain");

            // Default to cross-chain fee (0.02) if unknown, effectively 0.01 if same chain
            // User requested: "cobro o 0.01 o 0.02"
            // If source == dest -> 0.01
            // If source != dest -> 0.02
            const isSameChain = sourceChainKey === destChainKey;
            const dynamicMaxFee = isSameChain ? 0.01 : 0.02;

            // We subtract the max possible fee for this specific route consideration
            // available = Balance - Fee
            const available = amount - dynamicMaxFee;

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
        watch,
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
        isExceedingMax,
        wallets
    }

}
