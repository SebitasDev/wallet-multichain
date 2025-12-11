import { NextRequest, NextResponse } from "next/server";
import {
    createPublicClient,
    createWalletClient,
    http,
    parseSignature,
    padHex,
    maxUint256
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
    FACILITATOR_NETWORKS,
    FacilitatorChainKey,
    calculateFee,
    FEE_RECIPIENT
} from "@/app/facilitator/config";
import { usdcErc3009Abi } from "@/app/facilitator/usdcErc3009Abi";
import { tokenMessengerAbi } from "@/app/facilitator/cctpAbi";
import { SettleCrossChainRequest, SettleDirectRequest, SettleResponse } from "@/app/facilitator/types";
import { createRetrieveAttestation } from "@/app/cross-chain-core/retrieveAttestationFactory";
import { Address } from "abitype";

// Private key del facilitador (debe estar en .env)
const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY as `0x${string}`;

if (!FACILITATOR_PRIVATE_KEY) {
    console.warn("WARNING: FACILITATOR_PRIVATE_KEY not set in environment");
}

// Helper para convertir address a bytes32 (para CCTP mintRecipient)
const addressToBytes32 = (address: Address): `0x${string}` => {
    return padHex(address, { size: 32 });
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paymentPayload, sourceChain, crossChainConfig, amount, recipient } = body;

        console.log("=== Facilitator Settle Request ===");
        console.log("sourceChain:", sourceChain);
        console.log("amount:", amount);
        console.log("crossChainConfig:", crossChainConfig);

        if (!FACILITATOR_PRIVATE_KEY) {
            return NextResponse.json<SettleResponse>({
                success: false,
                errorReason: "Facilitator not configured"
            }, { status: 500 });
        }

        // Validar chain
        const networkConfig = FACILITATOR_NETWORKS[sourceChain as FacilitatorChainKey];
        if (!networkConfig) {
            return NextResponse.json<SettleResponse>({
                success: false,
                errorReason: `Unsupported chain: ${sourceChain}`
            }, { status: 400 });
        }

        const { authorization, signature } = paymentPayload;

        // Crear cuenta del facilitador
        const facilitatorAccount = privateKeyToAccount(FACILITATOR_PRIVATE_KEY);

        // Crear clientes
        const publicClient = createPublicClient({
            chain: networkConfig.chain,
            transport: http(networkConfig.rpcUrl)
        });

        const walletClient = createWalletClient({
            account: facilitatorAccount,
            chain: networkConfig.chain,
            transport: http(networkConfig.rpcUrl)
        });

        // Parsear la firma a v, r, s
        const { v, r, s } = parseSignature(signature);

        console.log("Executing transferWithAuthorization...");
        console.log("From:", authorization.from);
        console.log("To:", authorization.to);
        console.log("Value:", authorization.value);

        // 1. Ejecutar transferWithAuthorization
        // Esto mueve los USDC del usuario al facilitador
        const transferHash = await walletClient.writeContract({
            chain: networkConfig.chain,
            address: networkConfig.usdc,
            abi: usdcErc3009Abi,
            functionName: "transferWithAuthorization",
            args: [
                authorization.from,
                authorization.to, // Debe ser la dirección del facilitador
                BigInt(authorization.value),
                BigInt(authorization.validAfter),
                BigInt(authorization.validBefore),
                authorization.nonce,
                Number(v),
                r,
                s
            ]
        });

        console.log("TransferWithAuthorization hash:", transferHash);

        // Esperar confirmación
        const transferReceipt = await publicClient.waitForTransactionReceipt({
            hash: transferHash
        });

        if (transferReceipt.status !== "success") {
            return NextResponse.json<SettleResponse>({
                success: false,
                errorReason: "Transfer transaction failed"
            }, { status: 500 });
        }

        const amountBigInt = BigInt(amount);
        const fee = calculateFee();

        // Si es cross-chain, ejecutar CCTP
        if (crossChainConfig) {
            console.log("Executing cross-chain transfer via CCTP...");

            const destNetworkConfig = FACILITATOR_NETWORKS[crossChainConfig.destinationChain as FacilitatorChainKey];
            if (!destNetworkConfig) {
                return NextResponse.json<SettleResponse>({
                    success: false,
                    errorReason: `Unsupported destination chain: ${crossChainConfig.destinationChain}`
                }, { status: 400 });
            }

            // 2. Aprobar USDC al TokenMessenger
            const approveHash = await walletClient.writeContract({
                chain: networkConfig.chain,
                address: networkConfig.usdc,
                abi: usdcErc3009Abi,
                functionName: "approve",
                args: [networkConfig.tokenMessenger, maxUint256]
            });

            await publicClient.waitForTransactionReceipt({ hash: approveHash });
            console.log("Approve hash:", approveHash);

            // 3. Ejecutar depositForBurn (CCTP)
            const mintRecipient = addressToBytes32(crossChainConfig.mintRecipient);

            const burnHash = await walletClient.writeContract({
                chain: networkConfig.chain,
                address: networkConfig.tokenMessenger,
                abi: tokenMessengerAbi,
                functionName: "depositForBurn",
                args: [
                    amountBigInt, // Solo el monto neto, sin fee
                    crossChainConfig.destinationDomain,
                    mintRecipient,
                    networkConfig.usdc,
                    "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // destinationCaller (anyone can call)
                    BigInt(5000), // maxFee
                    1000 // minFinalityThreshold
                ]
            });

            console.log("DepositForBurn hash:", burnHash);

            const burnReceipt = await publicClient.waitForTransactionReceipt({
                hash: burnHash
            });

            if (burnReceipt.status !== "success") {
                return NextResponse.json<SettleResponse>({
                    success: false,
                    transactionHash: transferHash,
                    errorReason: "Burn transaction failed"
                }, { status: 500 });
            }

            // 4. Esperar attestation de Circle
            console.log("Waiting for Circle attestation...");
            let attestation;
            try {
                attestation = await createRetrieveAttestation(
                    burnHash,
                    networkConfig.domain.toString(),
                    120000 // 2 minutos timeout
                );
            } catch (attestError) {
                console.log("Attestation not ready yet, returning burn hash for polling");
                // Devolver el hash del burn para que el cliente pueda hacer polling
                return NextResponse.json<SettleResponse>({
                    success: true,
                    transactionHash: transferHash,
                    burnTransactionHash: burnHash,
                    payer: authorization.from,
                    fee: fee.toString(),
                    netAmount: amountBigInt.toString()
                });
            }

            return NextResponse.json<SettleResponse>({
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
            });

        } else {
            // Transfer directo (sin cross-chain)
            // El dinero ya está en el facilitador, ahora transferir al destinatario final
            if (recipient) {
                const finalTransferHash = await walletClient.writeContract({
                    chain: networkConfig.chain,
                    address: networkConfig.usdc,
                    abi: usdcErc3009Abi,
                    functionName: "transfer",
                    args: [recipient, amountBigInt]
                });

                await publicClient.waitForTransactionReceipt({ hash: finalTransferHash });
                console.log("Final transfer hash:", finalTransferHash);
            }

            return NextResponse.json<SettleResponse>({
                success: true,
                transactionHash: transferHash,
                payer: authorization.from,
                fee: fee.toString(),
                netAmount: amountBigInt.toString()
            });
        }

    } catch (error) {
        console.error("Error in settle:", error);
        return NextResponse.json<SettleResponse>({
            success: false,
            errorReason: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
