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
import { Address, parseUnits } from "viem";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { useBridgeUsdcStream } from "@/app/dashboard/hooks/transfer/useBridgeUsdcStream";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { transactionsApi, CreateTransactionRequest } from "@/app/services/api";
import { useTokenPrice } from "@/app/hooks/useTokenPrice";
import { pricesApi } from "@/app/services/api/prices";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import {
    TransferManager,
    AccountAbstraction
} from "@1llet.xyz/erc4337-gasless-sdk";
import { getSmartAccountForChain, ensureTokenApproval } from "../useSmartAccount";

// Define BridgeContext based on SDK usage
interface BridgeContext {
    paymentPayload?: any;
    sourceChain: ChainKey;
    destChain: ChainKey;
    sourceToken?: string;
    destToken?: string;
    amount: string;
    recipient: string;
    senderAddress?: string;
    facilitatorPrivateKey?: string;
    feeRecipient?: string;
    depositTxHash?: string;
}

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
        id: string; // Unique UI ID
        chainId: string; // Network Chain ID
        label: string;
        icon: JSX.Element | null;
        amount: number;
        status: RouteStatus;
        message: string;
    }[];
};


export const useSendMoneyModal = () => {
    // [NEW] Consistent Dev Check
    const isDev = process.env.NEXT_PUBLIC_ENVIROMENT === "development" || process.env.NODE_ENV === "development";

    const [sendLoading, setSendLoading] = useState(false);
    const [routeReady, setRouteReady] = useState(false);
    const [routeSummary, setRouteSummary] = useState<AllocationSummary | null>(null);
    const { allocateAcrossNetworks } = useFindBestRoute();
    const { unlockWallet, transferBalance } = useWalletStore();
    const generalWallet = useSessionWalletStore(state => state.address);
    const wallets = useWalletStore((state) => state.wallets);
    const { xoWallet, mainWallet, setSmartAccount } = useXOWalletStore();
    const { setSendModal, isOpen, initialChain, initialToken } = useSendMoneyStore();
    const [routeDetails, setRouteDetails] = useState<RouteDetail[]>([]);

    // Password store for main wallet decryption
    const currentPassword = useWalletPasswordStore((s) => s.currentPassword);

    // SDK Transfer Manager
    const [transferManager] = useState(() => new TransferManager());

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
                // [FIX] Inject ID back into routeSummary to sync logic with UI
                const uniqueId = Math.random().toString(36).substring(7);
                (c as any).id = uniqueId;

                return {
                    id: uniqueId,
                    chainId: c.chainId,
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

    // [NEW] Price Map State for passing to Route
    const [priceMap, setPriceMap] = useState<Record<string, number>>({});

    // Track Socket Steps
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

    // [NEW] Price Logic
    const { price: tokenPrice } = useTokenPrice(
        watch("sourceToken") !== "USDC"
            ? (NETWORKS[watch("sendChain") as ChainKey]?.assets.find(a => a.name === watch("sourceToken"))?.coingeckoId || "usd-coin")
            : undefined
    );
    const effectivePrice = watch("sourceToken") !== "USDC" ? (tokenPrice || 0) : 1;


    useEffect(() => {
        if (!isOpen) {
            setSendLoading(false);
            setRouteReady(false);
            setRouteSummary(null);
            setRouteDetails([]);

            // Default reset on close
            reset({
                toAddress: "",
                sendAmount: "",
                sendPassword: "",
                sendChain: "Base",
                sourceToken: "USDC"
            });
        } else {
            // [NEW] Apply Prefill Data from Store if available
            if (initialChain || initialToken) {
                // Determine Source Token logic
                // If initialToken is provided, use it. Otherwise default to USDC.
                const prefilledToken = initialToken || "USDC";
                const prefilledChain = initialChain || "Base";

                reset({
                    toAddress: "",
                    sendAmount: "",
                    sendPassword: "",
                    sendChain: prefilledChain as any,
                    sourceToken: prefilledToken
                });
            }
        }
    }, [isOpen, reset, initialChain, initialToken]);

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

            // [NEW] Multi-Token Price Fetching
            // 1. Identify all tokens with balance > 0
            const allAssetIds = new Set<string>();
            wallets.forEach(w => {
                w.chains.forEach(c => {
                    const cKey = CHAIN_ID_TO_KEY[c.chainId];
                    const net = NETWORKS[cKey as ChainKey];
                    if (net && net.evm) {
                        net.assets.forEach(a => {
                            if (c.tokens?.[a.name] > 0 && a.coingeckoId) {
                                allAssetIds.add(a.coingeckoId);
                            }
                        });
                    }
                });
            });
            allAssetIds.add("usd-coin"); // Ensure USDC base

            // 2. Fetch Prices
            const prices = await pricesApi.getPrices(Array.from(allAssetIds));
            const priceMap: Record<string, number> = {};
            Object.entries(prices).forEach(([id, p]: [string, any]) => {
                if (p && typeof p.usd === 'number') priceMap[id] = p.usd;
            });
            // Manual overrides for stablecoins if API fails/missing
            priceMap["usd-coin"] = priceMap["usd-coin"] || 1;

            setPriceMap(priceMap); // [NEW] Save to State

            const summary = await allocateAcrossNetworks(
                Number(sendAmount),
                toAddress as Address,
                sendChain,
                watch("optimize"),
                watch("sourceToken"),
                priceMap // [NEW] Pass Full Price Map
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
        console.log("🔹 Starting handleOnConfirm (SDK with AA Deploy/Approve)");

        const toValidChain = (watch("sendChain") in NETWORKS ? watch("sendChain") : "Base") as ChainKey;
        const recipient = watch("toAddress");

        console.log("Destination:", toValidChain, recipient);

        const executedRoutes: any[] = [];
        let totalSentAmount = 0;
        let totalFeePaid = 0;

        // Loop Allocations
        for (const [walletIdx, allocation] of routeSummary!.allocations.entries()) {

            // 1. Unlock Wallet (Get Private Key)
            const unlockedKey = await unlockWallet(allocation.from, watch("sendPassword") || "");

            if (!unlockedKey) {
                toast.error(`No se pudo desbloquear la wallet ${allocation.from}`);
                return;
            }

            // Loop through chains in this allocation
            for (const [i, chain] of allocation.chains.entries()) {
                const amountFloat = Number(chain.amount);
                const fromValidChain = CHAIN_ID_TO_KEY[chain.chainId] as ChainKey;
                const fromNet = NETWORKS[fromValidChain];
                const toNet = NETWORKS[toValidChain];

                const uniqueId = routeDetails[walletIdx]?.chains[i]?.id;

                if (!uniqueId) {
                    console.error("Critical: RouteDetail mismatch for index", walletIdx, i);
                    continue;
                }

                if (!fromNet || !fromNet.evm || !toNet || !toNet.evm) {
                    toast.error("Invalid chain for EVM transfer");
                    continue;
                }

                const baseFee = fromValidChain === toValidChain ? 0.01 : 0.02;
                const currentFee = isDev ? 0 : baseFee;
                const totalAmount = (amountFloat + currentFee).toFixed(6);

                let finalToken = chain.token || watch("sourceToken") || "USDC";
                const assetExists = fromNet.assets.some(a => a.name === finalToken);
                if (!assetExists && fromNet.assets.length > 0) {
                    finalToken = fromNet.assets[0].name;
                }

                const currentStatus = routeDetails
                    .find(w => w.wallet.toLowerCase() === allocation.from.toLowerCase())
                    ?.chains.find(c => c.id === uniqueId)?.status;

                if (currentStatus === "done" || currentStatus === "minting" || currentStatus === "waiting") {
                    continue;
                }

                // Helper to update route status
                const updateRouteStatus = (status: RouteStatus, message: string) => {
                    setRouteDetails(prev =>
                        prev.map(wallet =>
                            wallet.wallet.toLowerCase() === allocation.from.toLowerCase()
                                ? {
                                    ...wallet,
                                    chains: wallet.chains.map(c =>
                                        c.id === uniqueId
                                            ? { ...c, status, message }
                                            : c
                                    )
                                }
                                : wallet
                        )
                    );
                };

                updateRouteStatus("starting", "Conectando Smart Account...");

                try {
                    // Initialize SDK Account for THIS chain using helper
                    const saResult = await getSmartAccountForChain(fromValidChain, unlockedKey as `0x${string}`);

                    if (!saResult) {
                        throw new Error("Failed to initialize Smart Account");
                    }

                    const { account, smartAccountAddress, isDeployed } = saResult;

                    // Store SA address in state
                    setSmartAccount(fromNet.evm.chain.id.toString(), smartAccountAddress, isDeployed);

                    // Deploy if needed
                    if (!isDeployed) {
                        updateRouteStatus("starting", "Desplegando Smart Account...");
                        console.log("[handleOnConfirm] Deploying Smart Account for", fromValidChain);

                        try {
                            const deployReceipt = await account.deployAccount();
                            if (!deployReceipt.success) {
                                throw new Error("Deploy failed");
                            }
                            console.log("[handleOnConfirm] Deploy successful:", deployReceipt.receipt.transactionHash);
                            setSmartAccount(fromNet.evm.chain.id.toString(), smartAccountAddress, true);
                        } catch (deployError: any) {
                            throw new Error(`Deploy failed: ${deployError.message}`);
                        }
                    }

                    // Get token address for approval
                    const tokenAsset = fromNet.assets.find(a => a.name === finalToken);
                    const tokenAddress = tokenAsset?.address as Address;

                    if (tokenAddress && tokenAddress !== "0x0000000000000000000000000000000000000000") {
                        updateRouteStatus("approving", "Verificando aprobación de token...");

                        // Calculate amount in token units
                        const tokenDecimals = tokenAsset?.decimals || 6;
                        const amountBigInt = parseUnits(totalAmount, tokenDecimals);

                        // Get spender address (TokenMessenger for CCTP or recipient for direct)
                        // For now, we'll check the allowance for potential spenders
                        const currentAllowance = await account.getAllowance(tokenAddress);

                        if (currentAllowance < amountBigInt) {
                            updateRouteStatus("approving", "Aprobando token...");
                            console.log("[handleOnConfirm] Approving token", finalToken, "amount:", amountBigInt.toString());

                            try {
                                const approveResult = await account.approveToken(
                                    tokenAddress,
                                    fromNet.evm.paymasterAddress as Address || tokenAddress, // Approve for paymaster or token contract
                                    amountBigInt * BigInt(2) // Approve 2x to avoid future approvals
                                );
                                console.log("[handleOnConfirm] Approval result:", approveResult);
                            } catch (approveError: any) {
                                console.warn("[handleOnConfirm] Approval warning:", approveError.message);
                                // Continue anyway - some tokens might not need approval
                            }
                        } else {
                            console.log("[handleOnConfirm] Sufficient allowance exists:", currentAllowance.toString());
                        }
                    }

                    updateRouteStatus("burning", "Ejecutando transferencia...");

                    // EXECUTE TRANSFER via SDK
                    const context: BridgeContext = {
                        amount: totalAmount,
                        sourceChain: fromValidChain,
                        destChain: toValidChain,
                        recipient: recipient,
                        sourceToken: finalToken,
                        destToken: watch("sourceToken"),
                        senderAddress: smartAccountAddress,
                    };

                    const result = await transferManager.execute(context);

                    if (result.success) {
                        updateRouteStatus("done", "Completado");

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
                        totalSentAmount += Number(totalAmount);
                        totalFeePaid += currentFee;

                    } else {
                        throw new Error(result.errorReason || "Transfer Failed (SDK)");
                    }

                } catch (e: any) {
                    console.error("[UseSendMoneyModal] Critical Error:", e);
                    const errorMessage = e.message || "Error Desconocido";

                    updateRouteStatus("error", errorMessage);
                    toast.error(`Error en ${fromValidChain}: ${errorMessage}. Corrige el error y vuelve a intentar.`);
                    return;
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
                };

                await transactionsApi.create(txData as unknown as CreateTransactionRequest);
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


    // [UPDATED] Max Balance = Total Portfolio Value in USD (as per user request)
    const maxSendAmount = wallets.reduce((total, wallet) => {
        const walletTotal = wallet.chains.reduce((sum, c) => {
            return sum + (c.amount || 0);
        }, 0);
        return total + walletTotal;
    }, 0);

    // Format to 6 decimals for USD display
    const formattedMaxSendAmount = maxSendAmount > 0 ? parseFloat(maxSendAmount.toFixed(6)) : 0;

    const currentSendAmount = Number(watch("sendAmount") || 0);
    const isExceedingMax = currentSendAmount > formattedMaxSendAmount;

    const canSend = !!watch("toAddress") && !!watch("sendAmount") && !isExceedingMax;

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
        wallets,
        priceMap
    }

}
