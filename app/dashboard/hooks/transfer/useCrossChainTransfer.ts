import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
    AccountAbstraction,
    TransferManager
} from "@1llet.xyz/erc4337-gasless-sdk";
import { parseUnits, Address } from "viem";

// Local Types
import { ChainKey } from "@/app/types/chain";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { useForm } from "react-hook-form";
import { getSmartAccountForChain } from "../useSmartAccount";

// Define BridgeContext based on SDK usage (since it's not exported)
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

    // Initialize SDK Account with PK only (no MetaMask)
    const connectWallet = useCallback(async () => {
        setIsConnecting(true);
        try {
            const config = NETWORKS[watchSourceChain];
            if (!config || !config.evm) throw new Error("Invalid Chain Config or not EVM");

            // Decrypt private key - REQUIRED
            if (!encryptedPrivateKey || !currentPassword || !salt || !iv) {
                throw new Error("Wallet credentials not available. Please unlock your wallet.");
            }

            const privateKey = await decryptPrivateKey(encryptedPrivateKey, currentPassword, salt, iv) as `0x${string}`;

            // Use helper to get Smart Account
            const saResult = await getSmartAccountForChain(watchSourceChain, privateKey);

            if (!saResult) {
                throw new Error("Failed to initialize Smart Account");
            }

            const { account, smartAccountAddress: saAddress, isDeployed: deployed } = saResult;

            setSmartAccount(account);
            setSmartAccountAddress(saAddress);
            setIsDeployed(deployed);

            // Store in global state
            const chainId = config.evm.chain.id.toString();
            storeSetSmartAccount(chainId, saAddress, deployed);

            console.log(`[SDK] Connected. Smart Account: ${saAddress}, Deployed: ${deployed}`);

            return account;
        } catch (e: any) {
            console.error("Connection Failed:", e);
            toast.error("Error connecting wallet: " + e.message);
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, [watchSourceChain, encryptedPrivateKey, currentPassword, salt, iv, storeSetSmartAccount]);

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

        // Connect if not connected
        if (!account) {
            toast.info("Connecting wallet...");
            account = await connectWallet();
            if (!account) return;
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
                senderAddress: smartAccountAddress || undefined
            };

            const response = await transferManager.execute(context);

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
        maxAmount: 0,
        minAmount: 0,
        balance: 0,
        fee: "0",
        total: "0",
        simulation: { done: true, error: null, loading: false, estimated: "0" },
        simulateTransfer: async () => { },
        tokenPrice: 0,
        destTokenPrice: 0,
        routeError: null,
        error: null
    };
};
