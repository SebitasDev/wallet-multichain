import { useState, useEffect, useMemo } from "react";
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
import { ChainKey } from "@/app/types/chain";
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

export const useCrossChainTransfer = () => {
    const [open, setOpen] = useState(false);
    const [privateKey, setPrivateKey] = useState<`0x${string}` | null>(null);
    const [stellarPrivateKey, setStellarPrivateKey] = useState<string | null>(null);
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

                    let pkStellar: string | null = null;
                    if (mainWallet.encryptedPrivateKeyStellar) {
                        pkStellar = await decryptPrivateKey(
                            mainWallet.encryptedPrivateKeyStellar,
                            currentPassword,
                            mainWallet.salt!,
                            mainWallet.iv!
                        );
                        setStellarPrivateKey(pkStellar);
                    }

                    console.log(">>> Private key local cargada para firmar");
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
        getTotalWithFee,
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

    const { watch, reset, handleSubmit, setValue } = form; // Exposed setValue
    const watchAmount = watch("amount");
    const watchSourceChain = watch("sourceChain");
    const watchDestChain = watch("destChain");
    const watchSourceToken = watch("sourceToken"); // Watch source token
    const watchDestToken = watch("destToken");

    // Reset tokens when chains change (optional, but good UX to avoid invalid states)
    useEffect(() => {
        setValue("sourceToken", "USDC");
    }, [watchSourceChain, setValue]);

    useEffect(() => {
        setValue("destToken", "USDC");
    }, [watchDestChain, setValue]);

    const isCrossChain = watchSourceChain !== watchDestChain;

    // Logic: "Minimun calculated based on SOURCE chain fee" (Reverted logic)
    const minAmount = useMemo(() => {
        if (watchSourceChain === watchDestChain) {
            return 0;
        }

        if ((watchDestChain as string) === STELLAR_CHAIN_KEY) {
            return 0.001;
        }

        // If sending XLM from Stellar, maybe different min? Keeping same for now.
        if ((watchSourceChain as string) === STELLAR_CHAIN_KEY) {
            return 0.23;
        }

        const sourceConfig = NETWORKS[watchSourceChain as keyof typeof NETWORKS];
        return sourceConfig?.crossChainInformation.circleInformation?.aproxFromFee || 0;
    }, [watchSourceChain, watchDestChain]);

    // Calculate Max Amount (Balance - 0.01)
    const { wallets } = useWalletStore();
    const [maxAmount, setMaxAmount] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const fetchBalance = async () => {
            if (!address) {
                if (isMounted) setMaxAmount(0);
                return;
            }

            // Stellar Logic
            if ((watchSourceChain as string) === STELLAR_CHAIN_KEY) {
                if (!stellarPrivateKey) {
                    if (isMounted) setMaxAmount(0);
                    return;
                }

                try {
                    const { Keypair } = await import("stellar-sdk");
                    const keypair = Keypair.fromSecret(stellarPrivateKey);
                    const publicKey = keypair.publicKey();

                    // Check source token
                    if (watchSourceToken === "XLM") {
                        // Native XLM balance logic (Simplified: fetch account)
                        const server = new (await import("stellar-sdk")).Horizon.Server("https://horizon.stellar.org");
                        const account = await server.loadAccount(publicKey);
                        const native = account.balances.find((b) => b.asset_type === "native");
                        const balance = native ? parseFloat(native.balance) : 0;
                        // Reserve 1 XLM for account + fee
                        const max = balance - 1.1;
                        if (isMounted) setMaxAmount(max > 0 ? parseFloat(max.toFixed(6)) : 0);
                    } else {
                        // USDC
                        const balance = await getStellarUSDCBalance(publicKey);
                        if (balance !== null) {
                            const max = balance - 0.01;
                            if (isMounted) setMaxAmount(max > 0 ? parseFloat(max.toFixed(6)) : 0);
                        } else {
                            if (isMounted) setMaxAmount(0);
                        }
                    }

                } catch (e) {
                    console.error("Error fetching Stellar balance:", e);
                    if (isMounted) setMaxAmount(0);
                }
                return;
            }

            // EVM Logic
            const networkConfig = NETWORKS[watchSourceChain as keyof typeof NETWORKS];
            if (!networkConfig || !networkConfig.evm) {
                if (isMounted) setMaxAmount(0);
                return;
            }

            // Use Source Token to find address? For now, assuming USDC is primary.
            // If user adds other tokens, we need to map name -> address in config.
            // Current config `assets` array is best bet.

            const tokenName = watchSourceToken || "USDC";
            const assetInfo = networkConfig.assets.find(a => a.name === tokenName);
            const tokenAddress = assetInfo?.address;

            // ... (Existing logic primarily for USDC)
            // If token is native (ETH/MATIC), need different logic.
            // Assuming non-native for now based on 'assets' list usually being ERC20s like USDC.

            const chainId = networkConfig.evm.chain.id.toString();

            // 1. Child Wallet (Sync)
            // ... (Logic assumes wallet.chains only tracks the main asset or pre-configured ones?)
            // The `wallet.chains` structure likely tracks native. 
            // `getBalanceFromChain` handles ERC20.

            // 2. Main Wallet / External (Async)
            try {
                if (tokenAddress) {
                    const { balance } = await getBalanceFromChain(
                        networkConfig.evm.chain,
                        address as Address,
                        tokenAddress as Address
                    );
                    const numBalance = Number(balance || 0);
                    const max = numBalance - 0.01;
                    if (isMounted) setMaxAmount(max > 0 ? parseFloat(max.toFixed(6)) : 0);
                }
            } catch (err) {
                console.error("Error fetching max amount:", err);
                if (isMounted) setMaxAmount(0);
            }
        };

        fetchBalance();
        return () => { isMounted = false; };
        fetchBalance();
        return () => { isMounted = false; };
    }, [address, wallets, watchSourceChain, watchSourceToken, stellarPrivateKey]);

    // Route Validation
    const routeError = useMemo(() => {
        const getChainConfig = (key: string) => {
            if (key === STELLAR_CHAIN_KEY) return STELLAR;
            return NETWORKS[key as keyof typeof NETWORKS];
        };

        const sourceConfig = getChainConfig(watchSourceChain);
        const destConfig = getChainConfig(watchDestChain);

        if (!sourceConfig || !destConfig) return null;

        const isSourceNonEvm = !!sourceConfig.nonEvm;
        const isDestNonEvm = !!destConfig.nonEvm;

        // Case 1: Heterogeneous Chains (EVM <-> Non-EVM)
        // One is EVM, one is Non-EVM.
        if (isSourceNonEvm !== isDestNonEvm) {
            const evmConfig = isSourceNonEvm ? destConfig : sourceConfig;
            const nonEvmConfig = isSourceNonEvm ? sourceConfig : destConfig;

            // To bridge between EVM and Non-EVM (like Stellar), the EVM chain MUST support Near Intents (the bridge layer)
            if (!evmConfig.crossChainInformation.nearIntentInformation?.support) {
                return `Ruta no disponible: ${evmConfig.label} no tiene soporte para conectar con ${nonEvmConfig.label}`;
            }
            // Verify Non-EVM capability (e.g. Stellar matches)
            if (!nonEvmConfig.crossChainInformation.nearIntentInformation?.support) {
                return `Ruta no disponible: ${nonEvmConfig.label} no tiene soporte para puentes`;
            }
        }

        // Case 2: Homogeneous EVM Chains (EVM <-> EVM)
        if (!isSourceNonEvm && !isDestNonEvm) {
            // USDC check (Primary use case)
            if (watchSourceToken === 'USDC' && watchDestToken === 'USDC') {
                const sourceCCTP = sourceConfig.crossChainInformation.circleInformation?.cCTPInformation?.supportCCTP;
                const destCCTP = destConfig.crossChainInformation.circleInformation?.cCTPInformation?.supportCCTP;

                // Priority 1: CCTP (Both must support it)
                if (sourceCCTP && destCCTP) {
                    return null; // Valid via CCTP
                }

                // Priority 2: Near Intents (Both must support it if CCTP fails)
                const sourceNear = sourceConfig.crossChainInformation.nearIntentInformation?.support;
                const destNear = destConfig.crossChainInformation.nearIntentInformation?.support;

                if (sourceNear && destNear) {
                    return null; // Valid via Near
                }

                return `Ruta no disponible para USDC: Se requiere que ambas chains (${sourceConfig.label} y ${destConfig.label}) soporten CCTP o Near Intents.`;
            }
        }

        return null;
    }, [watchSourceChain, watchDestChain, watchSourceToken, watchDestToken]);

    const isAmountValid = useMemo(() => {
        const strAmount = watchAmount ? String(watchAmount) : "";
        if (!strAmount || strAmount.trim() === "") return true;
        const amount = parseFloat(strAmount);
        if (isNaN(amount)) return false;
        return amount >= minAmount;
    }, [watchAmount, minAmount]);

    const isExceedingMax = useMemo(() => {
        const strAmount = watchAmount ? String(watchAmount) : "";
        if (!strAmount || strAmount.trim() === "") return false;
        const amount = parseFloat(strAmount);
        if (isNaN(amount)) return false;
        return amount > maxAmount;
    }, [watchAmount, maxAmount]);

    const openModal = () => setOpen(true);
    const closeModal = () => {
        reset();
        setOpen(false);
    };

    const fee = useMemo(() => {
        // Waive fee in Development
        if (process.env.NEXT_PUBLIC_ENVIROMENT === "development") {
            return "0";
        }

        if (!watchAmount) return "0.00";

        // Same Chain
        if (watchSourceChain === watchDestChain) {
            // Different Token (Swap) -> 0.02
            if (watchSourceToken !== watchDestToken) {
                return "0.02";
            }
            // Same Token (Transfer) -> 0.01
            return "0.01";
        }

        // Different Chain -> 0.02
        return "0.02";
    }, [watchAmount, watchDestChain, watchSourceChain, watchSourceToken, watchDestToken, getFee]);

    // Recalculate total with precision for display
    const total = useMemo(() => {
        if (!watchAmount) return "0.00";
        const amount = parseFloat(watchAmount);
        const feeVal = parseFloat(fee);
        if (isNaN(amount) || isNaN(feeVal)) return "0.00";
        // Use high precision for display
        return (amount + feeVal).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
            useGrouping: false
        });
    }, [watchAmount, fee]);

    const onSubmit = async (data: FormValues) => {
        if (!address) {
            toast.error("No hay wallet conectada");
            console.error("Wallet not connected");
            return;
        }

        // Log wallet info for debugging
        console.log("Wallet address for signing:", address);
        console.log("Current mainWallet:", mainWallet);
        console.log("Private key available:", !!privateKey);

        if (!data.recipient || !data.amount) {
            toast.error("Completa todos los campos");
            return;
        }

        // Route Validation Block
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


        // Unified Transfer Call
        toast.info("Firmando autorización...");

        // Calculate Total to Sign (Amount + Fee)
        // User request: "lo que el usuario firme sea dependiendo eso + valor + fee aproximado"
        const currentFee = parseFloat(fee);
        const finalAmount = (amount + currentFee).toFixed(6);

        console.log(`Preparing transfer: Amount=${amount} + Fee=${currentFee} = Total=${finalAmount}`);

        try {
            console.log("Submitting unified transfer:", { ...data, finalAmount });

            const result = await executeTransfer({
                amount: finalAmount, // Send total amount (incl. fee)
                sourceChain: data.sourceChain,
                destinationChain: data.destChain as FacilitatorChainKey,
                recipient: data.recipient,
                destToken: data.destToken,
                sourceToken: data.sourceToken,
                facilitatorFee: fee // Pass explicit fee
            });

            if (result.success) {
                toast.success(`Transfer exitoso! TX: ${result.transactionHash?.slice(0, 10)}...`);
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
        routeError, // Exposed validation error
        watchAmount,
        watchSourceChain,
        watchDestChain,
        watchSourceToken,
        watchDestToken,
        isCrossChain,
        minAmount,
        isAmountValid,
        isExceedingMax,
        maxAmount,

        // Computed
        fee,
        total,

        // Actions
        openModal,
        closeModal,
        onSubmit: handleSubmit(onSubmit),
    };
};
