import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Address } from "abitype";

import { useXOContracts } from "@/app/dashboard/hooks/wallet/useXOConnect";
import { useFacilitator, FacilitatorChainKey } from "@/app/facilitator";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { useWalletStore } from "@/app/store/useWalletsStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { STELLAR } from "@/app/constants/chais/NoEvm/Stellar";
import { getBalanceFromChain } from "@/app/hooks/useGetBalanceFromChain";
import { getStellarUSDCBalance } from "@/app/lib/stellar/getStellarUSDCBalance";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { bridgeApi, transactionsApi, CreateTransactionRequest } from "@/app/services/api";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { create7702Account } from "@/app/smart-account/clientFactory";
import { createAuthorization } from "@/app/smart-account/authorizationFactory";
import { erc20Abi } from "@/app/savings/vaultAbi";

import axios from "axios";


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
        if (process.env.NEXT_PUBLIC_ENVIROMENT === "development" || process.env.NODE_ENV === "development") return 0;

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
                        tokenAddress as Address,
                        assetInfo?.decimals // [NEW] Pass decimals from config
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
    const { crossChainOpen: open, openCrossChain: setOpen, closeCrossChain: closeModal } = useDashboardModalsStore();
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

    const isCrossChain = watchSourceChain !== watchDestChain || watchSourceToken !== watchDestToken;

    // Derived State
    const { maxAmount, balance } = useMaxTransferAmount(address, watchSourceChain, watchDestChain, watchSourceToken, watchDestToken, stellarPrivateKey);
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

    const fee = useMemo(() => {
        if (process.env.NEXT_PUBLIC_ENVIROMENT === "development" || process.env.NODE_ENV === "development") return "0";
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
            console.log("[SendMoney Cross] Triggering 7702 Flow");
            toast.info("Procesando Envío (Gasless)...");

            const publicClient = createPublicClient({
                chain: networkConfig.evm!.chain,
                transport: http()
            });

            try {
                // 1. Create & Sign Authorization
                // Assuming privateKey is available (decrypted above)
                const { account: smartAccount, owner } = await create7702Account(publicClient, privateKey);
                // Authorization to upgrade the EOA to Smart Account code
                const authorization = await createAuthorization(owner, publicClient, smartAccount);


                // 2. Prepare & Sign UserOperation (Standard 4337 Execution)
                // We must sign a UserOp so the EntryPoint can validate us (we are not the owner directly calling)

                const tokenInfo = networkConfig.assets.find(a => a.name === sourceToken);
                if (!tokenInfo) throw new Error("Token info not found");

                const decimals = tokenInfo.decimals;
                const amountBigInt = BigInt(Math.floor(parseFloat(finalAmount) * 10 ** decimals));

                const FACILITATOR_ADDR = "0xa08979ba1aac1c19dc659817c295c77018533a97"; // Hardcode fallback for safety
                // Ideally use import { FACILITATOR_ADDRESS } from "@/app/facilitator/config"; 
                // but let's ensure we use the one known to work first.

                const transferCallData = encodeFunctionData({
                    abi: erc20Abi,
                    functionName: "transfer",
                    args: [FACILITATOR_ADDR as Address, amountBigInt]
                });

                // Prepare User Op
                // Since we don't have a Bundler Client connected to the Smart Account, `signUserOperation` might fail estimating gas.
                // We need to construct a partial UserOp and force defaults if needed.

                // Let's assume standard values for gas to avoid estimation calls that fail.
                // [FIX] Massive increase to prevent AA95 Out of Gas during 7702 delegation
                const callGasLimit = BigInt(500000); // 500k [FIX: Reduced for efficiency]
                const verificationGasLimit = BigInt(500000); // 500k [FIX: Reduced]
                const preVerificationGas = BigInt(100000); // 100k [FIX: Reduced]
                const maxFeePerGas = BigInt(100); // Dummy, will be replaced by Relayer? No, signed!
                const maxPriorityFeePerGas = BigInt(100);

                // Helper ABI for SimpleAccount.execute
                const executeAbi = [{
                    inputs: [
                        { name: "dest", type: "address" },
                        { name: "value", type: "uint256" },
                        { name: "func", type: "bytes" }
                    ],
                    name: "execute",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function"
                }] as const;

                const executeCallData = encodeFunctionData({
                    abi: executeAbi,
                    functionName: "execute",
                    args: [tokenInfo.address as Address, BigInt(0), transferCallData]
                });

                // Construct the UserOp object manually or via helper
                // viem's `smartAccount` has `signUserOperation` which takes Partial<UserOp>.

                // Get dynamic nonce
                const nonce = await smartAccount.getNonce();
                console.log("[SendMoney Cross] Triggering 7702 Flow with nonce:", nonce);

                // Let's attempt to use `signUserOperation` but providing all gas values to skip estiamtion?
                const userOpRequest = {
                    callData: executeCallData,
                    callGasLimit,
                    verificationGasLimit,
                    preVerificationGas,
                    maxFeePerGas: BigInt(0), // [FIX] Gasless: User pays 0. Relayer pays tx gas.
                    maxPriorityFeePerGas: BigInt(0), // [FIX] Gasless
                    nonce, // [FIX] Dynamic Nonce
                    signature: "0x" as `0x${string}`,
                    initCode: "0x" as `0x${string}`
                };


                // Let's attempt to use `signUserOperation` but providing all gas values to skip estiamtion?
                const signature = await smartAccount.signUserOperation(userOpRequest);

                const userOp = {
                    ...userOpRequest,
                    sender: address as Address,
                    signature: signature
                };

                console.log("[SendMoney Cross] Generated UserOp:", userOp);
                // Serialize UserOp
                const serializedUserOp = serializeBigInt(userOp);

                console.log("[SendMoney Cross] Serialized UserOp:", serializedUserOp);

                const serializedAuthorization = serializeBigInt(authorization);

                // 2. Call Bridge Settle API directly
                const response = await axios.post("/api/bridge/settle", {
                    sourceChain: data.sourceChain,
                    destChain: data.destChain, // Keep original chain key
                    sourceToken: sourceToken,
                    destToken: data.destToken,
                    amount: finalAmount, // Amount + Fee
                    recipient: data.recipient,
                    senderAddress: address,
                    paymentPayload: {
                        authorization: serializedAuthorization,
                        userOp: serializedUserOp, // [NEW] Pass UserOp
                        type: "7702"
                    }
                });


                // Success! matches executeTransfer result shape
                const result = {
                    success: true,
                    transactionHash: response.data.transactionHash,
                    netAmount: response.data.netAmount,
                    fee: "0" // Relayer paid gas
                };

                toast.success(`Transfer exitoso! TX: ${result.transactionHash?.slice(0, 10)}...`);
                // Save to DB
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
                                txHash: result.transactionHash
                            }
                        ],
                        estimatedReceived: simulationRef.current.estimated ? parseFloat(simulationRef.current.estimated) : amount
                    };
                    await transactionsApi.create(txData as unknown as CreateTransactionRequest);
                } catch (dbError) {
                    console.error("Failed to save transaction to DB:", dbError);
                }

                closeModal();
                return; // EXIT FUNCTION, SKIP STANDARD EXECUTION

            } catch (e: any) {
                console.error("7702 Error:", e);
                toast.error(e.message || "Error en envío Gasless");
                return;
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
                sender: (data.sourceChain === "Stellar" ? mainWallet?.addressStellar : mainWallet?.address) || undefined
            });

            if (result.success) {
                toast.success(`Transfer exitoso! TX: ${result.transactionHash?.slice(0, 10)}...`);

                // Save to DB
                try {
                    const txData = {
                        id: crypto.randomUUID(),
                        fromAddress: address.toLowerCase(), // Normalize to lowercase for index efficiency
                        totalAmount: amount,
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
                        estimatedReceived: simulationRef.current.estimated ? parseFloat(simulationRef.current.estimated) : amount // Use amount if no simulation (Direct/CCTP)
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
        closeModal: handleCloseModal,
        onSubmit: handleSubmit(onSubmit),
    };
};
