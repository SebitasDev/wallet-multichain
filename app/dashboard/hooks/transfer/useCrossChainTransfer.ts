import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import {
    AccountAbstraction,
    TransferManager,
    getNearSimulation
} from "@1llet.xyz/erc4337-gasless-sdk";
import { parseUnits, Address, formatUnits, createWalletClient, custom, http } from "viem";
import { erc20Abi } from "@1llet.xyz/erc4337-gasless-sdk";

// Local Types
import { ChainKey } from "@/app/types/chain";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { useForm } from "react-hook-form";
import { getSmartAccountForChain, useSmartAccount as useSmartAccountHook } from "../useSmartAccount";
import { getBalanceFromChain } from "@/app/hooks/useGetBalanceFromChain";
import { useWalletClient, useConnect, useAccount, useSwitchChain } from "wagmi";

// Define BridgeContext based on SDK usage (since it's not exported)
import { calculateFee } from "@/app/facilitator";
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
    const { crossChainOpen: open, openCrossChain: setOpen, closeCrossChain: closeModal } = useDashboardModalsStore();

    // SDK Instances
    const [smartAccount, setSmartAccount] = useState<AccountAbstraction | null>(null);
    const [transferManager] = useState(() => new TransferManager());
    const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
    const [isDeployed, setIsDeployed] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    // Loading States
    const [isConnecting, setIsConnecting] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    // Store Access
    const encryptedPrivateKey = useXOWalletStore(s => s.mainWallet.encryptedPrivateKey);
    const salt = useXOWalletStore(s => s.mainWallet.salt);
    const iv = useXOWalletStore(s => s.mainWallet.iv);
    const { setSmartAccount: storeSetSmartAccount, connectionMode } = useXOWalletStore();
    const currentPassword = useWalletPasswordStore((s) => s.currentPassword);

    // Form
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
    const watchSourceChain = watch("sourceChain");
    const watchDestChain = watch("destChain");

    // Wagmi Wallet Client
    // We explicitly request the client for the selected source chain to avoid mismatch issues
    const currentChainConfig = NETWORKS[watchSourceChain];
    const { data: walletClient, refetch: refetchWalletClient } = useWalletClient({
        chainId: currentChainConfig?.evm?.chain?.id
    });

    const { connectAsync, connectors } = useConnect();
    const { isConnected } = useAccount();
    const { switchChainAsync } = useSwitchChain();

    // Initialize SDK Account with Mode Enforcement
    const connectWallet = useCallback(async () => {
        setIsConnecting(true);
        try {
            const config = NETWORKS[watchSourceChain];
            if (!config || !config.evm) throw new Error("Invalid Chain Config or not EVM");

            // MODE 1: MetaMask (Strict)
            if (connectionMode === 'metamask') {
                let activeClient = walletClient;

                // If client is missing, try to reconnect explicitly
                if (!activeClient) {
                    console.warn("[connectWallet] MetaMask mode: Client missing. Attempting restoration...", { isConnected });

                    try {
                        // 1. Try connecting again (handles hydration/state issues)
                        if (!isConnected) {
                            const injected = connectors.find(c => c.id === 'injected') || connectors[0];
                            if (injected) {
                                await connectAsync({ connector: injected });
                            }
                        }

                        // 2. Refetch client after connection attempt
                        const { data } = await refetchWalletClient();
                        activeClient = data;

                    } catch (reconnectError) {
                        console.error("[connectWallet] Restoration failed:", reconnectError);
                    }
                }

                // 3. Fallback: Direct Viem Client (Bypass Wagmi if stuck)
                if (!activeClient && typeof window !== 'undefined' && window.ethereum) {
                    console.log("[connectWallet] Wagmi failed. Creating direct fallback client...");
                    try {
                        // Must request account first
                        // @ts-ignore
                        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as any[];
                        const account = accounts[0];

                        activeClient = createWalletClient({
                            account,
                            chain: config.evm.chain,
                            transport: custom(window.ethereum as any)
                        }) as any;
                    } catch (directErr) {
                        console.error("[connectWallet] Direct fallback failed:", directErr);
                    }
                }

                if (!activeClient) {
                    // Explicit user guidance
                    throw new Error("MetaMask connection lost. Please click 'Reconnect' in the wallet menu.");
                }

                console.log("[connectWallet] Mode: MetaMask - Using WalletClient...");

                // Force Chain Switch if needed
                const targetChainId = config.evm.chain.id;
                const currentChainId = await activeClient.getChainId();

                if (currentChainId !== targetChainId) {
                    console.log(`[connectWallet] Chain Mismatch (Current: ${currentChainId}, Target: ${targetChainId}). Switching...`);
                    try {
                        await switchChainAsync({ chainId: targetChainId });
                        // Refetch client after switch to ensure correct context
                        const { data } = await refetchWalletClient();
                        if (data) activeClient = data;
                    } catch (switchError) {
                        console.error("Failed to switch chain:", switchError);
                        throw new Error(`Please switch your wallet to ${watchSourceChain} to proceed.`);
                    }
                }

                const saResult = await getSmartAccountForChain(watchSourceChain, activeClient);
                if (saResult) {
                    const { account, smartAccountAddress: saAddress, isDeployed: deployed } = saResult;
                    setSmartAccount(account);
                    setSmartAccountAddress(saAddress);
                    setIsDeployed(deployed);
                    const chainId = config.evm.chain.id.toString();
                    storeSetSmartAccount(chainId, saAddress, deployed);
                    return { account, address: saAddress };
                }
                throw new Error("Failed to initialize Smart Account with MetaMask");
            }

            // MODE 2: Local (Strict)
            if (connectionMode === 'local') {
                if (!encryptedPrivateKey || !currentPassword || !salt || !iv) {
                    throw new Error("Local Wallet locked or missing credentials");
                }
                console.log("[connectWallet] Mode: Local - Using Private Key...");

                const privateKey = await decryptPrivateKey(encryptedPrivateKey, currentPassword, salt, iv) as `0x${string}`;
                const saResult = await getSmartAccountForChain(watchSourceChain, privateKey);

                if (saResult) {
                    const { account, smartAccountAddress: saAddress, isDeployed: deployed } = saResult;
                    setSmartAccount(account);
                    setSmartAccountAddress(saAddress);
                    setIsDeployed(deployed);
                    const chainId = config.evm.chain.id.toString();
                    storeSetSmartAccount(chainId, saAddress, deployed);
                    return { account, address: saAddress };
                }
                throw new Error("Failed to initialize Smart Account with Local Key");
            }

            // MODE 3: Auto/Fallback (Legacy behavior if no mode set)
            console.log("[connectWallet] Mode: Auto/Fallback check", { connectionMode, hasWalletClient: !!walletClient, isWagmiConnected: isConnected });

            // 1. Priority: Try Wagmi WalletClient first
            if (walletClient) {
                console.log("[connectWallet] Mode: Auto - Using Wagmi WalletClient...");

                const saResult = await getSmartAccountForChain(watchSourceChain, walletClient);
                if (saResult) {
                    const { account, smartAccountAddress: saAddress, isDeployed: deployed } = saResult;
                    setSmartAccount(account);
                    setSmartAccountAddress(saAddress);
                    setIsDeployed(deployed);
                    const chainId = config.evm.chain.id.toString();
                    storeSetSmartAccount(chainId, saAddress, deployed);
                    return { account, address: saAddress };
                }
            } else if (isConnected) {
                // If Wagmi is connected but client missing, try refetch
                console.log("[connectWallet] Mode: Auto - Wagmi connected but client missing. Startup refetch...");
                const { data: refetchedClient } = await refetchWalletClient();

                if (refetchedClient) {
                    const saResult = await getSmartAccountForChain(watchSourceChain, refetchedClient);
                    if (saResult) {
                        const { account, smartAccountAddress: saAddress, isDeployed: deployed } = saResult;
                        setSmartAccount(account);
                        setSmartAccountAddress(saAddress);
                        setIsDeployed(deployed);
                        const chainId = config.evm.chain.id.toString();
                        storeSetSmartAccount(chainId, saAddress, deployed);
                        return { account, address: saAddress };
                    }
                }

                // If we are connected to Wagmi, WE SHOULD NOT FALLBACK TO LOCAL without user intent.
                // It confuses the user who thinks they are using MetaMask.
                console.warn("[connectWallet] Wagmi connected but client failed. proceeding to local fallback as requested.");
                // throw new Error("MetaMask is connected but not ready. Please refresh or reconnect.");
            }

            // 2. Fallback: Local Private Key
            // Only if Wagmi is NOT connected and no walletClient
            if (!walletClient && encryptedPrivateKey && currentPassword && salt && iv) {
                console.log("[connectWallet] Mode: Auto - Fallback to Local...");
                const privateKey = await decryptPrivateKey(encryptedPrivateKey, currentPassword, salt, iv) as `0x${string}`;
                const saResult = await getSmartAccountForChain(watchSourceChain, privateKey);

                if (saResult) {
                    const { account, smartAccountAddress: saAddress, isDeployed: deployed } = saResult;
                    setSmartAccount(account);
                    setSmartAccountAddress(saAddress);
                    setIsDeployed(deployed);
                    const chainId = config.evm.chain.id.toString();
                    storeSetSmartAccount(chainId, saAddress, deployed);
                    return { account, address: saAddress };
                }
            }
            return null;

        } catch (e: any) {
            console.error("Connection Failed:", e);
            toast.error("Error connecting wallet: " + e.message);
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, [watchSourceChain, encryptedPrivateKey, currentPassword, salt, iv, storeSetSmartAccount, connectionMode, walletClient]);

    // React to Mode/Chain/Wallet changes to keep local instance fresh
    useEffect(() => {
        console.log("[useCrossChainTransfer] Context changed, resetting Smart Account instance...", {
            mode: connectionMode,
            chain: watchSourceChain,
            client: !!walletClient
        });

        // 1. Reset current instance to avoid using stale signer
        setSmartAccount(null);
        setSmartAccountAddress(null);
        setIsDeployed(false);

        // 2. Attempt to re-connect automatically with new context
        // This ensures subsequent submits use the correct signer
        const reInit = async () => {
            await connectWallet();
        };
        reInit();

    }, [connectionMode, watchSourceChain, walletClient, connectWallet]);

    // [NEW] Balance Fetching
    const { getActiveAddress } = useXOWalletStore();
    const ownerAddress = getActiveAddress();
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        const fetchBalance = async () => {
            const config = NETWORKS[watchSourceChain];
            const tokenName = watch("sourceToken");
            const asset = config?.assets?.find(a => a.name === tokenName);
            // Priority: EOA -> Smart Account
            const addressToUse = ownerAddress || smartAccountAddress;

            console.log("[BalanceDebug] Params:", {
                chain: watchSourceChain,
                token: tokenName,
                addressToUse,
                ownerAddress,
                smartAccountAddress,
                hasConfig: !!config,
                hasAsset: !!asset
            });

            if (config?.evm && asset && addressToUse) {
                try {
                    const res = await getBalanceFromChain(
                        config.evm.chain,
                        addressToUse as `0x${string}`,
                        asset.address as `0x${string}`,
                        asset.decimals
                    );
                    console.log("[BalanceDebug] Result:", res);
                    if (!res.error) {
                        setBalance(parseFloat(res.balance));
                    }
                } catch (e) {
                    console.error("Balance fetch error:", e);
                }
            } else {
                console.log("[BalanceDebug] Conditions not met");
                setBalance(0);
            }
        }
        fetchBalance();
    }, [watchSourceChain, watch("sourceToken"), ownerAddress, smartAccountAddress]);

    // Simulation Logic
    const [simulation, setSimulation] = useState({ done: true, error: null, loading: false, estimated: "0" });
    const [fee, setFee] = useState("0");
    const [transferTotal, setTransferTotal] = useState("0");

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
                console.log("[Simulation] Requesting quote...", { srcChain, dstChain, amtStr, dstToken, srcToken });

                // Normalization for SDK
                const normalizeChain = (chain: string) => chain === "GNOSIS" ? "Gnosis" : chain;

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
                        normalizeChain(srcChain) as any,
                        normalizeChain(dstChain) as any,
                        amtStr,
                        dstToken,
                        srcToken
                    );
                }

                console.log("[Simulation] Result:", result);

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
                    console.warn("[Simulation] Returned failure or missing data", result);
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

        // Debounce could be added here if needed, but for now direct call
        const timer = setTimeout(() => {
            simulate();
        }, 500);

        return () => clearTimeout(timer);

    }, [watch("amount"), watch("sourceChain"), watch("destChain"), watch("sourceToken"), watch("destToken")]);

    // Deploy Smart Account if needed
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

    // Approve token if needed
    const approveToken = useCallback(async (tokenAddress: Address, amount: bigint) => {
        if (!smartAccount) {
            toast.error("Connect wallet first");
            return false;
        }

        setIsApproving(true);
        try {
            const currentAllowance = await smartAccount.getAllowance(tokenAddress);

            if (currentAllowance >= amount) {
                console.log("[SDK] Sufficient allowance exists");
                return true;
            }

            console.log("[SDK] Approving token...");
            const config = NETWORKS[watchSourceChain];
            const spender = config?.evm?.paymasterAddress as Address || tokenAddress;

            const result = await smartAccount.approveToken(tokenAddress, spender, amount * BigInt(2));
            console.log("[SDK] Approval result:", result);
            toast.success("Token approved!");
            return true;
        } catch (e: any) {
            console.error("Approval Failed:", e);
            toast.error("Approval failed: " + e.message);
            return false;
        } finally {
            setIsApproving(false);
        }
    }, [smartAccount, watchSourceChain]);

    // Execute Transfer via SDK with auto deploy and approve
    const onSubmit = async (data: FormValues) => {
        let account = smartAccount;
        let senderAddr = smartAccountAddress;

        // Connect if not connected
        if (!account) {
            toast.info("Connecting wallet...");
            const result = await connectWallet();
            if (!result) return;
            account = result.account;
            senderAddr = result.address;
        }

        if (!account || !senderAddr) {
            toast.error("Failed to resolve wallet address");
            return;
        }

        setIsExecuting(true);
        try {
            const config = NETWORKS[data.sourceChain];
            if (!config?.evm) {
                throw new Error("Invalid source chain");
            }

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
            // Normalization for SDK
            const normalizeChain = (chain: string) => chain === "GNOSIS" ? "Gnosis" : chain;

            // 3. Execute transfer
            toast.info("Executing transfer...");
            const context: BridgeContext = {
                sourceChain: normalizeChain(data.sourceChain) as any,
                destChain: normalizeChain(data.destChain) as any,
                sourceToken: data.sourceToken,
                destToken: data.destToken,
                amount: data.amount,
                recipient: data.recipient,
                senderAddress: senderAddr,
                facilitatorPrivateKey: process.env.NEXT_PUBLIC_FACILITATOR_PRIVATE_KEY,
            };

            console.log("[Transfer] Context:", context);

            let response = await transferManager.execute(context);

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
                response = await transferManager.execute(context);
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

        // Compatibility Props for SimpleSwapModal
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
