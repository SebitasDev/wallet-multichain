import { useState, useCallback } from "react";
import { Address } from "viem";

import {
    FacilitatorChainKey,
    calculateFee,
    calculateTotalWithFee
} from "../config";
import {
    UseFacilitatorOptions,
    SettleResponse,
} from "../types";
import { FACILITATOR_ADDRESS } from "@/app/facilitator/config";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { bridgeApi } from "@/app/services/api";

// New EVM Functions
import { createAuthorizationPayload } from "../evm/functions/createAuthorization";
import { verifyCCTP } from "../evm/functions/verifyCCTP";
// Stellar Actions
import { executeStellarBridgeTransfer, executeStellarToEvmTransfer, executeStellarTransfer } from "../non-evm/stellar/actions";

const LOG_PREFIX = "[useFacilitator]";

export const useFacilitator = ({
    provider,
    privateKey,
    userAddress,
    stellarPrivateKey
}: UseFacilitatorOptions) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** Wrapper for generic authorization creation */
    const createAuthorization = useCallback(async (
        amount: bigint,
        sourceChain: FacilitatorChainKey
    ) => {
        return createAuthorizationPayload(
            amount,
            sourceChain,
            userAddress,
            provider,
            privateKey
        );
    }, [provider, privateKey, userAddress]);

    /**
     * INTELLIGENT TRANSFER EXECUTOR
     * Automatically detects the best route (Same-chain, CCTP, Stellar Bridge)
     * based on source and destination chain configurations.
     */
    const executeTransfer = useCallback(async ({
        amount,
        sourceChain,
        destinationChain,
        recipient,
        destToken,
        sourceToken,
        facilitatorFee,
        sender, // Explicit sender address (optional)
        overrideCredentials
    }: {
        amount: string,
        sourceChain: FacilitatorChainKey,
        destinationChain: FacilitatorChainKey,
        recipient: string; // Can be EVM Address or Stellar Address
        destToken?: string;
        sourceToken?: string;
        facilitatorFee?: string;
        sender?: string; // Explicit sender address
        overrideCredentials?: {
            privateKey?: `0x${string}`;
            stellarPrivateKey?: string;
            userAddress?: Address;
        }
    }): Promise<SettleResponse> => {
        setIsLoading(true);
        setError(null);

        const currentAddress = overrideCredentials?.userAddress || userAddress;
        const currentPrivateKey = overrideCredentials?.privateKey || privateKey;
        const currentStellarKey = overrideCredentials?.stellarPrivateKey || stellarPrivateKey;

        console.log(LOG_PREFIX, `Initiating transfer: ${sourceChain} -> ${destinationChain}`, { amount, recipient, from: currentAddress });

        try {
            // --- 1. DETECT TRANSFER TYPE ---
            const sourceConfig = NETWORKS[sourceChain];
            const destConfig = NETWORKS[destinationChain];

            if (!sourceConfig || !destConfig) {
                throw new Error(`Invalid chain configuration for ${sourceChain} or ${destinationChain}`);
            }

            const isStellarSource = sourceChain === "Stellar";
            const isStellarDest = destinationChain === "Stellar";

            // A. Stellar -> EVM
            if (isStellarSource && !isStellarDest) {
                console.log(LOG_PREFIX, "Route: Stellar -> EVM Bridge");
                const result = await executeStellarToEvmTransfer(
                    amount,
                    destinationChain, // Destination Chain Key
                    recipient,
                    currentStellarKey, // Use override or default
                    sourceToken,
                    sender // Pass sender for refund address
                );
                // Standardize response if needed, but actions match SettleResponse
                return result;
            }

            // B. EVM -> Stellar
            if (!isStellarSource && isStellarDest) {
                console.log(LOG_PREFIX, "Route: EVM -> Stellar Bridge");
                const amountAtomic = BigInt(Math.floor(parseFloat(amount) * 1_000_000));

                // Step 1: Auth
                const paymentPayload = await createAuthorizationPayload(
                    amountAtomic,
                    sourceChain,
                    currentAddress,
                    overrideCredentials?.privateKey ? undefined : provider,
                    currentPrivateKey
                );

                // Step 2: Bridge
                return await executeStellarBridgeTransfer(
                    paymentPayload,
                    sourceChain,
                    amount,
                    recipient,
                    destToken,
                    sourceToken
                );
            }

            // D. Stellar -> Stellar (Swap/Transfer)
            if (isStellarSource && isStellarDest) {
                console.log(LOG_PREFIX, "Route: Stellar -> Stellar");
                return await executeStellarTransfer(
                    amount,
                    recipient,
                    currentStellarKey,
                    sourceToken,
                    destToken,
                    facilitatorFee
                );
            }

            // C. EVM -> EVM (Smart Router)
            if (!isStellarSource && !isStellarDest) {
                // ... (Existing Logic)

                console.log(LOG_PREFIX, "Route: EVM Smart Router");

                const amountAtomic = BigInt(Math.floor(parseFloat(amount) * 1_000_000));
                const amountAtomicStr = amountAtomic.toString();

                // Step 1: Create Authorization
                console.log(LOG_PREFIX, "Step 1/3: Creating authorization");

                // Use Payload Direct Call to handle overrides correctly without wrapper
                const paymentPayload = await createAuthorizationPayload(
                    amountAtomic,
                    sourceChain,
                    currentAddress,
                    overrideCredentials?.privateKey ? undefined : provider,
                    currentPrivateKey
                );

                // Determining if CCTP is needed for Verification
                const isCrossChain = sourceChain !== destinationChain;

                if (isCrossChain) {
                    const sourceCCTP = sourceConfig.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;
                    const destCCTP = destConfig.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;

                    if (sourceCCTP && destCCTP) {
                        console.log(LOG_PREFIX, "Step 2/3: Verifying (CCTP Mode)");
                        // We use the specific CCTP verify endpoint 
                        const verifyResult = await verifyCCTP(paymentPayload, sourceChain, amountAtomicStr, destinationChain);
                        if (!verifyResult.isValid) {
                            throw new Error(verifyResult.invalidReason || "Verification failed");
                        }
                    }
                }

                // Step 2: Call Smart Router Endpoint
                console.log(LOG_PREFIX, "Step 3/3: calling Smart Router /settle");

                const result = await bridgeApi.settle({
                    paymentPayload,
                    sourceChain,
                    destChain: destinationChain, // The router needs this to decide
                    amount: amount,
                    recipient: recipient,
                    destToken: destToken,
                    sourceToken: sourceToken
                });

                if (!result.success) {
                    throw new Error(result.errorReason || "Smart Router Settlement failed");
                }

                return result;
            }

            throw new Error(`Unsupported route: ${sourceChain} -> ${destinationChain}`);

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
    }, [createAuthorization, executeStellarBridgeTransfer, executeStellarToEvmTransfer, stellarPrivateKey, privateKey, userAddress, provider]);

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
        // Main Intelligent Action
        executeTransfer,

        // Expose individual legacy functions if strictly needed by consumers (transition phase)
        // Or better yet, we can create wrappers that map to executeTransfer to maintain API compatibility
        // executeEvmTransfer, // Removed in favor of unified

        // Helpers and State
        getFee,
        getTotalWithFee,
        isLoading,
        error,
        facilitatorAddress: FACILITATOR_ADDRESS
    };
};
