import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import {
    AccountAbstraction,
    TransferManager,
    getNearSimulation
} from "@1llet.xyz/erc4337-gasless-sdk";
import { parseUnits, Address, createWalletClient, custom, encodeFunctionData, parseAbi, maxUint256 } from "viem";
import { ChainKey } from "@/app/types/chain";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { useForm } from "react-hook-form";
import { getSmartAccountForChain, ensureTokenApproval } from "../useSmartAccount";
import { getBalanceFromChain } from "@/app/hooks/useGetBalanceFromChain";
import { useWalletClient, useConnect, useSwitchChain, useConnectors, useConnections, usePublicClient } from "wagmi";
import { getStellarUSDCBalance } from "@/app/lib/stellar/getStellarUSDCBalance";
import { getOneClickQuote, submitTxHash } from "@/app/stellar-transfer-core/sdk-service";
import { StellarService } from "@1llet.xyz/erc4337-gasless-sdk";
import { Keypair } from "stellar-sdk";

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

export const STELLAR_CHAIN_KEY = "Stellar";

export type FormValues = {
    sourceChain: ChainKey;
    destChain: ChainKey;
    recipient: string;
    amount: string;
    sourceToken: string;
    destToken: string;
};

export const useCrossChainTransfer = () => {
    // 1. External Store & Hooks Access
    const { crossChainOpen: open, openCrossChain: setOpen, closeCrossChain: closeModal } = useDashboardModalsStore();
    const { setSmartAccount: storeSetSmartAccount, connectionMode, getActiveAddress } = useXOWalletStore();

    const encryptedPrivateKey = useXOWalletStore(s => s.mainWallet.encryptedPrivateKey);
    const encryptedPrivateKeyStellar = useXOWalletStore(s => s.mainWallet.encryptedPrivateKeyStellar);
    const addressStellar = useXOWalletStore(s => s.mainWallet.addressStellar);
    const salt = useXOWalletStore(s => s.mainWallet.salt);
    const iv = useXOWalletStore(s => s.mainWallet.iv);
    const currentPassword = useWalletPasswordStore((s) => s.currentPassword);

    // Wagmi Hooks
    const publicClient = usePublicClient();
    const connectors = useConnectors();
    const connections = useConnections();
    const { mutateAsync: connectAsync } = useConnect();
    const isConnected = connections.length > 0;
    const { mutateAsync: switchChainAsync } = useSwitchChain();

    // Form Setup
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

    const { watch, reset, handleSubmit } = form;
    const watchSourceChain = watch("sourceChain");
    const watchDestChain = watch("destChain");

    // Wallet Client Setup
    const currentChainConfig = NETWORKS[watchSourceChain];
    const { data: walletClient, refetch: refetchWalletClient } = useWalletClient({
        chainId: currentChainConfig?.evm?.chain?.id
    });

    // 2. Local State Definitions
    // SDK Instances
    const [smartAccount, setSmartAccount] = useState<AccountAbstraction | null>(null);
    const [transferManager] = useState(() => new TransferManager());
    const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);

    // Status Flags
    const [isDeployed, setIsDeployed] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    // Data State
    const [simulation, setSimulation] = useState({ done: true, error: null, loading: false, estimated: "0" });
    const [fee, setFee] = useState("0");
    const [transferTotal, setTransferTotal] = useState("0");
    const [balance, setBalance] = useState(0);
    const ownerAddress = getActiveAddress();

    // 3. Main Logic Functions
    const connectWallet = useCallback(async () => {
        setIsConnecting(true);
        try {
            // [NEW] Stellar Logic Branch
            if (watchSourceChain === "Stellar") {
                if (!encryptedPrivateKeyStellar || !currentPassword || !salt || !iv) {
                    throw new Error("Wallet locked. Please unlock to use Stellar.");
                }

                if (!addressStellar) {
                    throw new Error("Stellar wallet not initialized.");
                }

                // Use the correctly derived address from the store
                const publicKey = addressStellar;

                setSmartAccount(null); // No Smart Account for Stellar
                setSmartAccountAddress(publicKey); // Use Stellar Public Key as "Address"
                setIsDeployed(true); // Always "deployed" (active) conceptually

                return { account: null, address: publicKey };
            }

            // [EXISTING] EVM Logic
            const config = NETWORKS[watchSourceChain];
            if (!config || !config.evm) throw new Error("Invalid Chain Config or not EVM");

            // Helper to avoid repetition
            const updateState = (result: any) => {
                const { account, smartAccountAddress: saAddress, isDeployed: deployed } = result;
                setSmartAccount(account);
                setSmartAccountAddress(saAddress);
                setIsDeployed(deployed);
                const chainId = config.evm?.chain.id.toString() || "0";
                storeSetSmartAccount(chainId, saAddress, deployed);
                return { account, address: saAddress };
            };

            // --- MODE 1: MetaMask ---
            if (connectionMode === 'metamask') {
                let activeClient = walletClient;

                // 1. Recover Client if missing
                if (!activeClient) {
                    try {
                        if (!isConnected) {
                            const injected = connectors.find(c => c.id === 'injected') || connectors[0];
                            if (injected) await connectAsync({ connector: injected });
                        }
                        const { data } = await refetchWalletClient();
                        activeClient = data;
                    } catch (e) {
                        // Silent fail on restoration, try direct next
                    }
                }

                // 2. Direct Fallback (Bypass Wagmi issues)
                if (!activeClient && typeof window !== 'undefined' && window.ethereum) {
                    try {
                        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as any[];
                        if (accounts[0]) {
                            activeClient = createWalletClient({
                                account: accounts[0],
                                chain: config.evm.chain,
                                transport: custom(window.ethereum as any)
                            }) as any;
                        }
                    } catch (e) { console.error("Direct fallback failed", e); }
                }

                if (!activeClient) throw new Error("MetaMask connection lost. Please reconnect.");

                // 3. Enforce Network Switch
                const targetChainId = config.evm.chain.id;
                const currentChainId = await activeClient.getChainId();

                if (currentChainId !== targetChainId) {
                    try {
                        await switchChainAsync({ chainId: targetChainId });
                        const { data } = await refetchWalletClient();
                        if (data) activeClient = data;
                    } catch (e) {
                        throw new Error(`Please switch to ${watchSourceChain} to proceed.`);
                    }
                }

                // 4. Init Smart Account
                const saResult = await getSmartAccountForChain(watchSourceChain, activeClient);
                if (saResult) return updateState(saResult);
                throw new Error("Failed to initialize Smart Account with MetaMask");
            }

            // --- MODE 2: Local ---
            if (connectionMode === 'local') {
                if (!encryptedPrivateKey || !currentPassword || !salt || !iv) {
                    throw new Error("Local Wallet locked or missing credentials");
                }
                const privateKey = await decryptPrivateKey(encryptedPrivateKey, currentPassword, salt, iv) as `0x${string}`;
                const saResult = await getSmartAccountForChain(watchSourceChain, privateKey);
                if (saResult) return updateState(saResult);
                throw new Error("Failed to initialize with Local Key");
            }

            // --- MODE 3: Auto/Fallback (Legacy) ---
            // Priority: Wagmi
            if (walletClient) {
                const saResult = await getSmartAccountForChain(watchSourceChain, walletClient);
                if (saResult) return updateState(saResult);
            }

            // Wagmi Connected but missing client -> Try Refetch
            else if (isConnected) {
                const { data: refetched } = await refetchWalletClient();
                if (refetched) {
                    const saResult = await getSmartAccountForChain(watchSourceChain, refetched);
                    if (saResult) return updateState(saResult);
                }
                // Don't fallback to local here to avoid user confusion
                console.warn("Wagmi connected but client unavailable.");
            }

            // Fallback: Local
            if (!walletClient && encryptedPrivateKey && currentPassword && salt && iv) {
                const privateKey = await decryptPrivateKey(encryptedPrivateKey, currentPassword, salt, iv) as `0x${string}`;
                const saResult = await getSmartAccountForChain(watchSourceChain, privateKey);
                if (saResult) return updateState(saResult);
            }

            return null;

        } catch (e: any) {
            console.error("Connection Failed:", e);
            toast.error(e.message);
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, [watchSourceChain, encryptedPrivateKey, currentPassword, salt, iv, storeSetSmartAccount, connectionMode, walletClient, isConnected, connectAsync, refetchWalletClient, connectors, switchChainAsync]);

    const deploySmartAccount = useCallback(async () => {
        if (!smartAccount) {
            toast.error("Connect wallet first");
            return false;
        }

        if (isDeployed) {
            return true;
        }

        setIsDeploying(true);
        try {
            console.log("[SDK] Deploying Smart Account...");
            const receipt = await smartAccount.deployAccount();

            if (receipt.success) {
                setIsDeployed(true);
                const config = NETWORKS[watchSourceChain];
                if (config?.evm && smartAccountAddress) {
                    storeSetSmartAccount(config.evm.chain.id.toString(), smartAccountAddress, true);
                }
                toast.success("Smart Account deployed successfully!");
                return true;
            } else {
                throw new Error("Deployment failed");
            }
        } catch (e: any) {
            console.error("Deploy Failed:", e);
            toast.error("Deploy failed: " + e.message);
            return false;
        } finally {
            setIsDeploying(false);
        }
    }, [smartAccount, isDeployed, watchSourceChain, smartAccountAddress, storeSetSmartAccount]);

    const approveToken = useCallback(async (tokenAddress: Address, amount: bigint) => {
        if (!smartAccount) {
            toast.error("Connect wallet first");
            return false;
        }

        setIsApproving(true);
        try {
            const spender = smartAccountAddress as Address;

            return await ensureTokenApproval(smartAccount, tokenAddress, spender, amount, publicClient);
        } catch (e: any) {
            console.error("Approval helper failed:", e);
            toast.error("Approval failed: " + e.message);
            return false;
        } finally {
            setIsApproving(false);
        }
    }, [smartAccount, watchSourceChain]);

    const onSubmit = async (data: FormValues) => {
        let account = smartAccount;
        let senderAddr = smartAccountAddress;

        // Connect if not connected
        if (!senderAddr) {
            toast.info("Connecting wallet...");
            const result = await connectWallet();
            if (!result) return;
            account = result.account;
            senderAddr = result.address;
        }

        if (!senderAddr) {
            toast.error("Failed to resolve wallet address");
            return;
        }

        setIsExecuting(true);
        try {
            // [NEW] Stellar Execution Branch
            if (data.sourceChain === "Stellar") {
                if (!encryptedPrivateKey || !currentPassword || !salt || !iv) {
                    throw new Error("Local Wallet required for Stellar execution.");
                }

                // 1. Get Quote & Deposit Address
                toast.info("Getting One-Click Quote...");
                const { depositAddress, quote } = await getOneClickQuote({
                    amount: data.amount,
                    sourceChain: "Stellar",
                    destinationChain: data.destChain,
                    sourceToken: data.sourceToken, // e.g., 'USDC' or 'XLM'
                    destinationToken: data.destToken,
                    userSenderAddress: senderAddr,
                    recipientStellar: data.recipient // Destination EVM address or otherwise
                });

                if (!depositAddress) throw new Error("Failed to get deposit address from bridge");

                // @ts-ignore - Memo exists on response when depositMode is MEMO
                const memo = quote.quote?.memo;
                if (!memo) throw new Error("Bridge required a memo but none was returned.");
                // 2. Sign & Send Stellar Transaction (via SDK)
                toast.info("Signing Stellar Transaction...");

                if (!encryptedPrivateKeyStellar) throw new Error("Stellar private key not found");

                // Decrypt the stored Stellar secret (which matches the address in the wallet)
                const stellarSecret = await decryptPrivateKey(encryptedPrivateKeyStellar, currentPassword, salt, iv);

                const stellarService = new StellarService();
                const xdr = await stellarService.buildTransferXdr(
                    stellarSecret,
                    depositAddress,
                    data.amount,
                    data.sourceToken,
                    memo
                );

                const result = await stellarService.submitXdr(xdr);
                const txHash = result.hash;

                console.log("[Transfer] Stellar TX Hash:", txHash);

                // 3. Submit Hash
                toast.info("Submitting Transaction Hash...");
                await submitTxHash(txHash, depositAddress);

                toast.success(`Transfer Successful! TX: ${txHash}`);
                closeModal();
                reset();
                return;
            }

            const config = NETWORKS[data.sourceChain];
            if (!config?.evm) {
                throw new Error("Invalid source chain");
            }
            // Ensure Account Logic exists for EVM
            if (!account) throw new Error("Smart Account not initialized for EVM chain");

            // 1. Ensure Smart Account is deployed
            const deployed = await account.isAccountDeployed();
            if (!deployed) {
                toast.info("Deploying Smart Account...");
                const deploySuccess = await deploySmartAccount();
                if (!deploySuccess) {
                    throw new Error("Failed to deploy Smart Account");
                }
            }

            // 2. Check and approve token if needed
            const tokenAsset = config.assets.find(a => a.name === data.sourceToken);
            const tokenAddress = tokenAsset?.address as Address;

            if (tokenAddress && tokenAddress !== "0x0000000000000000000000000000000000000000") {
                const tokenDecimals = tokenAsset?.decimals || 6;
                const amountBigInt = parseUnits(data.amount, tokenDecimals);

                const approveSuccess = await approveToken(tokenAddress, amountBigInt);
                if (!approveSuccess) {
                    console.warn("Approval may have failed, continuing anyway...");
                }
            }



            // 3. Execute transfer
            toast.info("Executing transfer...");
            const context: BridgeContext = {
                sourceChain: data.sourceChain as any,
                destChain: data.destChain as any,
                sourceToken: data.sourceToken,
                destToken: data.destToken,
                amount: data.amount,
                recipient: data.recipient,
                senderAddress: senderAddr,
                facilitatorPrivateKey: process.env.NEXT_PUBLIC_FACILITATOR_PRIVATE_KEY,
            };

            console.log("[Transfer] Context:", context);

            let response = await transferManager.execute(context as any);

            // [NEW] Handle Pending Deposit (CCTP & others)
            if (response.transactionHash && response.transactionHash.includes("PENDING_USER_DEPOSIT")) {
                console.log("[Transfer] Deposit required", response.data);
                toast.info("Signing deposit transaction...");

                const { depositAddress, amountToDeposit } = response.data;

                if (!depositAddress || !amountToDeposit) {
                    throw new Error("Invalid deposit data from SDK");
                }

                // Use SDK Smart Transfer (Auto-detects EOA vs SA balance)
                console.log("[Transfer] Initiating Smart Transfer for Deposit");

                // @ts-ignore - smartTransfer signature handling
                const transferResult = await account.smartTransfer(
                    tokenAddress || "0x0000000000000000000000000000000000000000",
                    depositAddress as Address,
                    BigInt(amountToDeposit)
                );

                // Handle result types (UserOpReceipt or EOA Receipt wrapper)
                let txHash: string = "";
                if (transferResult && typeof transferResult === 'object') {
                    if ('receipt' in transferResult && transferResult.receipt) {
                        txHash = transferResult.receipt.transactionHash;
                    } else if ('transactionHash' in transferResult) {
                        // @ts-ignore
                        txHash = transferResult.transactionHash;
                    } else if ('userOpHash' in transferResult) {
                        // If it returned a UserOpReceipt directly
                        // @ts-ignore
                        txHash = transferResult.receipt?.transactionHash;
                    }
                }

                if (!txHash) {
                    throw new Error("Unknown transfer result format from SDK");
                }

                console.log("[Transfer] Deposit successful:", txHash);
                toast.info("Deposit sent! Finalizing bridge...");

                // Retry execution with hash
                context.depositTxHash = txHash;
                response = await transferManager.execute(context as any);
            }

            // [NEW] Handle Direct Transfer (SDK Signal)
            if (response.success && response.transactionHash === "DIRECT_TRANSFER_REQUIRED") {
                console.log("[TransferManager] Intercepting Direct Transfer Signal...");
                toast.info("Signing direct transfer...");

                try {
                    const config = NETWORKS[data.sourceChain];
                    const tokenAsset = config?.assets.find(a => a.name === data.sourceToken);

                    if (!tokenAsset) throw new Error(`Source token ${data.sourceToken} not found for direct transfer`);
                    if (!data.recipient) throw new Error("Recipient address missing");

                    const amountBigInt = parseUnits(data.amount, tokenAsset.decimals);

                    console.log("[Transfer] Initiating Smart Transfer (Direct) for:", {
                        token: tokenAsset.address,
                        recipient: data.recipient,
                        amount: amountBigInt.toString()
                    });

                    // Use SDK's built-in helper for ERC-20 transfers
                    // @ts-ignore
                    const sendResult = await account.smartTransfer(
                        tokenAsset.address as Address,
                        data.recipient as Address,
                        amountBigInt
                    );

                    console.log("[Transfer] Direct transfer result:", sendResult);

                    // Handle return type (Hash or Receipt)
                    let realTxHash = "";
                    if (sendResult && typeof sendResult === 'object') {
                        if ('receipt' in sendResult && sendResult.receipt) {
                            realTxHash = sendResult.receipt.transactionHash;
                        } else if ('transactionHash' in sendResult) {
                            // @ts-ignore
                            realTxHash = sendResult.transactionHash;
                        } else if ('userOpHash' in sendResult) {
                            // @ts-ignore
                            realTxHash = sendResult.receipt?.transactionHash;
                        }
                    } else if (typeof sendResult === 'string') {
                        realTxHash = sendResult;
                    }

                    if (!realTxHash) {
                        console.error("Invalid Result from SDK:", sendResult);
                        throw new Error("Failed to retrieve transaction hash from direct transfer");
                    }

                    // Update response to reflect real success
                    response.transactionHash = realTxHash;

                    // Show final success toast with real hash
                    toast.success(`Transfer Successful! TX: ${realTxHash}`);
                    closeModal();
                    reset();
                    return;

                } catch (directErr: any) {
                    console.error("[Transfer] Direct Transfer Failed:", directErr);
                    toast.error(`Direct Transfer Failed: ${directErr.message || "Unknown error"}`);
                    return;
                }
            }

            if (response.success) {
                toast.success(`Transfer Successful! TX: ${response.transactionHash}`);
                closeModal();
                reset();
            } else {
                toast.error(`Transfer Failed: ${response.errorReason}`);
            }

        } catch (e: any) {
            console.error("Execution Error:", e);
            toast.error("Execution Error: " + e.message);
        } finally {
            setIsExecuting(false);
        }
    };

    // 4. Effects
    // Reset/Re-init on context change
    useEffect(() => {
        setSmartAccount(null);
        setSmartAccountAddress(null);
        setIsDeployed(false);

        const reInit = async () => {
            await connectWallet();
        };
        reInit();

    }, [connectionMode, watchSourceChain, walletClient, connectWallet]);

    // Balance Fetching
    useEffect(() => {
        const fetchBalance = async () => {
            // [NEW] Stellar Balance
            if (watchSourceChain === "Stellar") {
                // Use smartAccountAddress because it holds the derived Stellar Public Key
                // ownerAddress might still be the EVM address from the connected wallet
                if (smartAccountAddress && smartAccountAddress.startsWith("G")) {
                    try {
                        const bal = await getStellarUSDCBalance(smartAccountAddress);
                        setBalance(bal || 0);
                    } catch (e) {
                        console.error("Stellar balance fetch error", e);
                        setBalance(0);
                    }
                    return;
                }
                // If address is not ready or is EVM address, clear balance to avoid stale display
                setBalance(0);
                return;
            }

            const config = NETWORKS[watchSourceChain];
            const tokenName = watch("sourceToken");
            const asset = config?.assets?.find(a => a.name === tokenName);
            // Priority: EOA -> Smart Account
            const addressToUse = ownerAddress || smartAccountAddress;

            if (config?.evm && asset && addressToUse) {
                try {
                    const res = await getBalanceFromChain(
                        config.evm.chain,
                        addressToUse as `0x${string}`,
                        asset.address as `0x${string}`,
                        asset.decimals
                    );
                    if (!res.error) {
                        setBalance(parseFloat(res.balance));
                    }
                } catch (e) {
                    console.error("Balance fetch error:", e);
                }
            } else {
                setBalance(0);
            }
        }
        fetchBalance();
    }, [watchSourceChain, watch("sourceToken"), ownerAddress, smartAccountAddress]);

    // Simulation
    useEffect(() => {
        const simulate = async () => {
            const amtStr = watch("amount");
            const amt = parseFloat(amtStr || "0");
            const srcChain = watch("sourceChain");
            const dstChain = watch("destChain");
            const srcToken = watch("sourceToken");
            const dstToken = watch("destToken");

            if (amt <= 0) {
                setSimulation({ done: true, error: null, loading: false, estimated: "0" });
                setFee("0");
                setTransferTotal("0");
                return;
            }

            setSimulation(prev => ({ ...prev, loading: true, done: false }));

            try {


                // Check for CCTP Bypass (USDC)
                const srcConfig = NETWORKS[srcChain as ChainKey];
                const dstConfig = NETWORKS[dstChain as ChainKey];

                const isCCTP =
                    (srcToken === 'USDC' && dstToken === 'USDC') &&
                    srcConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                    dstConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;

                let result;
                if (isCCTP) {
                    console.log("[Simulation] CCTP Route detected (1:1), bypassing external quote...");
                    result = {
                        success: true,
                        estimatedReceived: amtStr, // 1:1 for CCTP
                        protocolFee: 0,
                        error: null
                    };
                } else {
                    // Call SDK Simulation
                    result = await getNearSimulation(
                        srcChain as any,
                        dstChain as any,
                        amtStr,
                        dstToken,
                        srcToken
                    );
                }

                if (result.success && result.estimatedReceived) {
                    setFee(result.protocolFee ? result.protocolFee.toString() : "0");
                    setTransferTotal(amtStr);
                    setSimulation({
                        done: true,
                        error: null,
                        loading: false,
                        estimated: result.estimatedReceived
                    });
                } else {
                    // Fallback or Error
                    setSimulation({
                        done: true,
                        error: result.error || "Simulation failed",
                        loading: false,
                        estimated: "0"
                    });
                }

            } catch (e: any) {
                console.error("[Simulation] Error:", e);
                setSimulation({
                    done: true,
                    error: e.message,
                    loading: false,
                    estimated: "0"
                });
            }
        }

        const timer = setTimeout(() => {
            simulate();
        }, 500);

        return () => clearTimeout(timer);

    }, [watch("amount"), watch("sourceChain"), watch("destChain"), watch("sourceToken"), watch("destToken")]);

    return {
        open,
        openModal: setOpen,
        closeModal,
        form,
        watchSourceChain,
        watchDestChain,
        onSubmit: handleSubmit(onSubmit),
        connectWallet,
        deploySmartAccount,
        approveToken,
        isConnecting,
        isExecuting,
        isDeploying,
        isApproving,
        address: smartAccountAddress,
        isDeployed,
        isLoading: isConnecting || isExecuting || isDeploying || isApproving,
        watchAmount: form.watch("amount"),

        // Compatibility Props usage
        watchSourceToken: form.watch("sourceToken"),
        watchDestToken: form.watch("destToken"),
        isCrossChain: watchSourceChain !== watchDestChain,
        isCCTPRoute: false,
        isExceedingMax: false,
        isAmountValid: true,
        maxAmount: balance,
        minAmount: 0,
        balance: balance,
        fee: fee,
        total: transferTotal,
        simulation: simulation,
        simulateTransfer: async () => { },
        tokenPrice: 0,
        destTokenPrice: 0,
        routeError: null,
        error: null
    };
};
