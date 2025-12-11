"use client";

import { useState, useCallback } from "react";
import {
    createWalletClient,
    createPublicClient,
    custom,
    http,
    getContract,
    toHex,
    keccak256
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
    FACILITATOR_NETWORKS,
    FacilitatorChainKey,
    calculateFee,
    calculateTotalWithFee
} from "@/app/facilitator/config";
import { usdcErc3009Abi, TransferWithAuthorizationTypes } from "@/app/facilitator/usdcErc3009Abi";
import {
    FacilitatorPaymentPayload,
    CrossChainConfig,
    VerifyResponse,
    SettleResponse
} from "@/app/facilitator/types";
import { Address } from "abitype";

const FACILITATOR_ADDRESS = process.env.NEXT_PUBLIC_FACILITATOR_ADDRESS as Address;

const LOG_PREFIX = "[Facilitator]";

interface UseFacilitatorOptions {
    /** External wallet provider (XO, MetaMask, etc.) */
    provider?: any;
    /** Local private key for signing (alternative to provider) */
    privateKey?: `0x${string}`;
    /** User's wallet address */
    userAddress: Address;
}

interface TransferParams {
    /** Amount in USDC (e.g., "10.50") */
    amount: string;
    /** Source chain for the transfer */
    sourceChain: FacilitatorChainKey;
    /** Recipient address (for same-chain transfers) */
    recipient?: Address;
    /** Cross-chain configuration (for CCTP transfers) */
    crossChainConfig?: CrossChainConfig;
}

/**
 * Hook for facilitator-based USDC transfers.
 * Supports both same-chain and cross-chain (CCTP) transfers.
 */
