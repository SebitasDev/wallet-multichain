import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Address } from "abitype";

import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";
import { useFacilitator, FacilitatorChainKey } from "@/app/facilitator";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { STELLAR } from "@/app/constants/chais/NoEvm/Stellar";
import { getBalanceFromChain } from "@/app/hook/useGetBalanceFromChain";
import { getStellarUSDCBalance } from "@/app/lib/stellar/getStellarUSDCBalance";

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

// -- Helper Hook: Route Validation --
const useRouteValidation = (sourceChain: string, destChain: string, sourceToken: string, destToken: string) => {
    return useMemo(() => {
        const getChainConfig = (key: string) => {
            if (key === STELLAR_CHAIN_KEY) return STELLAR;
            return NETWORKS[key as keyof typeof NETWORKS];
        };

        const sourceConfig = getChainConfig(sourceChain);
        const destConfig = getChainConfig(destChain);

        if (!sourceConfig || !destConfig) return null;

        const isSourceNonEvm = !!sourceConfig.nonEvm;
        const isDestNonEvm = !!destConfig.nonEvm;

        // Case 1: Heterogeneous Chains (EVM <-> Non-EVM)
        if (isSourceNonEvm !== isDestNonEvm) {
            const evmConfig = isSourceNonEvm ? destConfig : sourceConfig;
            const nonEvmConfig = isSourceNonEvm ? sourceConfig : destConfig;

            if (!evmConfig.crossChainInformation.nearIntentInformation?.support) {
                return `Ruta no disponible: ${evmConfig.label} no tiene soporte para conectar con ${nonEvmConfig.label}`;
            }
            if (!nonEvmConfig.crossChainInformation.nearIntentInformation?.support) {
                return `Ruta no disponible: ${nonEvmConfig.label} no tiene soporte para puentes`;
            }
        }

        // Case 2: Homogeneous EVM Chains (EVM <-> EVM)
        if (!isSourceNonEvm && !isDestNonEvm) {
            if (sourceToken === 'USDC' && destToken === 'USDC') {
                const sourceCCTP = sourceConfig.crossChainInformation.circleInformation?.cCTPInformation?.supportCCTP;
                const destCCTP = destConfig.crossChainInformation.circleInformation?.cCTPInformation?.supportCCTP;

                if (sourceCCTP && destCCTP) return null;

                const sourceNear = sourceConfig.crossChainInformation.nearIntentInformation?.support;
                const destNear = destConfig.crossChainInformation.nearIntentInformation?.support;

                if (sourceNear && destNear) return null;

                return `Ruta no disponible para USDC: Se requiere soporte CCTP o Near Intents en ambas chains.`;
            }
        }

        return null;
    }, [sourceChain, destChain, sourceToken, destToken]);
};

