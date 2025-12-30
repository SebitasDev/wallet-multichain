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

            // [FIX] Hoist Token Info to determine if we should SKIP 7702 (User Request: No Smart Account for Native Tokens)
            const tokenInfo = networkConfig.assets.find(a => a.name === sourceToken);
            if (!tokenInfo || !tokenInfo.address) throw new Error("Token info or address not found");

            const isNativeToken = tokenInfo.address === "0x0000000000000000000000000000000000000000" || tokenInfo.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

            // CONDITION: Use 7702 ONLY if supported AND NOT Native Token
            if (supports7702 && !isNativeToken) {
                // --- 7702 GASLESS FLOW (ERC20 ONLY) ---
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

                const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** tokenInfo.decimals));
                const FACILITATOR_ADDR = "0xa08979ba1aac1c19dc659817c295c77018533a97";

                // [NOTE] Since we excluded Native Tokens above, this block now handles ERC20 ONLY logic.
                // However, preserving the conditional structure is fine for robustness if rules change.

                let callDest: Address;
                let callValue: bigint;
                let callFunc: `0x${string}`;

                // ERC20 Transfer: Call 'transfer' on Token Contract
                callDest = tokenInfo.address as Address;
                callValue = BigInt(0);
                callFunc = encodeFunctionData({
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
                    args: [callDest, callValue, callFunc]
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
                // Executed if:
                // 1. Chain doesn't support 7702 (e.g. older chains)
                // 2. OR Token is Native (e.g. POL/ETH) - As per User Requirement

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
                let nativeBalance = await publicClient.getBalance({ address: account.address }); // [FIX] let, not const

                // tokenInfo already defined above
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

                    onStatusUpdate?.("Refuel Exitoso. Esperando fondos...");

                    // [FIX] Wait for Balance to Update (Polling)
                    // We need to wait until balance actually increases, otherwise next check fails.
                    const initialBal = nativeBalance;
                    for (let i = 0; i < 4; i++) {
                        await new Promise(r => setTimeout(r, 3000)); // Wait 3s
                        const newBal = await publicClient.getBalance({ address: account.address });
                        if (newBal > initialBal) {
                            console.log(`[Refuel] Balance Updated: ${formatEther(initialBal)} -> ${formatEther(newBal)}`);
                            nativeBalance = newBal;
                            break;
                        }
                        console.log(`[Refuel] Waiting for balance... Attempt ${i + 1}`);
                        // Update variable anyway in case it changed slightly or we want the latest
                        nativeBalance = newBal;
                    }
                }

                // 2. Transaction Execution (Native vs ERC20)
                onStatusUpdate?.("Enviando Transacción...");

                let txHash;

                if (isNativeToken) {
                    console.log("[HybridStrategy] Executing Native Transfer to Facilitator");

                    // [FIX] Deduct Gas from Amount for Native Transfers
                    // Standard ETH transfer cost is 21,000 units.
                    // We add 50% buffer (was 15%) because EIP-1559 MaxFee can be higher than current GasPrice.
                    const standardGasLimit = BigInt(21000);
                    const txCost = standardGasLimit * gasPrice;
                    const txCostWithBuffer = (txCost * BigInt(150)) / BigInt(100);

                    console.log(`[HybridStrategy] Native Gas Adjustment: Est Cost: ${formatEther(txCostWithBuffer)}`);

                    // Subtract gas from the amount to send
                    let valueToSend = amountBigInt;

                    // Only subtract if we are sending close to max? 
                    // Actually, if we are sending Native Token, we MUST ensure we have enough left for gas.
                    // If amountBigInt is close to Balance, this will fail.
                    // BUT, 'nativeBalance' check above (Line 209) checked against `estimatedGasCost`.
                    // The issue is `sendTransaction` sends `value`. Total cost = `value` + `gas`.
                    // If `value` = `balance`, then `value` + `gas` > `balance`.

                    // We should check if (Amount + Gas > Balance). If so, cap Amount = Balance - Gas.
                    // However, useSendMoneyModal likely requested a specific amount.
                    // If we reduce it, the destination might receive less than expected.
                    // But for Native Bridge, this is usually acceptable or required to succeed.

                    // Let's protect the user:
                    if (amountBigInt + txCostWithBuffer > nativeBalance) {
                        console.log("[HybridStrategy] Cap Amount to preserve gas.");
                        valueToSend = nativeBalance - txCostWithBuffer;
                    }

                    if (valueToSend <= BigInt(0)) {
                        throw new Error(`Insufficient funds for gas. Balance: ${formatEther(nativeBalance)}, Gas Needed: ${formatEther(txCostWithBuffer)}`);
                    }

                    txHash = await walletClient.sendTransaction({
                        to: FACILITATOR_ADDRESS as Address,
                        value: valueToSend,
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
