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

// Dirección del facilitador (debe coincidir con la del backend)
const FACILITATOR_ADDRESS = process.env.NEXT_PUBLIC_FACILITATOR_ADDRESS as Address;

interface UseFacilitatorOptions {
    // Provider de XO o cualquier otro wallet
    provider?: any;
    // Private key para wallet local (alternativa a provider)
    privateKey?: `0x${string}`;
    // Dirección del usuario
    userAddress: Address;
}

interface TransferParams {
    amount: string; // En USDC (ej: "10.50")
    sourceChain: FacilitatorChainKey;
    // Para transfer directo
    recipient?: Address;
    // Para cross-chain
    crossChainConfig?: CrossChainConfig;
}

export const useFacilitator = ({ provider, privateKey, userAddress }: UseFacilitatorOptions) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generar nonce aleatorio para ERC-3009
    const generateNonce = (): `0x${string}` => {
        const randomBytes = new Uint8Array(32);
        crypto.getRandomValues(randomBytes);
        return keccak256(toHex(randomBytes));
    };

    // Crear payload de autorización firmado
    const createAuthorizationPayload = useCallback(async (
        amount: bigint,
        sourceChain: FacilitatorChainKey
    ): Promise<FacilitatorPaymentPayload> => {
        const networkConfig = FACILITATOR_NETWORKS[sourceChain];

        // Calcular total con fee
        const totalAmount = calculateTotalWithFee(amount);

        // Crear cliente público
        const publicClient = createPublicClient({
            chain: networkConfig.chain,
            transport: http(networkConfig.rpcUrl)
        });

        // Obtener info del contrato para EIP-712
        const usdcContract = getContract({
            address: networkConfig.usdc,
            abi: usdcErc3009Abi,
            client: publicClient
        });

        const [usdcName, usdcVersion] = await Promise.all([
            usdcContract.read.name(),
            usdcContract.read.version()
        ]);

        // Preparar datos de autorización
        const nonce = generateNonce();
        const validAfter = BigInt(0); // Válido inmediatamente
        const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600); // Válido por 1 hora

        const authorization = {
            from: userAddress,
            to: FACILITATOR_ADDRESS,
            value: totalAmount.toString(),
            validAfter: validAfter.toString(),
            validBefore: validBefore.toString(),
            nonce
        };

        // Dominio EIP-712
        const domain = {
            name: usdcName as string,
            version: usdcVersion as string,
            chainId: networkConfig.chainId,
            verifyingContract: networkConfig.usdc
        };

        // Mensaje a firmar
        const message = {
            from: userAddress,
            to: FACILITATOR_ADDRESS,
            value: totalAmount,
            validAfter,
            validBefore,
            nonce
        };

        let signature: `0x${string}`;

        console.log("=== CREANDO FIRMA ERC-3009 ===");
        console.log("Usuario (from):", userAddress);
        console.log("Facilitador (to):", FACILITATOR_ADDRESS);
        console.log("Monto total (con fee):", totalAmount.toString());
        console.log("Nonce:", nonce);
        console.log("Valid After:", validAfter.toString());
        console.log("Valid Before:", validBefore.toString());
        console.log("Domain:", domain);

        if (provider) {
            // Usar provider externo (XO, MetaMask, etc.)
            console.log(">>> Firmando con PROVIDER (XO/MetaMask)...");
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
            console.log(">>> Firma obtenida con provider:", signature);
        } else if (privateKey) {
            // Usar private key local (solo para firmar, NO se envía al servidor)
            console.log(">>> Firmando con PRIVATE KEY local...");
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
            console.log(">>> Firma obtenida con private key:", signature);
        } else {
            throw new Error("No provider or private key provided");
        }

        console.log("=== FIRMA COMPLETADA ===");
        console.log("Signature:", signature);
        console.log("Authorization payload:", authorization);

        return {
            authorization,
            signature
        };
    }, [provider, privateKey, userAddress]);

    // Verificar el pago con el facilitador
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

    // Liquidar el pago (ejecutar transfer + CCTP si aplica)
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

    // Función principal: ejecutar transfer completo
    const transfer = useCallback(async ({
        amount,
        sourceChain,
        recipient,
        crossChainConfig
    }: TransferParams): Promise<SettleResponse> => {
        setIsLoading(true);
        setError(null);

        try {
            // Convertir amount a unidades atómicas (6 decimales)
            const amountAtomic = BigInt(Math.floor(parseFloat(amount) * 1_000_000));
            const amountAtomicStr = amountAtomic.toString();

            console.log("Creating authorization payload...");
            console.log("Amount (atomic):", amountAtomicStr);
            console.log("Source chain:", sourceChain);

            // 1. Crear y firmar autorización
            const paymentPayload = await createAuthorizationPayload(amountAtomic, sourceChain);
            console.log("Authorization payload created");

            // 2. Verificar
            console.log("Verifying payment...");
            const verifyResult = await verify(paymentPayload, sourceChain, amountAtomicStr);

            if (!verifyResult.isValid) {
                throw new Error(verifyResult.invalidReason || "Verification failed");
            }
            console.log("Payment verified:", verifyResult);

            // 3. Liquidar
            console.log("Settling payment...");
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

            console.log("Payment settled:", settleResult);
            return settleResult;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            setError(errorMessage);
            return {
                success: false,
                errorReason: errorMessage
            };
        } finally {
            setIsLoading(false);
        }
    }, [createAuthorizationPayload, verify, settle]);

    // Transfer directo (misma chain)
    const transferDirect = useCallback(async (
        amount: string,
        sourceChain: FacilitatorChainKey,
        recipient: Address
    ): Promise<SettleResponse> => {
        return transfer({ amount, sourceChain, recipient });
    }, [transfer]);

    // Transfer cross-chain via CCTP
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

    // Helper para obtener el fee
    const getFee = useCallback((amount: string): string => {
        const amountAtomic = BigInt(Math.floor(parseFloat(amount) * 1_000_000));
        const fee = calculateFee();
        return (Number(fee) / 1_000_000).toFixed(2);
    }, []);

    // Helper para obtener el total con fee
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
