import { NextRequest, NextResponse } from "next/server";
import {
    createPublicClient,
    createWalletClient,
    http,
    parseSignature,
    Address
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
    FACILITATOR_NETWORKS,
    FacilitatorChainKey,
} from "@/app/facilitator/config";
import { usdcErc3009Abi } from "@/app/facilitator/usdcErc3009Abi";
import { StellarBridgePayload, StellarBridgeResponse } from "@/app/stellar-transfer-core/config";
import { getOneClickQuote, submitTxHash } from "@/app/stellar-transfer-core/sdk-service";
import { STELLAR } from "@/app/constants/chais/Stellar";
import * as StellarSdk from "stellar-sdk";

const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY as `0x${string}`;
const FACILITATOR_STELLAR_PRIVATE_KEY = process.env.FACILITATOR_STELLAR_PRIVATE_KEY;

// Helper to get Facilitator Keypair
function getFacilitatorKeypair() {
    if (!FACILITATOR_STELLAR_PRIVATE_KEY) {
        throw new Error("Facilitator Stellar private key not configured");
    }
    return StellarSdk.Keypair.fromSecret(FACILITATOR_STELLAR_PRIVATE_KEY);
}

export async function GET() {
    try {
        const keypair = getFacilitatorKeypair();
        return NextResponse.json({ address: keypair.publicKey() });
    } catch (error) {
        return NextResponse.json({ error: "Facilitator not configured" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: StellarBridgePayload = await request.json();
        const { paymentPayload, sourceChain, amount, recipientStellar, recipientOther, targetChain } = body;

        console.log(">>> [Stellar Bridge] Request received:", {
            sourceChain,
            targetChain,
            amount,
            recipientStellar,
            recipientOther
        });

        const amountStr = amount.toString();
        const destinationChain = targetChain || "Base"; // Default to Base if not specified

        // CASE 1: Source is Stellar (Stellar -> EVM)
        if (sourceChain === "Stellar") {
            if (!recipientOther) {
                return NextResponse.json<StellarBridgeResponse>({
                    success: false,
                    errorReason: "Recipient address is required for Stellar -> EVM transfer"
                }, { status: 400 });
            }

            console.log(">>> [Stellar Bridge] Processing Stellar -> EVM request");

            try {
                const server = new StellarSdk.Horizon.Server(STELLAR.serverURL);
                let facilitatorAddress = "";

                // 1. Submit User's Funding Transaction (User -> Facilitator)
                // THIS IS MANDATORY: User must authorize funds transfer to Facilitator
                if (!body.signedXDR) {
                    return NextResponse.json<StellarBridgeResponse>({
                        success: false,
                        errorReason: "Missing Signed XDR: User must sign the funding transaction."
                    }, { status: 400 });
                }

                console.log(">>> [Stellar Bridge] Submitting User Funding TX (XDR)...");
                try {
                    const tx = StellarSdk.TransactionBuilder.fromXDR(body.signedXDR, STELLAR.networkPassphrase);
                    const fundingResult = await server.submitTransaction(tx);
                    console.log(">>> [Stellar Bridge] Funding TX Success:", fundingResult.hash);
                } catch (e: any) {
                    console.error(">>> [Stellar Bridge] Funding TX Failed:", e.response?.data?.extras?.result_codes || e.message);
                    throw new Error("Failed to pull funds from user: " + (e.response?.data?.extras?.result_codes?.operations?.[0] || e.message));
                }

                // 2. Facilitator executes using its own Key
                const sourceKeypair = getFacilitatorKeypair();
                facilitatorAddress = sourceKeypair.publicKey();

                // Calculate Bridge Amount (Deduct Fee)
                // User sends 'amount' to Facilitator. Facilitator sends 'amount - 0.01' to Bridge.
                const FEE = 0.01;
                const amountNum = parseFloat(amountStr);

                if (amountNum <= FEE) {
                    return NextResponse.json<StellarBridgeResponse>({
                        success: false,
                        errorReason: "Amount too low to cover facilitator fee (0.01 USDC)"
                    }, { status: 400 });
                }

                const amountToBridge = (amountNum - FEE).toFixed(6); // USDC has 6 decimals

                console.log(`>>> [Stellar Bridge] Fee Logic: Input=${amountStr}, Fee=${FEE}, Bridging=${amountToBridge}`);

                // Get Quote for Stellar -> EVM
                const quoteResult = await getOneClickQuote({
                    amount: amountToBridge, // Use deducted amount
                    sourceChain: "Stellar",
                    destinationChain: destinationChain, // Target chain (e.g., Base)
                    userSenderAddress: facilitatorAddress, // Facilitator is the one sending to Bridge
                    recipientStellar: recipientOther // reusing this field but it acts as final destination
                });

                console.log(">>> [Stellar Bridge] Quote Received for Stellar Source:", quoteResult.depositAddress);

                // Check for Memo and Deposit Address
                const quoteData = quoteResult.quote.quote as any;
                const memoText = quoteData.depositMemo || quoteData.memo;
                if (!memoText) {
                    throw new Error("No memo returned from quote, cannot proceed with automated transfer");
                }
                const depositAddress = quoteResult.depositAddress;

                console.log(">>> [Stellar Bridge] Automating Stellar Transaction...");
                console.log(">>> [Stellar Bridge] From Facilitator (Stellar Key) -> To Bridge:", depositAddress);
                console.log(">>> [Stellar Bridge] Memo:", memoText);

                // Load Account
                const account = await server.loadAccount(facilitatorAddress);

                // Build Transaction
                // USDC Asset
                const usdcAsset = new StellarSdk.Asset(STELLAR.code, STELLAR.usdc);

                const transaction = new StellarSdk.TransactionBuilder(account, {
                    fee: "100000", // Standard fee
                    networkPassphrase: STELLAR.networkPassphrase
                })
                    .addOperation(StellarSdk.Operation.payment({
                        destination: depositAddress,
                        asset: usdcAsset,
                        amount: amountToBridge
                    }))
                    .addMemo(StellarSdk.Memo.text(memoText))
                    .setTimeout(30)
                    .build();

                // Sign
                transaction.sign(sourceKeypair);

                // Submit
                console.log(">>> [Stellar Bridge] Submitting Facilitator -> Bridge Transaction...");
                const result = await server.submitTransaction(transaction);
                console.log(">>> [Stellar Bridge] Stellar TX Submitted! Hash:", result.hash);

                // Return success with TX Hash
                return NextResponse.json<StellarBridgeResponse>({
                    success: true,
                    transactionHash: result.hash,
                    depositAddress: depositAddress,
                    memo: memoText
                });

            } catch (err) {
                console.error(">>> [Stellar Bridge] Quote Failed:", err);
                return NextResponse.json<StellarBridgeResponse>({
                    success: false,
                    errorReason: `1-Click Quote Failed: ${err instanceof Error ? err.message : 'Unknown'}`
                }, { status: 500 });
            }
        }

        // CASE 2: Source is EVM (EVM -> Stellar)
        // Requires EVM Authorization (paymentPayload)

        if (!paymentPayload) {
            return NextResponse.json<StellarBridgeResponse>({
                success: false,
                errorReason: "Payment payload required for EVM source"
            }, { status: 400 });
        }

        if (!FACILITATOR_PRIVATE_KEY) {
            return NextResponse.json<StellarBridgeResponse>({
                success: false,
                errorReason: "Facilitator private key not configured"
            }, { status: 500 });
        }

        // Validate source chain
        const networkConfig = FACILITATOR_NETWORKS[sourceChain as FacilitatorChainKey];
        if (!networkConfig) {
            return NextResponse.json<StellarBridgeResponse>({
                success: false,
                errorReason: `Unsupported chain: ${sourceChain}`
            }, { status: 400 });
        }

        const { authorization, signature } = paymentPayload;

        // Setup facilitator account and clients
        const facilitatorAccount = privateKeyToAccount(FACILITATOR_PRIVATE_KEY);

        const walletClient = createWalletClient({
            account: facilitatorAccount,
            chain: networkConfig.chain,
            transport: http(networkConfig.rpcUrl)
        });

        const publicClient = createPublicClient({
            chain: networkConfig.chain,
            transport: http(networkConfig.rpcUrl)
        });

        // Parse signature
        const { v, r, s } = parseSignature(signature);

        console.log(">>> [Stellar Bridge] Step 1: Executing transferWithAuthorization (Pull Funds)...");

        // Step 1: Execute transferWithAuthorization (user -> facilitator)
        const pullHash = await walletClient.writeContract({
            chain: networkConfig.chain,
            address: networkConfig.usdc,
            abi: usdcErc3009Abi,
            functionName: "transferWithAuthorization",
            args: [
                authorization.from,
                authorization.to, // Should be facilitator address
                BigInt(authorization.value),
                BigInt(authorization.validAfter),
                BigInt(authorization.validBefore),
                authorization.nonce,
                Number(v),
                r,
                s
            ]
        });

        console.log(">>> [Stellar Bridge] Pull TX Sent:", pullHash);

        const pullReceipt = await publicClient.waitForTransactionReceipt({
            hash: pullHash
        });

        if (pullReceipt.status !== "success") {
            return NextResponse.json<StellarBridgeResponse>({
                success: false,
                errorReason: "Pull transaction (User -> Facilitator) failed"
            }, { status: 500 });
        }

        console.log(">>> [Stellar Bridge] Pull Confirmed. Facilitator holds funds.");

        // Step 2: Get Quote from 1-Click SDK
        console.log(">>> [Stellar Bridge] Step 2: Getting 1-Click Quote...");

        let quoteResult;
        try {
            quoteResult = await getOneClickQuote({
                amount: amountStr,
                sourceChain,
                destinationChain: "Stellar", // Fixed for this legacy flow
                recipientStellar: recipientStellar || authorization.from, // Fallback
                userSenderAddress: authorization.from.toString()
            });
            console.log(">>> [Stellar Bridge] Quote Received. Deposit Address:", quoteResult.depositAddress);
        } catch (err) {
            console.error(">>> [Stellar Bridge] Quote Failed:", err);
            // Refund logic would go here ideally
            return NextResponse.json<StellarBridgeResponse>({
                success: false,
                transactionHash: pullHash,
                errorReason: `1-Click Quote Failed: ${err instanceof Error ? err.message : 'Unknown'}`
            }, { status: 500 });
        }

        // Step 3: Send Funds to 1-Click Deposit Address
        console.log(">>> [Stellar Bridge] Step 3: Sending Funds to Deposit Address...");

        const amountAtomic = BigInt(Math.floor(parseFloat(amountStr) * 1_000_000));

        const depositHash = await walletClient.writeContract({
            chain: networkConfig.chain,
            address: networkConfig.usdc,
            abi: usdcErc3009Abi,
            functionName: "transfer",
            args: [
                quoteResult.depositAddress as Address,
                amountAtomic
            ]
        });

        console.log(">>> [Stellar Bridge] Deposit TX Sent:", depositHash);

        const depositReceipt = await publicClient.waitForTransactionReceipt({
            hash: depositHash
        });

        if (depositReceipt.status !== "success") {
            return NextResponse.json<StellarBridgeResponse>({
                success: false,
                transactionHash: pullHash,
                errorReason: "Deposit to 1-Click Bridge failed (Funds stuck in Facilitator)"
            }, { status: 500 });
        }

        console.log(">>> [Stellar Bridge] Success! Funds bridged via 1-Click.");

        // Step 4: Submit TX Hash to 1-Click API (As per 6-full-swap.ts)
        console.log(">>> [Stellar Bridge] Step 4: Submitting TX Hash to 1-Click API...");
        await submitTxHash(depositHash, quoteResult.depositAddress);

        return NextResponse.json<StellarBridgeResponse>({
            success: true,
            transactionHash: depositHash
        });

    } catch (error) {
        console.error(">>> [Stellar Bridge] Error:", error);
        return NextResponse.json<StellarBridgeResponse>({
            success: false,
            errorReason: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
