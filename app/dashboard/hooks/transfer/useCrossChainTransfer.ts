import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import {
    AccountAbstraction,
    TransferManager
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
import { useWalletClient } from "wagmi";

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
    const { setSmartAccount: storeSetSmartAccount } = useXOWalletStore();
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
    const { data: walletClient } = useWalletClient();

    // Initialize SDK Account with PK only (no MetaMask)
    const connectWallet = useCallback(async () => {
        setIsConnecting(true);
        try {
            const config = NETWORKS[watchSourceChain];
            if (!config || !config.evm) throw new Error("Invalid Chain Config or not EVM");

            // 1. Priority: Try Wagmi WalletClient first
            if (walletClient) {
                console.log("[connectWallet] Using Wagmi WalletClient...");

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
            }

            // 2. Fallback: Local Private Key
            // Decrypt private key - REQUIRED
            if (!encryptedPrivateKey || !currentPassword || !salt || !iv) {
                // throw new Error("Wallet credentials not available. Please unlock your wallet.");
                // Allow "simulated" connection if just fetching balance for EOA? 
                // But this function specifically connects the SA.
                // I'll leave the error but maybe catch it silently if we just want EOA.
            }

            if (encryptedPrivateKey && currentPassword && salt && iv) {
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
            // toast.error("Error connecting wallet: " + e.message); 
            // Suppress toast if just auto-connecting? Or keep it?
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, [watchSourceChain, encryptedPrivateKey, currentPassword, salt, iv, storeSetSmartAccount]);

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

            if (amt <= 0) {
                setSimulation({ done: true, error: null, loading: false, estimated: "0" });
                setFee("0");
                setTransferTotal("0");
                return;
            }

            // Calculate Fee (default to USDC 6 decimals logic for now)
            const feeBig = calculateFee();
            // Assuming 6 decimals for stablecoins (USDC/USDT)
            const feeVal = formatUnits(feeBig, 6);
            const feeNum = parseFloat(feeVal);

            const estimated = amt - feeNum;

            setFee(feeVal);
            setTransferTotal(amtStr);
            setSimulation({
                done: true,
                error: null,
                loading: false,
                estimated: estimated > 0 ? estimated.toFixed(6) : "0"
            });
        }
        simulate();
    }, [watch("amount"), watchSourceChain]);

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

            // 3. Execute transfer
            toast.info("Executing transfer...");
            const context: BridgeContext = {
                sourceChain: data.sourceChain,
                destChain: data.destChain,
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
