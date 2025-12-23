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
import { STELLAR } from "@/app/constants/chais/Stellar";
import { getBalanceFromChain } from "@/app/hook/useGetBalanceFromChain";
import { getStellarUSDCBalance } from "@/app/lib/stellar/getStellarUSDCBalance";

// Types
export const STELLAR_CHAIN_KEY = "Stellar";

export type FormValues = {
    sourceChain: FacilitatorChainKey;
    destChain: FacilitatorChainKey | typeof STELLAR_CHAIN_KEY;
    recipient: string;
    amount: string;
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
            destToken: "USDC",
        },
    });

    const { watch, reset, handleSubmit } = form;
    const watchAmount = watch("amount");
    const watchSourceChain = watch("sourceChain");
    const watchDestChain = watch("destChain");

    const isCrossChain = watchSourceChain !== watchDestChain;

    // Logic: "Minimun calculated based on SOURCE chain fee" (Reverted logic)
    const minAmount = useMemo(() => {
        if (watchSourceChain === watchDestChain) {
            return 0;
        }

        if ((watchDestChain as string) === STELLAR_CHAIN_KEY) {
            return 0.001; // Testing minimum for 1-Click Bridge
        }

        if ((watchSourceChain as string) === STELLAR_CHAIN_KEY) {
            return 0.23; // Minimum for Stellar source
        }

        // Safe access
        const sourceConfig = NETWORKS[watchSourceChain as keyof typeof NETWORKS];
        return sourceConfig?.crossChainInformation.circleInformation?.aproxFromFee || 0;
    }, [watchSourceChain, watchDestChain]);

    // Calculate Max Amount (Balance - 0.01)
    const { wallets } = useWalletStore(); // Access wallets store

    // We need to fetch the balance for the current chain
    // Issue: wallets store is async/complex. 
    // Simpler: Find the wallet and chain in the store synchronously.

    // Calculate Max Amount (Balance - 0.01)
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

                    const balance = await getStellarUSDCBalance(publicKey);

                    if (balance !== null) {
                        const max = balance - 0.01;
                        if (isMounted) setMaxAmount(max > 0 ? parseFloat(max.toFixed(6)) : 0);
                    } else {
                        if (isMounted) setMaxAmount(0);
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

            const chainId = networkConfig.evm.chain.id.toString();

            // 1. Child Wallet (Sync)
            const wallet = wallets.find(w => w.address.toLowerCase() === address.toLowerCase());
            if (wallet) {
                const chainInfo = wallet.chains.find(c => c.chainId === chainId);
                if (chainInfo) {
                    const balance = chainInfo.amount;
                    const max = balance - 0.01;
                    // Use 6 decimals (USDC standard) to avoid rounding up errors on small amounts
                    if (isMounted) setMaxAmount(max > 0 ? parseFloat(max.toFixed(6)) : 0);
                    return;
                }
            }

            // 2. Main Wallet / External (Async)
            try {
                const usdcAddress = networkConfig.assets.find(a => a.name === "USDC")?.address;
                if (usdcAddress) {
                    const { balance } = await getBalanceFromChain(
                        networkConfig.evm.chain,
                        address as Address,
                        usdcAddress as Address
                    );
                    const numBalance = Number(balance || 0);
                    const max = numBalance - 0.01;
                    // Use 6 decimals
                    if (isMounted) setMaxAmount(max > 0 ? parseFloat(max.toFixed(6)) : 0);
                }
            } catch (err) {
                console.error("Error fetching max amount:", err);
                if (isMounted) setMaxAmount(0);
            }
        };

        fetchBalance();
        return () => { isMounted = false; };
    }, [address, wallets, watchSourceChain]);

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
        if (!watchAmount) return "0.00";
        if ((watchDestChain as string) === STELLAR_CHAIN_KEY) {
            return NETWORKS.Stellar.crossChainInformation.circleInformation?.aproxFromFee?.toString() || "0";
        }
        if ((watchSourceChain as string) === STELLAR_CHAIN_KEY) {
            return "0.01"; // Fixed Facilitator Fee
        }
        return getFee();
    }, [watchAmount, watchDestChain, watchSourceChain, getFee]);

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
            useGrouping: false // No commas for cleaner raw value or keep them? User wants precision.
        });
    }, [watchAmount, fee]);

    const onSubmit = async (data: FormValues) => {
        if (!address) {
            toast.error("No hay wallet conectada");
            return;
        }

        if (!data.recipient || !data.amount) {
            toast.error("Completa todos los campos");
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
        // Add minimal Stellar fee logic if Source is Stellar (wrapper handled in hook, but fee addition logic was here)
        // Hook expects RAW amount input for Stellar -> EVM?
        // Let's keep the hook clean and handle fee details inside logic if possible, OR pass the 'amount' as user input.
        // User logic: "Input: 0.23 -> Send 0.24 -> Facilitator keeps 0.01 -> Bridges 0.23"
        // Let's pass the raw amount the user wants to BRIDGE, and let the hook handle internal fee logic/addition if needed.
        // HOWEVER, previous code calculated `amountWithFee` and passed IT to the function.
        // To be safe, let's keep the fee addition here for Stellar Source.

        let finalAmount = data.amount;
        if ((data.sourceChain as string) === STELLAR_CHAIN_KEY) {
            finalAmount = (parseFloat(data.amount) + 0.01).toFixed(6);
        }

        try {
            console.log("Submitting unified transfer:", data);

            const result = await executeTransfer({
                amount: finalAmount,
                sourceChain: data.sourceChain,
                destinationChain: data.destChain as FacilitatorChainKey,
                recipient: data.recipient,
                destToken: data.destToken
            });

            if (result.success) {
                toast.success(`Transfer exitoso! TX: ${result.transactionHash?.slice(0, 10)}...`);
                if (result.burnTransactionHash) {
                    toast.info(`Burn TX: ${result.burnTransactionHash.slice(0, 10)}... Circle minteará automáticamente.`);
                }
                closeModal();
            } else {
                toast.error(`Error: ${result.errorReason || "Unknown Error"}`);
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
        watchAmount,
        watchSourceChain,
        watchDestChain,
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
