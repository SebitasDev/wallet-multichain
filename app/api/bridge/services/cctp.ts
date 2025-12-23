import {
    createPublicClient,
    createWalletClient,
    http,
    parseSignature,
    padHex,
    maxUint256,
    Address
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
    FacilitatorChainKey,
    calculateFee
} from "@/app/facilitator/config";
import { FACILITATOR_NETWORKS } from "@/app/facilitator/evm/config";
import { usdcErc3009Abi } from "@/app/facilitator/evm/usdcErc3009Abi";
import { tokenMessengerAbi } from "@/app/facilitator/evm/cctpAbi";
import { SettleResponse, FacilitatorPaymentPayload, CrossChainConfig } from "@/app/facilitator/types";
import { createRetrieveAttestation } from "@/app/cross-chain-core/circleCCTP/retrieveAttestationFactory";

const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY as `0x${string}`;

/** Converts an address to bytes32 format for CCTP mintRecipient */
const addressToBytes32 = (address: Address): `0x${string}` => {
    return padHex(address, { size: 32 });
};

export async function processCCTPSettlement(
    paymentPayload: FacilitatorPaymentPayload,
    sourceChain: FacilitatorChainKey,
    amount: string,
    crossChainConfig: CrossChainConfig,
    recipient?: Address
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

    // Parse signature
    const { v, r, s } = parseSignature(signature);

    // Step 1: TransferWithAuthorization (User -> Facilitator)
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
        if (receipt.status !== "success") throw new Error("Transfer execution failed");
    } catch (error) {
        return {
            success: false,
            errorReason: error instanceof Error ? error.message : "Transfer failed"
        };
    }

    // Convert human readable string (e.g. "0.01") to atomic units (6 decimals)
    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1_000_000));
    const fee = calculateFee();

    // Verify Balances (Safety Check)
    const facilitatorBalance = await publicClient.readContract({
        address: networkConfig.usdc,
        abi: usdcErc3009Abi,
        functionName: "balanceOf",
        args: [facilitatorAccount.address]
    }) as bigint;

    if (facilitatorBalance < amountBigInt) {
        return {
            success: false,
            transactionHash: transferHash,
            errorReason: `Insufficient facilitator balance. Has: ${facilitatorBalance}, Needs: ${amountBigInt}`
        };
    }

    // Step 2: Approve TokenMessenger
    try {
        const approveHash = await walletClient.writeContract({
            chain: networkConfig.chain,
            address: networkConfig.usdc,
            abi: usdcErc3009Abi,
            functionName: "approve",
            args: [networkConfig.tokenMessenger, maxUint256]
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
    } catch (e) {
        console.error("Approval failed", e);
        // Continue? If approval existed, it might be fine, but writeContract usually fails if revert.
        // Assuming strict failure for now.
        return {
            success: false,
            transactionHash: transferHash,
            errorReason: "Approval failed"
        };
    }

    // Step 3: DepositForBurn
    const targetRecipient = recipient || crossChainConfig.mintRecipient;
    const mintRecipient = addressToBytes32(targetRecipient);

    // Dynamic maxFee calculation (1%, min 200 wei)
    const maxFee = amountBigInt > BigInt(100)
        ? BigInt(Math.floor(Math.max(Number(amountBigInt) / 100, 200)))
        : BigInt(200);

    let burnHash: `0x${string}`;
    try {
        burnHash = await walletClient.writeContract({
            chain: networkConfig.chain,
            address: networkConfig.tokenMessenger,
            abi: tokenMessengerAbi,
            functionName: "depositForBurn",
            args: [
                amountBigInt,
                crossChainConfig.destinationDomain,
                mintRecipient,
                networkConfig.usdc,
                "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
                maxFee,
                1000 // minFinalityThreshold
            ]
        });

        const burnReceipt = await publicClient.waitForTransactionReceipt({ hash: burnHash });
        if (burnReceipt.status !== "success") throw new Error("Burn execution failed");

    } catch (e) {
        return {
            success: false,
            transactionHash: transferHash,
            errorReason: e instanceof Error ? e.message : "Burn failed"
        };
    }

    // Step 4: Wait for Attestation
    let attestation;
    try {
        attestation = await createRetrieveAttestation(
            burnHash,
            networkConfig.domain.toString(),
            120000 // 2 min timeout
        );
    } catch (e) {
        // Timeout is okay, return partial success
        console.warn("Attestation timeout", e);
    }

    return {
        success: true,
        transactionHash: transferHash,
        burnTransactionHash: burnHash,
        payer: authorization.from,
        fee: fee.toString(),
        netAmount: amountBigInt.toString(),
        attestation: attestation ? {
            message: attestation.message,
            attestation: attestation.attestation
        } : undefined
    };
}
