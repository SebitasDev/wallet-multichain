import {
    createPublicClient,
    createWalletClient,
    http,
    parseSignature,
    Address
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
    FacilitatorChainKey,
    calculateFee
} from "@/app/facilitator/config";
import { FACILITATOR_NETWORKS } from "@/app/facilitator/evm/config";
import { usdcErc3009Abi } from "@/app/facilitator/evm/usdcErc3009Abi";
import { SettleResponse, FacilitatorPaymentPayload } from "@/app/facilitator/types";

const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY as `0x${string}`;

export async function processGaslessSettlement(
    paymentPayload: FacilitatorPaymentPayload,
    sourceChain: FacilitatorChainKey,
    amount: string,
    recipient: Address
): Promise<SettleResponse> {
    if (!FACILITATOR_PRIVATE_KEY) {
        return {
            success: false,
            errorReason: "Facilitator not configured"
        };
    }

    const networkConfig = FACILITATOR_NETWORKS[sourceChain];
    if (!networkConfig) {
        return {
            success: false,
            errorReason: `Unsupported chain: ${sourceChain}`
        };
    }

    const { authorization, signature } = paymentPayload;

    // Setup clients
    const facilitatorAccount = privateKeyToAccount(FACILITATOR_PRIVATE_KEY);
    const publicClient = createPublicClient({
        chain: networkConfig.chain,
        transport: http(networkConfig.rpcUrl)
    });
    const walletClient = createWalletClient({
        account: facilitatorAccount,
        chain: networkConfig.chain,
        transport: http(networkConfig.rpcUrl)
    });

    const { v, r, s } = parseSignature(signature);

    // Step 1: TransferWithAuthorization
    let transferHash: `0x${string}`;
    try {
        transferHash = await walletClient.writeContract({
            chain: networkConfig.chain,
            address: networkConfig.usdc,
            abi: usdcErc3009Abi,
            functionName: "transferWithAuthorization",
            args: [
                authorization.from,
                authorization.to,
                BigInt(authorization.value),
                BigInt(authorization.validAfter),
                BigInt(authorization.validBefore),
                authorization.nonce,
                Number(v),
                r,
                s
            ]
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash: transferHash });
        if (receipt.status !== "success") throw new Error("TransferWithAuthorization failed");

    } catch (e) {
        return {
            success: false,
            errorReason: e instanceof Error ? e.message : "Transfer failed"
        };
    }

    // Convert human readable string (e.g. "0.01") to atomic units (6 decimals)
    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1_000_000));
    const fee = calculateFee();

    // Step 2: Transfer to Recipient
    try {
        const finalTransferHash = await walletClient.writeContract({
            chain: networkConfig.chain,
            address: networkConfig.usdc,
            abi: usdcErc3009Abi,
            functionName: "transfer",
            args: [recipient, amountBigInt - BigInt(10000)] // Deduct 0.01 USDC Fee
        });

        await publicClient.waitForTransactionReceipt({ hash: finalTransferHash });

    } catch (e) {
        console.error("Final transfer failed", e);
        // Note: Funds are already in facilitator, so manual intervention might be needed if this fails.
        // Returning success=false but keeping transactionHash allows UI to show the initial deduction.
        return {
            success: false,
            transactionHash: transferHash,
            errorReason: "Final transfer to recipient failed. Funds are with facilitator."
        };
    }

    return {
        success: true,
        transactionHash: transferHash,
        payer: authorization.from,
        fee: fee.toString(),
        netAmount: amountBigInt.toString()
    };
}
