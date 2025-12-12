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
    calculateFee
} from "@/app/facilitator/config";
import { usdcErc3009Abi } from "@/app/facilitator/usdcErc3009Abi";
import { tokenMessengerAbi } from "@/app/facilitator/cctpAbi";
import { SettleResponse } from "@/app/facilitator/types";
import { createRetrieveAttestation } from "@/app/cross-chain-core/retrieveAttestationFactory";
import { Address } from "abitype";

const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY as `0x${string}`;

if (!FACILITATOR_PRIVATE_KEY) {
    console.warn("WARNING: FACILITATOR_PRIVATE_KEY not set in environment");
}

/** Converts an address to bytes32 format for CCTP mintRecipient */
const addressToBytes32 = (address: Address): `0x${string}` => {
    return padHex(address, { size: 32 });
};

/**
 * POST /api/facilitator/settle
 *
 * Executes the payment settlement:
 * 1. Calls transferWithAuthorization to move USDC from user to facilitator
 * 2. For cross-chain: executes CCTP depositForBurn and waits for attestation
 * 3. For same-chain: transfers USDC to final recipient
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paymentPayload, sourceChain, crossChainConfig, amount, recipient } = body;

        if (!FACILITATOR_PRIVATE_KEY) {
            return NextResponse.json<SettleResponse>({
                success: false,
                errorReason: "Facilitator not configured"
            }, { status: 500 });
        }

        // Validate source chain
        const networkConfig = FACILITATOR_NETWORKS[sourceChain as FacilitatorChainKey];
        if (!networkConfig) {
            return NextResponse.json<SettleResponse>({
                success: false,
                errorReason: `Unsupported chain: ${sourceChain}`
            }, { status: 400 });
        }

        const { authorization, signature } = paymentPayload;

        // Setup facilitator account and clients
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

        // Parse signature to v, r, s components
        const { v, r, s } = parseSignature(signature);

        // Step 1: Execute transferWithAuthorization (user -> facilitator)
        const transferHash = await walletClient.writeContract({
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

        // Handle cross-chain transfer via CCTP
        if (crossChainConfig) {
            const destNetworkConfig = FACILITATOR_NETWORKS[crossChainConfig.destinationChain as FacilitatorChainKey];
            if (!destNetworkConfig) {
                return NextResponse.json<SettleResponse>({
                    success: false,
                    errorReason: `Unsupported destination chain: ${crossChainConfig.destinationChain}`
                }, { status: 400 });
            }

            // Verificar balance del facilitador antes del burn
            const facilitatorBalance = await publicClient.readContract({
                address: networkConfig.usdc,
                abi: usdcErc3009Abi,
                functionName: "balanceOf",
                args: [facilitatorAccount.address]
            }) as bigint;

            console.log("[Facilitator] Balance check:", {
                facilitatorAddress: facilitatorAccount.address,
                balance: facilitatorBalance.toString(),
                amountToBurn: amountBigInt.toString(),
                chain: sourceChain
            });

            if (facilitatorBalance < amountBigInt) {
                return NextResponse.json<SettleResponse>({
                    success: false,
                    transactionHash: transferHash,
                    errorReason: `Insufficient facilitator balance. Has: ${facilitatorBalance.toString()}, needs: ${amountBigInt.toString()}`
                }, { status: 500 });
            }

            // Step 2: Approve USDC to TokenMessenger
            const approveHash = await walletClient.writeContract({
                chain: networkConfig.chain,
                address: networkConfig.usdc,
                abi: usdcErc3009Abi,
                functionName: "approve",
                args: [networkConfig.tokenMessenger, maxUint256]
            });

            await publicClient.waitForTransactionReceipt({ hash: approveHash });

            // Verificar allowance después del approve
            const allowance = await publicClient.readContract({
                address: networkConfig.usdc,
                abi: usdcErc3009Abi,
                functionName: "allowance",
                args: [facilitatorAccount.address, networkConfig.tokenMessenger]
            }) as bigint;

            console.log("[Facilitator] Allowance check:", {
                owner: facilitatorAccount.address,
                spender: networkConfig.tokenMessenger,
                allowance: allowance.toString()
            });

            // Step 3: Execute CCTP depositForBurn
            const mintRecipient = addressToBytes32(crossChainConfig.mintRecipient);

            // Calculate maxFee (1% of amount, min 200 = 0.0002 USDC)
            const maxFee = amountBigInt > BigInt(100)
                ? BigInt(Math.max(Number(amountBigInt) / 100, 200))
                : BigInt(200);

            console.log("[Facilitator] depositForBurn args:", {
                amount: amountBigInt.toString(),
                destinationDomain: crossChainConfig.destinationDomain,
                mintRecipient,
                burnToken: networkConfig.usdc,
                maxFee: maxFee.toString()
            });

            const burnHash = await walletClient.writeContract({
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

            // Step 4: Wait for Circle attestation
            let attestation;
            try {
                attestation = await createRetrieveAttestation(
                    burnHash,
                    networkConfig.domain.toString(),
                    120000 // 2 min timeout
                );
            } catch {
                // Return burn hash for client polling if attestation not ready
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
            // Same-chain transfer: send to final recipient
            if (recipient) {
                const finalTransferHash = await walletClient.writeContract({
                    chain: networkConfig.chain,
                    address: networkConfig.usdc,
                    abi: usdcErc3009Abi,
                    functionName: "transfer",
                    args: [recipient, amountBigInt]
                });

                await publicClient.waitForTransactionReceipt({ hash: finalTransferHash });
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
        console.error("Settle error:", error);
        return NextResponse.json<SettleResponse>({
            success: false,
            errorReason: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