export const useFacilitator = ({ provider, privateKey, userAddress }: UseFacilitatorOptions) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** Generates a random nonce for ERC-3009 authorization */
    const generateNonce = (): `0x${string}` => {
        const randomBytes = new Uint8Array(32);
        crypto.getRandomValues(randomBytes);
        return keccak256(toHex(randomBytes));
    };

    /** Creates and signs an ERC-3009 authorization payload */
    const createAuthorizationPayload = useCallback(async (
        amount: bigint,
        sourceChain: FacilitatorChainKey
    ): Promise<FacilitatorPaymentPayload> => {
        const networkConfig = FACILITATOR_NETWORKS[sourceChain];
        const totalAmount = calculateTotalWithFee(amount);

        const publicClient = createPublicClient({
            chain: networkConfig.chain,
            transport: http(networkConfig.rpcUrl)
        });

        const usdcContract = getContract({
            address: networkConfig.usdc,
            abi: usdcErc3009Abi,
            client: publicClient
        });

        const [usdcName, usdcVersion] = await Promise.all([
            usdcContract.read.name(),
            usdcContract.read.version()
        ]);

        const nonce = generateNonce();
        const validAfter = BigInt(0);
        const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);

        const authorization = {
            from: userAddress,
            to: FACILITATOR_ADDRESS,
            value: totalAmount.toString(),
            validAfter: validAfter.toString(),
            validBefore: validBefore.toString(),
            nonce
        };

        const domain = {
            name: usdcName as string,
            version: usdcVersion as string,
            chainId: networkConfig.chainId,
            verifyingContract: networkConfig.usdc
        };

        const message = {
            from: userAddress,
            to: FACILITATOR_ADDRESS,
            value: totalAmount,
            validAfter,
            validBefore,
            nonce
        };

        console.log(LOG_PREFIX, "Creating ERC-3009 authorization", {
            from: userAddress,
            to: FACILITATOR_ADDRESS,
            amount: totalAmount.toString(),
            chain: sourceChain
        });

        let signature: `0x${string}`;

        if (provider) {
            console.log(LOG_PREFIX, "Signing with external provider");
            const walletClient = createWalletClient({
                chain: networkConfig.chain,
                transport: custom(provider),
                account: userAddress
            });

            signature = await walletClient.signTypedData({
                domain,
                types: TransferWithAuthorizationTypes,
                primaryType: "TransferWithAuthorization",
                message
            });
        } else if (privateKey) {
            console.log(LOG_PREFIX, "Signing with local key");
            const account = privateKeyToAccount(privateKey);
            const walletClient = createWalletClient({
                account,
                chain: networkConfig.chain,
                transport: http(networkConfig.rpcUrl)
            });

            signature = await walletClient.signTypedData({
                domain,
                types: TransferWithAuthorizationTypes,
                primaryType: "TransferWithAuthorization",
                message
            });
        } else {
            throw new Error("No provider or private key provided");
        }

        console.log(LOG_PREFIX, "Authorization signed successfully");

        return { authorization, signature };
    }, [provider, privateKey, userAddress]);

    /** Verifies payment authorization with the facilitator API */
    const verify = useCallback(async (
        paymentPayload: FacilitatorPaymentPayload,
        sourceChain: FacilitatorChainKey,
        amount: string
    ): Promise<VerifyResponse> => {
        const response = await fetch("/api/facilitator/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                paymentPayload,
                sourceChain,
                expectedAmount: amount
            })
        });

        return response.json();
    }, []);

    /** Settles the payment (executes transfer + CCTP if cross-chain) */
    const settle = useCallback(async (
        paymentPayload: FacilitatorPaymentPayload,
        sourceChain: FacilitatorChainKey,
        amount: string,
        recipient?: Address,
        crossChainConfig?: CrossChainConfig
    ): Promise<SettleResponse> => {
        const response = await fetch("/api/facilitator/settle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                paymentPayload,
                sourceChain,
                amount,
                recipient,
                crossChainConfig
            })
        });

        return response.json();
    }, []);

    /** Executes a complete transfer (sign → verify → settle) */
    const transfer = useCallback(async ({
        amount,
        sourceChain,
        recipient,
        crossChainConfig
    }: TransferParams): Promise<SettleResponse> => {
        setIsLoading(true);
        setError(null);

        const transferType = crossChainConfig ? "cross-chain" : "direct";
        console.log(LOG_PREFIX, `Starting ${transferType} transfer`, {
            amount,
            sourceChain,
            destination: crossChainConfig?.destinationChain || sourceChain
        });

        try {
            const amountAtomic = BigInt(Math.floor(parseFloat(amount) * 1_000_000));
            const amountAtomicStr = amountAtomic.toString();

            // Step 1: Create and sign authorization
            console.log(LOG_PREFIX, "Step 1/3: Creating authorization");
            const paymentPayload = await createAuthorizationPayload(amountAtomic, sourceChain);

            // Step 2: Verify with facilitator
            console.log(LOG_PREFIX, "Step 2/3: Verifying payment");
            const verifyResult = await verify(paymentPayload, sourceChain, amountAtomicStr);

            if (!verifyResult.isValid) {
                throw new Error(verifyResult.invalidReason || "Verification failed");
            }

            // Step 3: Settle payment
            console.log(LOG_PREFIX, "Step 3/3: Settling payment");
            const settleResult = await settle(
                paymentPayload,
                sourceChain,
                amountAtomicStr,
                recipient,
                crossChainConfig
            );

            if (!settleResult.success) {
                throw new Error(settleResult.errorReason || "Settlement failed");
            }

            console.log(LOG_PREFIX, "Transfer completed", {
                txHash: settleResult.transactionHash,
                burnTxHash: settleResult.burnTransactionHash
            });

            return settleResult;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            console.error(LOG_PREFIX, "Transfer failed:", errorMessage);
            setError(errorMessage);
            return {
                success: false,
                errorReason: errorMessage
            };
        } finally {
            setIsLoading(false);
        }
    }, [createAuthorizationPayload, verify, settle]);

    /** Same-chain USDC transfer */
    const transferDirect = useCallback(async (
        amount: string,
        sourceChain: FacilitatorChainKey,
        recipient: Address
    ): Promise<SettleResponse> => {
        return transfer({ amount, sourceChain, recipient });
    }, [transfer]);

    /** Cross-chain USDC transfer via CCTP */
    const transferCrossChain = useCallback(async (
        amount: string,
        sourceChain: FacilitatorChainKey,
        destinationChain: FacilitatorChainKey,
        mintRecipient: Address
    ): Promise<SettleResponse> => {
        const destConfig = FACILITATOR_NETWORKS[destinationChain];
        return transfer({
            amount,
            sourceChain,
            crossChainConfig: {
                destinationChain,
                destinationDomain: destConfig.domain,
                mintRecipient
            }
        });
    }, [transfer]);

    /** Returns the facilitator fee in USDC */
    const getFee = useCallback((): string => {
        const fee = calculateFee();
        return (Number(fee) / 1_000_000).toFixed(2);
    }, []);

    /** Returns the total amount including fee */
    const getTotalWithFee = useCallback((amount: string): string => {
        const amountAtomic = BigInt(Math.floor(parseFloat(amount) * 1_000_000));
        const total = calculateTotalWithFee(amountAtomic);
        return (Number(total) / 1_000_000).toFixed(2);
    }, []);

    return {
        transfer,
        transferDirect,
        transferCrossChain,
        verify,
        settle,
        createAuthorizationPayload,
        getFee,
        getTotalWithFee,
        isLoading,
        error,
        facilitatorAddress: FACILITATOR_ADDRESS
    };
};