// -- Helper Hook: Max Amount Calculation --
const useMaxTransferAmount = (
    address: string | undefined | null,
    sourceChain: string,
    destChain: string,
    sourceToken: string,
    destToken: string,
    stellarPrivateKey: string | null
) => {
    const [maxAmount, setMaxAmount] = useState(0);
    const [balance, setBalance] = useState(0);

    // Calculate expected fee for Max calc (independent of amount entered)
    const expectedFee = useMemo(() => {
        if (process.env.NEXT_PUBLIC_ENVIROMENT === "development") return 0;

        let feeVal = 0.02; // Default Cross-chain
        if (sourceChain === destChain) {
            feeVal = sourceToken !== destToken ? 0.02 : 0.01;
        }
        return feeVal;
    }, [sourceChain, destChain, sourceToken, destToken]);

    useEffect(() => {
        let isMounted = true;

        const fetchBalance = async () => {
            if (!address) {
                if (isMounted) {
                    setMaxAmount(0);
                    setBalance(0);
                }
                return;
            }

            // Stellar Logic
            if (sourceChain === STELLAR_CHAIN_KEY) {
                if (!stellarPrivateKey) {
                    if (isMounted) {
                        setMaxAmount(0);
                        setBalance(0);
                    }
                    return;
                }

                try {
                    const { Keypair } = await import("stellar-sdk");
                    const keypair = Keypair.fromSecret(stellarPrivateKey);
                    const publicKey = keypair.publicKey();

                    if (sourceToken === "XLM") {
                        // XLM is Native. Fee is paid in XLM.
                        // Max = Balance - Reserve (1.0) - Fee
                        const server = new (await import("stellar-sdk")).Horizon.Server("https://horizon.stellar.org");
                        const account = await server.loadAccount(publicKey);
                        const native = account.balances.find((b) => b.asset_type === "native");
                        const bal = native ? parseFloat(native.balance) : 0;
                        const max = bal - 1.1 - expectedFee;
                        if (isMounted) {
                            setBalance(bal);
                            setMaxAmount(max > 0 ? parseFloat(max.toFixed(6)) : 0);
                        }
                    } else {
                        // USDC or other Asset. Fee is paid in Asset (simplification).
                        const bal = await getStellarUSDCBalance(publicKey);
                        if (bal !== null) {
                            const max = bal - expectedFee;
                            if (isMounted) {
                                setBalance(bal);
                                setMaxAmount(max > 0 ? parseFloat(max.toFixed(6)) : 0);
                            }
                        } else {
                            if (isMounted) {
                                setMaxAmount(0);
                                setBalance(0);
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error fetching Stellar balance:", e);
                    if (isMounted) {
                        setMaxAmount(0);
                        setBalance(0);
                    }
                }
                return;
            }

            // EVM Logic
            const networkConfig = NETWORKS[sourceChain as keyof typeof NETWORKS];
            if (!networkConfig || !networkConfig.evm) {
                if (isMounted) {
                    setMaxAmount(0);
                    setBalance(0);
                }
                return;
            }

            const tokenName = sourceToken || "USDC";
            const assetInfo = networkConfig.assets.find(a => a.name === tokenName);
            const tokenAddress = assetInfo?.address;

            try {
                if (tokenAddress) {
                    const { balance: rawBal } = await getBalanceFromChain(
                        networkConfig.evm.chain,
                        address as Address,
                        tokenAddress as Address
                    );
                    const numBalance = Number(rawBal || 0);

                    // For ERC20, we don't need gas reserve (paid in ETH).
                    // But we MUST cover the facilitator fee which is added to the amount input.
                    // MaxInput = Balance - Fee.
                    const max = numBalance - expectedFee;

                    // Add tiny buffer for rounding errors if needed, but exact math should work for ERC20.
                    // However, Javascript math can be wonky. (0.2 + 0.01 = 0.21000000001)
                    // Let's ceil the decimals to 6 before comparing.
                    // Or better, subtract a tiny epsilon.

                    // Also, we need to ensure that when we reverse calculate: (max + fee).toFixed(6) <= balance

                    if (isMounted) {
                        setBalance(numBalance);
                        setMaxAmount(max > 0 ? parseFloat(max.toFixed(6)) : 0);
                    }
                }
            } catch (err) {
                console.error("Error fetching max amount:", err);
                if (isMounted) {
                    setMaxAmount(0);
                    setBalance(0);
                }
            }
        };

        fetchBalance();
        return () => { isMounted = false; };
    }, [address, sourceChain, destChain, sourceToken, destToken, stellarPrivateKey, expectedFee]);

    return { maxAmount, balance };
};

export const useCrossChainTransfer = () => {
    const [open, setOpen] = useState(false);
    const [privateKey, setPrivateKey] = useState<`0x${string}` | null>(null);
    const [stellarPrivateKey, setStellarPrivateKey] = useState<string | null>(null);
    const [provider, setProvider] = useState<any>(null);

    const { address, isUsingXO } = useXOContracts();
    const mainWallet = useXOWalletStore((s) => s.mainWallet);
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
            } else if (mainWallet.encryptedPrivateKey && currentPassword) {
                try {
                    const pk = await decryptPrivateKey(
                        mainWallet.encryptedPrivateKey,
                        currentPassword,
                        mainWallet.salt!,
                        mainWallet.iv!
                    );
                    setPrivateKey(pk as `0x${string}`);

                    if (mainWallet.encryptedPrivateKeyStellar) {
                        const pkStellar = await decryptPrivateKey(
                            mainWallet.encryptedPrivateKeyStellar,
                            currentPassword,
                            mainWallet.salt!,
                            mainWallet.iv!
                        );
                        setStellarPrivateKey(pkStellar);
                    }
                    console.log(">>> Private Key local cargada");
                } catch (e) {
                    console.error("Error decrypting private key:", e);
                }
            }
        };
        setup();
    }, [isUsingXO, mainWallet, currentPassword]);

    const {
        executeTransfer,
        getFee,
        isLoading,
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

    const isCrossChain = watchSourceChain !== watchDestChain;

    // Derived State
    const { maxAmount, balance } = useMaxTransferAmount(address, watchSourceChain, watchDestChain, watchSourceToken, watchDestToken, stellarPrivateKey);
    const routeError = useRouteValidation(watchSourceChain, watchDestChain, watchSourceToken, watchDestToken);

    const minAmount = useMemo(() => {
        if (!isCrossChain) return 0;
        if ((watchDestChain as string) === STELLAR_CHAIN_KEY) return 0.001;
        if ((watchSourceChain as string) === STELLAR_CHAIN_KEY) return 0.23;

        const sourceConfig = NETWORKS[watchSourceChain as keyof typeof NETWORKS];
        return sourceConfig?.crossChainInformation.circleInformation?.aproxFromFee || 0;
    }, [watchSourceChain, watchDestChain, isCrossChain]);

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

    const fee = useMemo(() => {
        if (process.env.NEXT_PUBLIC_ENVIROMENT === "development") return "0";
        if (!watchAmount) return "0.00";

        if (watchSourceChain === watchDestChain) {
            // Swap = 0.02, Transfer = 0.01
            return watchSourceToken !== watchDestToken ? "0.02" : "0.01";
        }
        return "0.02"; // Cross-chain
    }, [watchAmount, watchDestChain, watchSourceChain, watchSourceToken, watchDestToken]);

    const total = useMemo(() => {
        const amount = parseFloat(watchAmount || "0");
        const feeVal = parseFloat(fee);
        return (amount + feeVal).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
            useGrouping: false
        });
    }, [watchAmount, fee]);

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

        try {
            const result = await executeTransfer({
                amount: finalAmount,
                sourceChain: data.sourceChain,
                destinationChain: data.destChain as FacilitatorChainKey,
                recipient: data.recipient,
                destToken: data.destToken,
                sourceToken: data.sourceToken,
                facilitatorFee: fee,
                sender: (data.sourceChain === "Stellar" ? mainWallet?.addressStellar : mainWallet?.address) || undefined
            });

            if (result.success) {
                toast.success(`Transfer exitoso! TX: ${result.transactionHash?.slice(0, 10)}...`);

                // Save to DB
                try {
                    const txData = {
                        id: crypto.randomUUID(),
                        fromAddress: address,
                        totalAmount: amount,
                        status: "PENDING", // Requested by user
                        tokenSymbol: data.destToken,
                        decimals: 6,
                        toAddress: data.recipient.trim(), // [NEW]
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
                        ]
                    };

                    await fetch("/api/transactions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(txData)
                    });
                    console.log("Transaction saved to DB");

                } catch (dbError) {
                    console.error("Failed to save transaction to DB:", dbError);
                    // Don't block UI flow for BG error
                }

                if (result.burnTransactionHash) {
                    toast.info(`Burn TX: ${result.burnTransactionHash.slice(0, 10)}... Circle minteará automáticamente.`);
                }
                closeModal();
            } else {
                toast.error(`Error: ${result.errorReason || "Unknown Error"}`);
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
            const res = await fetch("/api/bridge/quote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceChain: watchSourceChain,
                    targetChain: watchDestChain,
                    amount: watchAmount,
                    token: watchDestToken
                })
            });
            const data = await res.json();

            if (data.success) {
                setSimulation({
                    estimated: data.estimatedReceived,
                    netAmount: data.netAmountBridged,
                    error: null,
                    done: true,
                    loading: false
                });
            } else {
                setSimulation({
                    estimated: "",
                    error: data.error || "Error al simular",
                    done: true,
                    loading: false
                });
                toast.error(data.error || "Error al simular");
            }
        } catch (e) {
            console.error("Simulation error:", e);
            setSimulation({
                estimated: "",
                error: "Error de conexión",
                done: true,
                loading: false
            });
            toast.error("Error al conectar con el servidor");
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
        isLoading,
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
        closeModal,
        onSubmit: handleSubmit(onSubmit),
    };
};
