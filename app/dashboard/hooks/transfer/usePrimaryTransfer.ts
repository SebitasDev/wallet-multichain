import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { TransferManager } from "@1llet.xyz/erc4337-gasless-sdk";
import { parseUnits, Address } from "viem";
import { ChainKey } from "@/app/types/chain";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { useDashboardModalsStore } from "@/app/dashboard/store/useDashboardModalsStore";
import { useForm } from "react-hook-form";
import { getBalanceFromChain } from "@/app/hooks/useGetBalanceFromChain";
import { useStellarLogic } from "./useStellarLogic";
import { useTransferConnection } from "./useTransferConnection";
import { useTransferSimulation } from "./useTransferSimulation";

export const STELLAR_CHAIN_KEY = "Stellar";

export type FormValues = {
    sourceChain: ChainKey;
    destChain: ChainKey;
    recipient: string;
    amount: string;
    sourceToken: string;
    destToken: string;
};

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


export const usePrimaryTransfer = () => {
    // 1. External Store & Hooks Access
    const { crossChainOpen: open, openCrossChain: setOpen, closeCrossChain: closeModal } = useDashboardModalsStore();
    const { getActiveAddress } = useXOWalletStore();

    // 2. Form Setup
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
    const watchAmount = watch("amount");
    const watchSourceToken = watch("sourceToken");
    const watchDestToken = watch("destToken");

    // 3. Custom Hooks
    const {
        smartAccount,
        smartAccountAddress,
        isDeployed,
        isDeploying,
        isApproving,
        isConnecting,
        connectWallet,
        deploySmartAccount,
        approveToken,
        walletClient,
        setSmartAccount,
        setSmartAccountAddress,
        setIsDeployed
    } = useTransferConnection(watchSourceChain);

    const {
        executeStellarTransfer,
        fetchStellarBalance
    } = useStellarLogic();

    const {
        simulation,
        fee,
        transferTotal
    } = useTransferSimulation(watchAmount, watchSourceChain, watchDestChain, watchSourceToken, watchDestToken);

    // 4. Local State
    const [transferManager] = useState(() => new TransferManager());
    const [isExecuting, setIsExecuting] = useState(false);
    const [balance, setBalance] = useState(0);
    const ownerAddress = getActiveAddress();

    // 5. Effects

    // Reset/Re-init on context change
    // Reset/Re-init on context change
    const [lastInitChain, setLastInitChain] = useState<ChainKey | null>(null);

    useEffect(() => {
        // Only re-init if chain actually changed
        if (watchSourceChain === lastInitChain) return;

        setSmartAccount(null);
        setSmartAccountAddress(null);
        setIsDeployed(false);
        setLastInitChain(watchSourceChain);

        const reInit = async () => {
            await connectWallet();
        };
        reInit();

    }, [watchSourceChain, lastInitChain, connectWallet, setSmartAccount, setSmartAccountAddress, setIsDeployed]);

    // Balance Fetching
    useEffect(() => {
        const fetchBalance = async () => {
            // [NEW] Stellar Balance
            if (watchSourceChain === "Stellar") {
                if (smartAccountAddress && smartAccountAddress.startsWith("G")) {
                    const bal = await fetchStellarBalance(smartAccountAddress);
                    setBalance(bal);
                    return;
                }
                setBalance(0);
                return;
            }

            const config = NETWORKS[watchSourceChain];
            const tokenName = watchSourceToken;
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
    }, [watchSourceChain, watchSourceToken, ownerAddress, smartAccountAddress, fetchStellarBalance]);


    // 6. Main Submit Logic
    const onSubmit = async (data: FormValues) => {
        let account = smartAccount;
        let senderAddr = smartAccountAddress;

        // Connect if not connected
        if (!senderAddr) {
            console.log("Auto-connecting wallet for transfer...");
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
            // Stellar Execution
            if (data.sourceChain === "Stellar") {
                const txHash = await executeStellarTransfer(data, senderAddr);
                toast.success(`Transfer Successful! TX: ${txHash}`);
                closeModal();
                reset();
                return;
            }

            // EVM Execution
            const config = NETWORKS[data.sourceChain];
            if (!config?.evm) throw new Error("Invalid source chain");
            if (!account) throw new Error("Smart Account not initialized for EVM chain");

            // Deploy
            if (!(await account.isAccountDeployed())) {
                toast.info("Deploying Smart Account...");
                if (!(await deploySmartAccount())) throw new Error("Failed to deploy Smart Account");
            }

            // Approve
            const tokenAsset = config.assets.find(a => a.name === data.sourceToken);
            const tokenAddress = tokenAsset?.address as Address;

            if (tokenAddress && tokenAddress !== "0x0000000000000000000000000000000000000000") {
                const tokenDecimals = tokenAsset?.decimals || 6;
                const amountBigInt = parseUnits(data.amount, tokenDecimals);
                const approveSuccess = await approveToken(tokenAddress, amountBigInt);
                if (!approveSuccess) console.warn("Approval warning");
            }

            // Execute
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

            let response = await transferManager.execute(context as any);

            // Handle Pending Deposit
            if (response.transactionHash && response.transactionHash.includes("PENDING_USER_DEPOSIT")) {
                toast.info("Signing deposit transaction...");
                const { depositAddress, amountToDeposit } = response.data;
                if (!depositAddress || !amountToDeposit) throw new Error("Invalid deposit data");

                // @ts-ignore
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
                        // @ts-ignore
                        txHash = transferResult.receipt?.transactionHash;
                    }
                }

                if (!txHash) throw new Error("Unknown transfer result format");
                toast.info("Deposit sent! Finalizing bridge...");

                context.depositTxHash = txHash;
                response = await transferManager.execute(context as any);
            }

            // Handle Direct Transfer
            if (response.success && response.transactionHash === "DIRECT_TRANSFER_REQUIRED") {
                toast.info("Signing direct transfer...");
                const config = NETWORKS[data.sourceChain];
                const tokenAsset = config?.assets.find(a => a.name === data.sourceToken);
                if (!tokenAsset) throw new Error("Token asset not found");

                // @ts-ignore
                const sendResult = await account.smartTransfer(
                    tokenAsset.address as Address,
                    data.recipient as Address,
                    parseUnits(data.amount, tokenAsset.decimals)
                );

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

                if (!realTxHash) throw new Error("Failed to retrieve transaction hash");

                toast.success(`Transfer Successful! TX: ${realTxHash}`);
                closeModal();
                reset();
                return;
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
        watchAmount,
        watchSourceToken,
        watchDestToken,
        isCrossChain: watchSourceChain !== watchDestChain,
        isCCTPRoute: false,
        isExceedingMax: false,
        isAmountValid: true,
        maxAmount: balance,
        minAmount: 0,
        balance,
        fee,
        total: transferTotal,
        simulation,
        simulateTransfer: async () => { },
        tokenPrice: 0,
        destTokenPrice: 0,
        routeError: null,
        error: null
    };
};
