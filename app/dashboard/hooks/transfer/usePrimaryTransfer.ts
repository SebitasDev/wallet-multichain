import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { TransferManager } from "@1llet.xyz/erc4337-gasless-sdk";
import { parseUnits, Address, formatEther, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
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
    destChain: ChainKey | number;
    sourceToken?: string;
    destToken?: string;
    amount: string;
    recipient: string;
    senderAddress?: string;
    facilitatorPrivateKey?: string;
    feeRecipient?: string;
    depositTxHash?: string;
    sourceAA?: any; // Connected SDK AccountAbstraction instance
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
        setIsDeployed,
        publicClient // [NEW]
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

    // [NEW] Separate state for Smart Account Balance for validation
    const [smartAccountBalance, setSmartAccountBalance] = useState(0);

    // Balance Fetching Logic
    const fetchCurrentBalance = async () => {
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

        // We want to fetch both for UX clarity, but UI mainly shows Paying Wallet (SA)
        if (config?.evm && asset && smartAccountAddress) {
            try {
                // 1. Fetch Smart Account Balance (Actual Payer)
                const saRes = await getBalanceFromChain(
                    config.evm.chain,
                    smartAccountAddress as `0x${string}`,
                    asset.address as `0x${string}`,
                    asset.decimals
                );

                // 2. Fetch EOA Balance (For user awareness)
                let eoaBalance = 0;
                if (ownerAddress) {
                    const eoaRes = await getBalanceFromChain(
                        config.evm.chain,
                        ownerAddress as `0x${string}`,
                        asset.address as `0x${string}`,
                        asset.decimals
                    );
                    if (!eoaRes.error) eoaBalance = parseFloat(eoaRes.balance);
                }

                if (!saRes.error) {
                    const saBal = parseFloat(saRes.balance);
                    console.log(`DEBUG: Smart Account (${smartAccountAddress}): ${saBal} ${tokenName}`);
                    console.log(`DEBUG: Main Wallet (${ownerAddress}): ${eoaBalance} ${tokenName}`);

                    setSmartAccountBalance(saBal);

                    // Logic: If SA is empty but EOA has funds, warn user (or just show SA balance)
                    // We will set the main 'balance' state to SA balance because that is what limits the transfer.
                    setBalance(saBal);
                }
            } catch (e) {
                console.error("Balance fetch error:", e);
            }
        } else {
            setBalance(0);
        }
    };

    // Initial Fetch Effect
    useEffect(() => {
        fetchCurrentBalance();
    }, [watchSourceChain, watchSourceToken, ownerAddress, smartAccountAddress, fetchStellarBalance]);


    // 6. Main Submit Logic
    const onSubmit = async (data: FormValues) => {
        let account = smartAccount;
        let senderAddr = smartAccountAddress;

        // Connect if not connected
        if (!senderAddr) {
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
                fetchCurrentBalance();
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

            // [NEW] Relayer Auto-Funding (Source: User Request "deduct from main wallet")
            const RELAYER_KEY = (process.env.NEXT_PUBLIC_FACILITATOR_PRIVATE_KEY || "0x1de32b06cfc2235dbb8655edae07681f051d6eedb38640dcc898af50ebef4bb8") as `0x${string}`;
            const relayerAccount = privateKeyToAccount(RELAYER_KEY);
            const relayerAddress = relayerAccount.address;

            // Check Relayer Balance
            const relayerBalanceWei = await publicClient?.getBalance({ address: relayerAddress });
            const relayerBalanceEth = relayerBalanceWei ? parseFloat(formatEther(relayerBalanceWei)) : 0;

            console.log(`[AutoFund] Relayer Balance: ${relayerBalanceEth} ETH`);

            // If Relayer has less than 0.00008 ETH (~$0.20), fund it
            if (relayerBalanceEth < 0.00008) {
                console.log("[AutoFund] Low Balance. Attempting to fund from Main Wallet...");

                const signer = walletClient || (await connectWallet())?.client;
                if (!signer) throw new Error("Main Wallet not available to fund gas service.");

                const fundAmount = parseEther("0.0001"); // Fund small amount

                try {
                    // Check Main Wallet Balance first
                    // @ts-ignore
                    const mainAddress = signer.account.address;
                    const mainBalance = await publicClient?.getBalance({ address: mainAddress });

                    if (mainBalance && mainBalance > fundAmount) {
                        toast.info("Funding Gas Service from Main Wallet...");
                        // @ts-ignore
                        const hash = await signer.sendTransaction({
                            to: relayerAddress,
                            value: fundAmount,
                            // @ts-ignore
                            account: signer.account,
                            chain: config.evm.chain
                        });

                        toast.info("Funding Sent. Waiting...");
                        await publicClient?.waitForTransactionReceipt({ hash });
                        toast.success("Gas Service Funded!");
                    } else {
                        console.warn("[AutoFund] Main Wallet also low on ETH.");
                    }
                } catch (fundErr) {
                    console.error("[AutoFund] Failed:", fundErr);
                    // Don't block flow, try anyway (maybe gas price dropped)
                }
            }

            // Approve
            const tokenAsset = config.assets.find(a => a.name === data.sourceToken);
            const tokenAddress = tokenAsset?.address as Address;

            if (tokenAddress && tokenAddress !== "0x0000000000000000000000000000000000000000") {
                const tokenDecimals = tokenAsset?.decimals || 6;
                const amountBigInt = parseUnits(data.amount, tokenDecimals);

                // Pre-flight Balance Check & Auto-Deposit
                const amountFloat = parseFloat(data.amount);
                if (smartAccountBalance < amountFloat) {
                    // Start Auto-Deposit Logic
                    console.log("Smart Account insufficient. Checking EOA...");

                    // We need EOA balance again to be sure, or rely on what we have? 
                    // To be safe, let's assume we can fetch it or we rely on the check logic:
                    // We'll trust the user wants to pay from Main Wallet if valid.

                    const signer = walletClient || (await connectWallet())?.client;

                    if (!signer) throw new Error("Main Wallet not connected for deposit");

                    toast.info("Funding Smart Account from Main Wallet...");

                    try {
                        // @ts-ignore
                        const hash = await signer.writeContract({
                            address: tokenAddress,
                            abi: [{
                                name: 'transfer',
                                type: 'function',
                                stateMutability: 'nonpayable',
                                inputs: [
                                    { name: 'to', type: 'address' },
                                    { name: 'amount', type: 'uint256' }
                                ],
                                outputs: [{ name: '', type: 'bool' }]
                            }],
                            functionName: 'transfer',
                            args: [smartAccountAddress as Address, amountBigInt],
                            chain: config.evm.chain,
                            // @ts-ignore
                            account: signer.account
                        });

                        toast.info("Deposit Sent. Waiting for confirmation...");
                        // @ts-ignore
                        await publicClient.waitForTransactionReceipt({ hash });
                        toast.success("Funds Deposited! Proceeding with Bridge...");

                        // Update balance
                        await fetchCurrentBalance();

                    } catch (depositError: any) {
                        const msg = depositError.message || "";
                        if (msg.includes("insufficient funds") || msg.includes("gas") || msg.includes("exceeds the balance")) {

                            console.log("Gasless Protocol: Attempting ERC-3009 Signature...");
                            toast.info("Signing Gasless Authorization...");

                            try {
                                if (!signer) throw new Error("Signer is missing for Gasless Flow");

                                const { createAuthorizationPayload } = await import("@/app/facilitator/evm/functions/createAuthorization");
                                const { settleGaslessTransfer } = await import("@/app/facilitator/evm/functions/settleGaslessTransfer");

                                // Generate Signature (User signs, NO GAS)
                                const payload = await createAuthorizationPayload(
                                    amountBigInt,
                                    watchSourceChain as any,
                                    ownerAddress,
                                    undefined, // provider
                                    undefined, // privateKey
                                    signer // client (WalletClient)
                                );

                                toast.info("Signature created. Sending to Facilitator...");

                                // Submit to API (Facilitator pays gas)
                                const response = await settleGaslessTransfer(
                                    payload,
                                    watchSourceChain as any,
                                    data.amount,
                                    smartAccountAddress as Address
                                );

                                if (response.success) {
                                    toast.success("Gasless Deposit Successful!");
                                    // Wait for indexer/chain
                                    await new Promise(r => setTimeout(r, 4000));
                                    await fetchCurrentBalance();
                                } else {
                                    throw new Error(response.errorReason || "Facilitator rejected request");
                                }

                            } catch (gaslessErr: any) {
                                console.error("Gasless Failed Full Error:", gaslessErr);
                                const innerMsg = gaslessErr?.message || JSON.stringify(gaslessErr);
                                if (innerMsg.includes("User denied")) {
                                    throw new Error("You rejected the signature.");
                                }
                                throw new Error(`Gasless Setup Failed: ${innerMsg.slice(0, 100)}...`);
                            }
                        } else {
                            throw new Error(`Failed to deposit from Main Wallet: ${msg}`);
                        }
                    }
                }

                // Approve (Smart Account -> Spender) - Still needed for the bridge step itself
                // Now SA has funds.
                const approveSuccess = await approveToken(tokenAddress, amountBigInt);
                if (!approveSuccess) console.warn("Approval warning");
            }

            // Execute
            toast.info("Executing transfer...");
            // Workaround: StacksStrategy strictly requires "Ethereum" source chain string ONLY if calling strategy directly.
            // But executeEVMToStacks needs the REAL source chain to trigger CCTP funding.
            const resolvedSourceChain = (data.destChain === "Stacks" && (NETWORKS[data.sourceChain]?.evm?.chain?.id || 0) === BigInt(5000))
                ? "Ethereum" // If effectively already on Eth (simulated)
                : (NETWORKS[data.sourceChain]?.evm?.chain?.id || data.sourceChain);

            // If using executeEVMToStacks, we must pass the actual source chain (e.g. "Base") so it knows to fund via CCTP.
            // However, the existing variable resolvedSourceChain was forcing "Ethereum".
            // We'll use a specific context source chain for the call.
            const contextSourceChain = data.destChain === "Stacks" ? data.sourceChain : resolvedSourceChain;

            const resolvedDestChain = data.destChain === "Stacks" ? "Stacks" : (NETWORKS[data.destChain]?.evm?.chain?.id || data.destChain);

            const context: BridgeContext = {
                sourceChain: contextSourceChain,
                destChain: resolvedDestChain,
                sourceToken: data.sourceToken,
                destToken: data.destToken === "USDCx" ? "USDC" : data.destToken, // SDK expects "USDC" magic string
                amount: data.amount,
                recipient: data.recipient,
                senderAddress: senderAddr,
                // Fallback to the key observed in user environment if env vars fail
                facilitatorPrivateKey: process.env.NEXT_PUBLIC_FACILITATOR_PRIVATE_KEY || process.env.FACILITATOR_PRIVATE_KEY || "0x1de32b06cfc2235dbb8655edae07681f051d6eedb38640dcc898af50ebef4bb8",
                sourceAA: account
            };

            console.log("DEBUG: Context Source Chain:", contextSourceChain);
            console.log("DEBUG: Data Source Chain:", data.sourceChain);
            console.log("DEBUG: Resolving CCTP Support:", NETWORKS[contextSourceChain]?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP);


            let response;
            if (data.destChain === "Stacks" || BigInt(NETWORKS[data.destChain]?.evm?.chain?.id || 0) === BigInt(5000)) {
                // [SDK UPDATE] Use standard execute for Stacks as per v0.4.73+
                // The SDK handles multi-hop internally.
                console.log("[Stacks Bridge] Executing via standard transferManager.execute...");
                response = await transferManager.execute(context as any);

            } else {
                response = await transferManager.execute(context as any);
            }

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
                fetchCurrentBalance();
                closeModal();
                reset();
                return;
            }

            if (response.success) {
                toast.success(`Transfer Successful! TX: ${response.transactionHash}`);
                fetchCurrentBalance();
                closeModal();
                reset();
            } else {
                toast.error(`Transfer Failed: ${response.errorReason}`);
            }

        } catch (e: any) {
            console.error("Execution Error:", e);
            const msg = e.message || "";
            if (msg.includes("insufficient funds") || msg.includes("gas") || msg.includes("exceeds the balance")) {
                toast.error("❌ Insufficient Gas! You need ETH on Base to pay for the transaction fee.", { autoClose: 8000 });
            } else {
                toast.error("Execution Error: " + msg);
            }
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
