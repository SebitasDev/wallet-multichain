import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Address } from "abitype";

import { useXOContracts } from "@/app/dashboard/hooks/wallet/useXOConnect";
import { useFacilitator, FacilitatorChainKey } from "@/app/facilitator";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { useHybridBridgeStrategy } from "./useHybridBridgeStrategy";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { STELLAR } from "@/app/constants/chais/NoEvm/Stellar";
import { useTokenPrice } from "@/app/hooks/useTokenPrice";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { bridgeApi, transactionsApi, CreateTransactionRequest } from "@/app/services/api";
import { useRouteValidation } from "./useRouteValidation";
import { useMaxTransferAmount } from "./useMaxTransferAmount";
import { useTransferFee } from "./useTransferFee";
// Types
export const STELLAR_CHAIN_KEY = "Stellar";

export type FormValues = {
    sourceChain: FacilitatorChainKey;
    destChain: FacilitatorChainKey | typeof STELLAR_CHAIN_KEY;
    recipient: string;
    amount: string;
    sourceToken: string;
    destToken: string;
};

// Helper to serialize BigInts for JSON
const serializeBigInt = (obj: any): any => {
    if (typeof obj === "bigint") {
        return obj.toString();
    }
    if (Array.isArray(obj)) {
        return obj.map(serializeBigInt);
    }
    if (typeof obj === "object" && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, serializeBigInt(v)])
        );
    }
    return obj;
};


// [DELETED LOCAL HOOKS: useRouteValidation, useMaxTransferAmount]

