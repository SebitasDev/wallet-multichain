import { useState } from "react";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { createPublicClient, createWalletClient, http, formatEther, encodeFunctionData, erc20Abi, Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import axios from "axios";
import { create7702Account } from "@/app/smart-account/clientFactory";
import { createAuthorization } from "@/app/smart-account/authorizationFactory";
import { FACILITATOR_ADDRESS } from "@/app/facilitator/config";

export interface HybridTransferParams {
    sourceChain: string;
    destChain: string;
    sourceToken: string;
    destToken: string;
    amount: string;
    recipient: string;
    sender: string;
    privateKey: string;
    onStatusUpdate?: (status: string) => void;
}

export interface HybridTransferResult {
    success: boolean;
    txHash?: string;
    error?: string;
}

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

export const useHybridBridgeStrategy = () => {
    const [isLoading, setIsLoading] = useState(false);

    const executeHybridTransfer = async (params: HybridTransferParams): Promise<HybridTransferResult> => {
        setIsLoading(true);
        const { sourceChain, destChain, sourceToken, destToken, amount, recipient, sender, privateKey, onStatusUpdate } = params;

        try {
            const networkConfig = NETWORKS[sourceChain as keyof typeof NETWORKS];
            if (!networkConfig || !networkConfig.evm) throw new Error("Invalid source chain configuration");

            const supports7702 = networkConfig.evm.supports7702;

            if (supports7702) {
                // --- 7702 GASLESS FLOW ---
                onStatusUpdate?.("Firmando Autorización (Gasless)...");
                console.log("[HybridStrategy] Executing 7702 Flow");

                const publicClient = createPublicClient({
                    chain: networkConfig.evm.chain,
                    transport: http()
                });

                const { account: smartAccount, owner } = await create7702Account(publicClient, privateKey as `0x${string}`);
                const authorization = await createAuthorization(owner, publicClient, smartAccount);

                // --- 7702 UserOp Generation ---
                // We must sign a UserOp so the EntryPoint can validate us.

                const tokenInfo = networkConfig.assets.find(a => a.name === sourceToken);
                if (!tokenInfo) throw new Error("Token info not found");

                const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** tokenInfo.decimals));
                const FACILITATOR_ADDR = "0xa08979ba1aac1c19dc659817c295c77018533a97";

                const transferCallData = encodeFunctionData({
                    abi: erc20Abi,
                    functionName: "transfer",
                    args: [FACILITATOR_ADDR as Address, amountBigInt]
                });

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

                const nonce = await smartAccount.getNonce();

                const userOpRequest = {
                    callData: executeCallData,
                    callGasLimit: BigInt(500000),
                    verificationGasLimit: BigInt(500000),
                    preVerificationGas: BigInt(100000),
                    maxFeePerGas: BigInt(0),
                    maxPriorityFeePerGas: BigInt(0),
                    nonce,
                    signature: "0x" as `0x${string}`,
                    initCode: "0x" as `0x${string}`
                };

                const signature = await smartAccount.signUserOperation(userOpRequest);

                const userOp = {
                    ...userOpRequest,
                    sender: smartAccount.address,
                    signature: signature
                };

                const serializedAuthorization = serializeBigInt(authorization);
                const serializedUserOp = serializeBigInt(userOp);

                onStatusUpdate?.("Procesando Envío (Gasless)...");

                const response = await axios.post("/api/bridge/settle", {
                    sourceChain,
                    destChain,
                    sourceToken,
                    destToken,
                    amount,
                    recipient,
                    senderAddress: sender,
                    paymentPayload: {
                        authorization: serializedAuthorization,
                        userOp: serializedUserOp,
                        type: "7702"
                    }
                });

                if (!response.data.success) {
                    throw new Error(response.data.errorReason || "7702 Transfer failed");
                }

                return { success: true, txHash: response.data.transactionHash };

            } else {
                // --- REFUEL / STANDARD FLOW ---
                onStatusUpdate?.("Verificando Gas...");
                console.log("[HybridStrategy] Executing Refuel/Standard Flow");

                const publicClient = createPublicClient({
                    chain: networkConfig.evm.chain,
                    transport: http()
                });

                const account = privateKeyToAccount(privateKey as `0x${string}`);
                const walletClient = createWalletClient({
                    account,
                    chain: networkConfig.evm.chain,
                    transport: http()
                });

                // 1. Check Native Balance & Refuel
                const nativeBalance = await publicClient.getBalance({ address: account.address });
                const tokenInfo = networkConfig.assets.find(a => a.name === sourceToken);
                if (!tokenInfo) throw new Error("Token info not found");

                const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** tokenInfo.decimals));

                const gasPrice = await publicClient.getGasPrice();

                let gasEstimate = BigInt(200000); // Default safe limit for Refuel Check fallback
                try {
                    gasEstimate = await publicClient.estimateContractGas({
                        address: tokenInfo.address as Address,
                        abi: erc20Abi,
                        functionName: 'transfer',
                        args: [FACILITATOR_ADDRESS, amountBigInt],
                        account
                    });
                } catch (e) {
                    console.warn("[HybridStrategy] Gas Estimation Failed (likely insufficient funds). Using default 200k for Refuel calculation.", e);
                }

                const estimatedGasCost = gasEstimate * gasPrice;

                if (nativeBalance < estimatedGasCost) {
                    onStatusUpdate?.("Solicitando Gasolina (Refuel)...");
                    console.log(`[Refuel] Requesting Refuel. Est: ${formatEther(estimatedGasCost)}`);

                    const refuelRes = await axios.post("/api/refuel", {
                        chain: sourceChain,
                        address: account.address,
                        estimatedGasCost: formatEther(estimatedGasCost)
                    });

                    if (!refuelRes.data.success) throw new Error("Refuel Failed: " + refuelRes.data.error);

                    onStatusUpdate?.("Esperando fondos...");
                    await new Promise(r => setTimeout(r, 2000));
                }

                // 2. Transaction Execution (Native vs ERC20)
                onStatusUpdate?.("Enviando Transacción...");

                let txHash;

                const isNativeToken = tokenInfo.address === "0x0000000000000000000000000000000000000000";

                if (isNativeToken) {
                    console.log("[HybridStrategy] Executing Native Transfer to Facilitator");
                    txHash = await walletClient.sendTransaction({
                        to: FACILITATOR_ADDRESS as Address,
                        value: amountBigInt,
                        chain: networkConfig.evm.chain,
                        account
                    });
                } else {
                    console.log("[HybridStrategy] Executing ERC20 Transfer to Facilitator");
                    txHash = await walletClient.writeContract({
                        address: tokenInfo.address as Address,
                        abi: erc20Abi,
                        functionName: 'transfer',
                        args: [FACILITATOR_ADDRESS, amountBigInt],
                        chain: networkConfig.evm.chain,
                        account
                    });
                }

                onStatusUpdate?.("Procesando Puente...");

                // 3. Bridge Settle
                const response = await axios.post("/api/bridge/settle", {
                    sourceChain,
                    destChain,
                    sourceToken,
                    destToken,
                    amount,
                    recipient,
                    senderAddress: sender,
                    paymentPayload: {
                        type: "STANDARD",
                        txHash: txHash
                    }
                });

                if (!response.data.success) {
                    throw new Error(response.data.errorReason || "Bridge Settle Failed");
                }

                return { success: true, txHash: txHash };
            }

        } catch (error: any) {
            console.error("[HybridStrategy] Error:", error);
            setIsLoading(false);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    return { executeHybridTransfer, isLoading };
};
