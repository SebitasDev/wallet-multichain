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

const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY as `0x${string}`;

export async function POST(request: NextRequest) {
    try {
        const body: StellarBridgePayload = await request.json();
        const { paymentPayload, sourceChain, amount, recipientStellar } = body;

        console.log(">>> [Stellar Bridge] Request received:", {
            sourceChain,
            amount,
            recipientStellar,
            payer: paymentPayload.authorization.from
        });

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

        // Ensure amount is string for calculation
        const amountStr = amount.toString();

        let quoteResult;
        try {
            quoteResult = await getOneClickQuote({
                amount: amountStr,
                sourceChain,
                recipientStellar,
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