export const useCrossChainTransfer = () => {
    const { crossChainOpen: open, openCrossChain: setOpen, closeCrossChain: closeModal } = useDashboardModalsStore();
    const [privateKey, setPrivateKey] = useState<`0x${string}` | null>(null);
    const [stellarPrivateKey, setStellarPrivateKey] = useState<string | null>(null);
    const [provider, setProvider] = useState<any>(null);

    const { address, isUsingXO } = useXOContracts();
    const encryptedPrivateKey = useXOWalletStore(s => s.mainWallet.encryptedPrivateKey);
    const encryptedPrivateKeyStellar = useXOWalletStore(s => s.mainWallet.encryptedPrivateKeyStellar);
    const salt = useXOWalletStore(s => s.mainWallet.salt);
    const iv = useXOWalletStore(s => s.mainWallet.iv);
    const addressStellarStored = useXOWalletStore(s => s.mainWallet.addressStellar);
    const addressStored = useXOWalletStore(s => s.mainWallet.address);
    const chains = useXOWalletStore(s => s.mainWallet.chains); // [NEW] Get cached chains

    const currentPassword = useWalletPasswordStore((s) => s.currentPassword);

    // Setup Provider / Keys
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
                    console.log(">>> Provider XO configurado");
                } catch (e) {
                    console.error("Error setting up XO provider:", e);
                }
            } else if (encryptedPrivateKey && currentPassword) {
                try {
                    const pk = await decryptPrivateKey(
                        encryptedPrivateKey,
                        currentPassword,
                        salt!,
                        iv!
                    );
                    setPrivateKey(pk as `0x${string}`);

                    if (encryptedPrivateKeyStellar) {
                        const pkStellar = await decryptPrivateKey(
                            encryptedPrivateKeyStellar,
                            currentPassword,
                            salt!,
                            iv!
                        );
                        setStellarPrivateKey(pkStellar);
                    }
                } catch (e) {
                    console.error("Error decrypting private key:", e);
                }
            }
        };
        setup();
    }, [isUsingXO, encryptedPrivateKey, encryptedPrivateKeyStellar, salt, iv, currentPassword]);

    const { executeHybridTransfer, isLoading: isHybridLoading } = useHybridBridgeStrategy();

    const {
        executeTransfer,
        getFee,
        isLoading: isFacilitatorLoading,
        error,
    } = useFacilitator({
        provider: provider || undefined,
        privateKey: !provider ? privateKey || undefined : undefined,
        stellarPrivateKey: stellarPrivateKey || undefined,
        userAddress: address as Address,
    });

    const form = useForm<FormValues>({
        defaultValues: {
            sourceChain: "Base",
            destChain: "Polygon",
            recipient: "",
            amount: "",
            sourceToken: "USDC",
            destToken: "USDC",
        },
    });

    const { watch, reset, handleSubmit, setValue } = form;
    const watchAmount = watch("amount");
    const watchSourceChain = watch("sourceChain");
    const watchDestChain = watch("destChain");
    const watchSourceToken = watch("sourceToken");
    const watchDestToken = watch("destToken");

    // Reset tokens on chain change
    useEffect(() => { setValue("sourceToken", "USDC"); }, [watchSourceChain, setValue]);
    useEffect(() => { setValue("destToken", "USDC"); }, [watchDestChain, setValue]);

    const isCrossChain = watchSourceChain !== watchDestChain || watchSourceToken !== watchDestToken;

    // -- Helper: Get Chain Config Safely --
    const getChainConfig = (key: string) => {
        if (key === STELLAR_CHAIN_KEY) return STELLAR;
        return NETWORKS[key as keyof typeof NETWORKS];
    };

    // Price Fetching Logic
    const currentCoinGeckoId = useMemo(() => {
        const config = getChainConfig(watchSourceChain);
        if (!config) return undefined;
        // Find asset in config
        const asset = config.assets.find(a => a.name === watchSourceToken);
        return asset?.coingeckoId;
    }, [watchSourceChain, watchSourceToken]);

    const { price: tokenPrice, loading: tokenPriceLoading } = useTokenPrice(currentCoinGeckoId);

    // [NEW] Destination Token Price Logic
    const currentDestCoinGeckoId = useMemo(() => {
        const config = getChainConfig(watchDestChain);
        if (!config) return undefined;
        // Find asset in config
        const asset = config.assets.find(a => a.name === watchDestToken);
        return asset?.coingeckoId;
    }, [watchDestChain, watchDestToken]);

    const { price: destTokenPrice, loading: destTokenPriceLoading } = useTokenPrice(currentDestCoinGeckoId);

    // Derived State using Imported Hooks
    const { maxAmount, balance } = useMaxTransferAmount(
        address,
        watchSourceChain,
        watchDestChain,
        watchSourceToken,
        watchDestToken,
        stellarPrivateKey,
        chains
    );

    const routeError = useRouteValidation(watchSourceChain, watchDestChain, watchSourceToken, watchDestToken);

    const minAmount = useMemo(() => {
        return 0.000001;
    }, []);

    const isAmountValid = useMemo(() => {
        const strAmount = watchAmount ? String(watchAmount) : "";
        if (!strAmount || strAmount.trim() === "") return true;
        const amount = parseFloat(strAmount);
        return !isNaN(amount) && amount >= minAmount;
    }, [watchAmount, minAmount]);

    const isExceedingMax = useMemo(() => {
        const strAmount = watchAmount ? String(watchAmount) : "";
        if (!strAmount || strAmount.trim() === "") return false;
        const amount = parseFloat(strAmount);
        return !isNaN(amount) && amount > maxAmount;
    }, [watchAmount, maxAmount]);

    // Use New Fee Hook
    const { fee, total } = useTransferFee(
        watchAmount,
        watchSourceChain,
        watchDestChain,
        watchSourceToken,
        watchDestToken,
        tokenPrice || undefined
    );

    const openModal = () => setOpen();
    const handleCloseModal = () => {
        reset();
        closeModal();
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

        if (routeError) {
            toast.error(routeError);
            return;
        }

        const amount = parseFloat(data.amount);

        if (isNaN(amount) || amount < minAmount) {
            toast.error(`El monto mínimo es ${minAmount} USDC`);
            return;
        }

        if (amount > maxAmount) {
            toast.error(`El monto excede tu balance disponible (${maxAmount} USDC)`);
            return;
        }

        toast.info("Firmando autorización...");

        const currentFee = parseFloat(fee);
        // Ensure precision avoids rounding errors (e.g. 0.190095 + 0.02 = 0.21009500000000003)
        // We use toFixed(6) which truncates/rounds to 6 decimals.
        // If maxAmount was generated with .toFixed(6), then (max + fee).toFixed(6) should be mathematically <= balance.
        // However, if balance has more than 6 decimals (USDC is 6, so unlikely), we might have issues.
        // But for safe side, we assume standard behavior.
        const finalAmount = (amount + currentFee).toFixed(6);

        console.log(`Preparing transfer: Amount=${amount} + Fee=${currentFee} = Total=${finalAmount}`);

        // [NEW] Check for Direct Native Transfer (Same Chain + Same Token + Not USDC)
        const isSameChain = data.sourceChain === data.destChain;
        const isSameToken = data.sourceToken === data.destToken;
        const isUSDCSource = data.sourceToken.toUpperCase().includes("USDC");

        if (isSameChain && isSameToken && !isUSDCSource) {
            // --- DIRECT NATIVE TRANSFER ---
            console.log("[SendMoney] Executing Direct Native Transfer");
            try {
                const networkConfig = NETWORKS[data.sourceChain];
                if (!networkConfig || !networkConfig.evm) throw new Error("Invalid chain config");

                const tokenInfo = networkConfig.assets.find(a => a.name === data.sourceToken);
                if (!tokenInfo) throw new Error("Token info not found");

                // Double check it is indeed native (0x0 address)
                if (tokenInfo.address !== "0x0000000000000000000000000000000000000000") {
                    // If it's a standard ERC20 on same chain, we could also do direct transfer here, 
                    // but sticking to "Native" requirement for now. 
                    // (Actually, if it's same chain ERC20, we should probably just do direct ERC20 transfer too, but user asked specifically about Native Fee bypass)
                    console.log("Not 0x0 address, falling back to standard flow (though likely should be direct too)");
                } else {
                    // Proceed with Native Transfer
                    const amountBigInt = BigInt(Math.floor(parseFloat(data.amount) * 10 ** 18)); // Native is always 18? check decimals

                    let txHash;

                    if (isUsingXO && provider) {
                        // Use XO Provider
                        txHash = await provider.request({
                            method: "eth_sendTransaction",
                            params: [{
                                from: address,
                                to: data.recipient as Address,
                                value: "0x" + amountBigInt.toString(16),
                                data: "0x"
                            }]
                        });
                    } else if (address && privateKey) {
                        // Use Local Viem Client
                        const { createWalletClient, http } = await import("viem");
                        const { privateKeyToAccount } = await import("viem/accounts");

                        const account = privateKeyToAccount(privateKey as `0x${string}`);
                        const walletClient = createWalletClient({
                            account,
                            chain: networkConfig.evm.chain,
                            transport: http()
                        });

                        txHash = await walletClient.sendTransaction({
                            to: data.recipient as Address,
                            value: amountBigInt,
                            account,
                            chain: networkConfig.evm.chain
                        });
                    } else {
                        throw new Error("No provider or private key available");
                    }

                    toast.success(`Transferencia Directa Exitosa! TX: ${txHash?.slice(0, 10)}...`);
                    handleCloseModal();
                    return;
                }

            } catch (e: any) {
                console.error("Direct transfer failed", e);
                toast.error("Error en transferencia directa: " + e.message);
                return;
            }
        }

        // [NEW] Native 7702 Relayer Strategy (Gasless Execution)
        // Check if we should use 7702 Relayer instead of Standard/CCTP
        const sourceToken = data.sourceToken || "USDC";
        const isUSDC = sourceToken.toUpperCase().includes("USDC");
        const networkConfig = NETWORKS[data.sourceChain];
        const supportCCTP = networkConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP ?? false;

        console.log("[SendMoney Cross] SourceToken:", sourceToken, "IsUSDC:", isUSDC, "SupportCCTP:", supportCCTP);
        // Trigger 7702 IF: (Not USDC) OR (Is USDC but No CCTP Support)
        const useCCTP = isUSDC && supportCCTP;

        if (!useCCTP && privateKey) {
            const supports7702 = networkConfig.evm?.supports7702;

            // Only attempt hybrid strategy if 7702 is supported OR we want to attempt refuel flow on EVM
            // But logic here seems to prioritize this path if !useCCTP.

            if (networkConfig.evm) {
                const result = await executeHybridTransfer({
                    sourceChain: data.sourceChain,
                    destChain: data.destChain,
                    sourceToken: sourceToken,
                    destToken: data.destToken,
                    amount: finalAmount,
                    recipient: data.recipient,
                    sender: address,
                    privateKey: privateKey,
                    onStatusUpdate: (msg) => toast.info(msg)
                });

                if (!result.success) {
                    console.error("Hybrid Transfer Failed:", result.error);
                    toast.error("Error en la transferencia: " + result.error);
                    return;
                }

                toast.success(`Transfer exitoso! TX: ${result.txHash?.slice(0, 10)}...`);

                // Reset and close modal immediately to prevent user staring at "Sending..."
                handleCloseModal();

                // Save to DB (Duplicated logic from below, encapsulated here for this branch)
                try {
                    const txData = {
                        id: crypto.randomUUID(),
                        fromAddress: address.toLowerCase(),
                        totalAmount: amount,
                        status: "PENDING",
                        tokenSymbol: data.destToken,
                        decimals: 6,
                        toAddress: data.recipient.trim().toLowerCase(),
                        destinationChain: data.destChain,
                        createdAt: Date.now(),
                        route: [
                            {
                                chainName: data.sourceChain,
                                amount: amount,
                                assetOrigin: data.sourceToken,
                                status: "PENDING",
                                txHash: result.txHash
                            }
                        ],
                        estimatedReceived: simulationRef.current && simulationRef.current.estimated ? parseFloat(simulationRef.current.estimated) : amount
                    };
                    await transactionsApi.create(txData as unknown as CreateTransactionRequest);
                } catch (dbError) {
                    console.error("Failed to save transaction to DB:", dbError);
                }

                handleCloseModal(); // Reset and close
                return; // Exit function after successful hybrid transfer
            }
        }



        try {
            const result = await executeTransfer({
                amount: finalAmount,
                sourceChain: data.sourceChain,
                destinationChain: data.destChain as FacilitatorChainKey,
                recipient: data.recipient,
                destToken: data.destToken,
                sourceToken: data.sourceToken,
                facilitatorFee: fee,
                sender: (data.sourceChain === "Stellar" ? addressStellarStored : addressStored) || undefined
            });

            if (result.success) {
                toast.success(`Transfer exitoso! TX: ${result.transactionHash?.slice(0, 10)}...`);

                // Save to DB
                try {
                    const usdValue = tokenPrice && !isNaN(amount) ? amount * tokenPrice : 0;
                    const estimatedRec = simulationRef.current.estimated ? parseFloat(simulationRef.current.estimated) : amount;
                    const receivedUsdValue = destTokenPrice && !isNaN(estimatedRec) ? estimatedRec * destTokenPrice : 0;

                    const txData = {
                        id: crypto.randomUUID(),
                        fromAddress: address.toLowerCase(), // Normalize to lowercase for index efficiency
                        totalAmount: amount,
                        usdValue: parseFloat(usdValue.toFixed(6)), // [NEW] Persist USD Value
                        receivedUsdValue: parseFloat(receivedUsdValue.toFixed(6)), // [NEW] Persist Received USD Value
                        status: "PENDING", // Requested by user
                        tokenSymbol: data.destToken,
                        decimals: 6,
                        toAddress: data.recipient.trim().toLowerCase(), // [NEW] Normalize recipient
                        destinationChain: data.destChain, // [NEW]
                        createdAt: Date.now(),
                        route: [
                            {
                                chainName: data.sourceChain, // Source chain as requested
                                amount: amount,
                                assetOrigin: data.sourceToken, // Use sourceToken for outgoing asset
                                status: "PENDING",
                                txHash: result.transactionHash
                            }
                        ],
                        estimatedReceived: estimatedRec
                    };

                    await transactionsApi.create(txData as unknown as CreateTransactionRequest);
                    console.log("Transaction saved to DB");

                } catch (dbError) {
                    console.error("Failed to save transaction to DB:", dbError);
                    // Don't block UI flow for BG error
                }

                if (result.burnTransactionHash) {
                    toast.info(`Burn TX: ${result.burnTransactionHash.slice(0, 10)}... Circle minteará automáticamente.`);
                }
                handleCloseModal(); // Reset and close
            } else {
                toast.error(`Error: ${result.errorReason || "Unknown Error"} `);
                console.error("Transfer failed result:", result);
            }
        } catch (err) {
            console.error(err);
            toast.error("Error al procesar el transfer");
        }
    };

    // Simulation State
    const [simulation, setSimulation] = useState<{
        estimated: string;
        error: string | null;
        done: boolean;
        loading: boolean;
        netAmount?: number;
    }>({ estimated: "", error: null, done: false, loading: false });

    // [FIX] Use Ref to avoid stale closure in onSubmit
    const simulationRef = useRef<typeof simulation>(simulation);

    // Sync ref with state
    useEffect(() => {
        simulationRef.current = simulation;
    }, [simulation]);

    // Reset simulation when inputs change
    useEffect(() => {
        setSimulation({ estimated: "", error: null, done: false, loading: false });
    }, [watchAmount, watchSourceChain, watchDestChain, watchSourceToken, watchDestToken]);

    const simulateTransfer = async () => {
        if (!watchAmount || isNaN(parseFloat(watchAmount))) {
            toast.error("Ingresa un monto válido");
            return;
        }

        setSimulation(prev => ({ ...prev, loading: true, error: null, done: false }));
        try {
            // Determine Fee logic matching execution
            const isDev = process.env.NEXT_PUBLIC_ENVIROMENT === "development" || process.env.NODE_ENV === "development";
            const baseFee = (watchSourceChain === watchDestChain)
                ? (watchSourceToken !== watchDestToken ? 0.02 : 0.01)
                : 0.02;
            const fee = isDev ? 0 : baseFee;

            const amountFloat = parseFloat(watchAmount);
            const totalAmountToSimulate = (amountFloat + fee).toFixed(6);

            const data = await bridgeApi.getQuote({
                sourceChain: watchSourceChain,
                targetChain: watchDestChain,
                amount: totalAmountToSimulate,
                token: watchDestToken,
                sourceToken: watchSourceToken
            });

            if (data.success) {
                const newSimState = {
                    estimated: data.estimatedReceived || "",
                    netAmount: data.netAmountBridged,
                    error: null,
                    done: true,
                    loading: false
                };
                setSimulation(newSimState);
                simulationRef.current = newSimState; // Update ref immediately
            } else {
                setSimulation({
                    estimated: "",
                    error: data.error || "Error al simular",
                    done: true,
                    loading: false
                });
                toast.error(data.error || "Error al simular");
            }
        } catch (e: any) {
            console.error("Simulation error:", e);
            // Try to extract specific error from response if available
            const errorMessage = e?.response?.data?.error || e?.message || "Error de conexión";

            setSimulation({
                estimated: "",
                error: errorMessage,
                done: true,
                loading: false
            });
            toast.error(errorMessage);
        }
    };

    const isCCTPRoute = useMemo(() => {
        if (!isCrossChain) return false;
        if (watchSourceChain === "Stellar" || watchDestChain === "Stellar") return false;

        const sourceConfig = NETWORKS[watchSourceChain as keyof typeof NETWORKS];
        const destConfig = NETWORKS[watchDestChain as keyof typeof NETWORKS];

        if (!sourceConfig || !destConfig) return false;

        if (watchSourceToken !== "USDC" || watchDestToken !== "USDC") return false;

        const sourceCCTP = sourceConfig.crossChainInformation.circleInformation?.cCTPInformation?.supportCCTP;
        const destCCTP = destConfig.crossChainInformation.circleInformation?.cCTPInformation?.supportCCTP;

        return !!(sourceCCTP && destCCTP);
    }, [watchSourceChain, watchDestChain, watchSourceToken, watchDestToken, isCrossChain]);

    return {
        open,
        address,
        privateKey,
        provider,
        isLoading: isFacilitatorLoading || isHybridLoading,
        error,
        form,
        routeError,
        watchAmount,
        watchSourceChain,
        watchDestChain,
        watchSourceToken,
        watchDestToken,
        isCrossChain,
        isCCTPRoute,
        minAmount,
        isAmountValid,
        isExceedingMax,
        maxAmount,
        balance,
        fee,
        total,
        simulation,
        simulateTransfer,
        openModal,
        closeModal: handleCloseModal,
        onSubmit: handleSubmit(onSubmit),
        tokenPrice,
        tokenPriceLoading,
        destTokenPrice,
        destTokenPriceLoading
    };
};
