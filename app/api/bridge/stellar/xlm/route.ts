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
    FacilitatorChainKey,
} from "@/app/facilitator/config";
import { FACILITATOR_NETWORKS } from "@/app/facilitator/evm/config";
import { usdcErc3009Abi } from "@/app/facilitator/evm/usdcErc3009Abi";
import { StellarBridgePayload, StellarBridgeResponse } from "@/app/stellar-transfer-core/config";
import { getOneClickQuote, submitTxHash } from "@/app/stellar-transfer-core/sdk-service";
import * as StellarSdk from "stellar-sdk";

const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY as `0x${string}`;
const FACILITATOR_STELLAR_PRIVATE_KEY = process.env.FACILITATOR_STELLAR_PRIVATE_KEY;

// Only support EVM -> Stellar XLM for now
export async function POST(request: NextRequest) {
    try {
        const body: StellarBridgePayload = await request.json();
        const { paymentPayload, sourceChain, amount, recipientStellar } = body;

        console.log(">>> [Stellar Bridge XLM] Request received:", {
            sourceChain,
            targetChain: "Stellar (XLM)",
            amount,
            recipientStellar
        });

        const amountStr = amount.toString();

        // VALIDATION: Must be EVM Source
        if (sourceChain === "Stellar") {
            return NextResponse.json<StellarBridgeResponse>({
                success: false,
                errorReason: "Stellar -> XLM Flow not implemented in this route. Use generic bridge."
            }, { status: 400 });
        }

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

        const IS_DEV = process.env.NODE_ENV === 'development';
        const FEE = IS_DEV ? 0 : 0.05;
        const BRIDGE_MIN = 0.03;
        const MIN_AMOUNT = FEE + BRIDGE_MIN;

        const amountNum = parseFloat(amountStr);

        // VALIDATION: Minimum Amount Check BEFORE pulling funds
        if (amountNum < MIN_AMOUNT) {
            return NextResponse.json<StellarBridgeResponse>({
                success: false,
                errorReason: `Amount too low. Minimum required: ${MIN_AMOUNT} USDC. (${FEE} Fee + ${BRIDGE_MIN} Bridge)`
            }, { status: 400 });
        }

        const amountToBridge = (amountNum - FEE).toFixed(6);
        console.log(`>>> [Stellar Bridge XLM] Fee Logic (${IS_DEV ? 'DEV' : 'PROD'}): Input=${amountStr}, Fee=${FEE}, Bridging=${amountToBridge}`);

        console.log(">>> [Stellar Bridge XLM] Step 1: Executing transferWithAuthorization (Pull Funds)...");

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

        console.log(">>> [Stellar Bridge XLM] Pull TX Sent:", pullHash);

        const pullReceipt = await publicClient.waitForTransactionReceipt({
            hash: pullHash
        });

        if (pullReceipt.status !== "success") {
            return NextResponse.json<StellarBridgeResponse>({
                success: false,
                errorReason: "Pull transaction (User -> Facilitator) failed"
            }, { status: 500 });
        }

        console.log(">>> [Stellar Bridge XLM] Pull Confirmed. Facilitator holds funds.");

        // Step 2: Get Quote from 1-Click SDK
        console.log(">>> [Stellar Bridge XLM] Step 2: Getting 1-Click Quote (USDC -> XLM)...");

        let quoteResult;
        try {
            quoteResult = await getOneClickQuote({
                amount: amountToBridge, // Use deduced amount
                sourceChain,
                destinationChain: "Stellar",
                recipientStellar: recipientStellar || authorization.from,
                userSenderAddress: authorization.from.toString(),
                destinationToken: "XLM"
            });
            console.log(">>> [Stellar Bridge XLM] Quote Received. Deposit Address:", quoteResult.depositAddress);
        } catch (err) {
            console.error(">>> [Stellar Bridge XLM] Quote Failed:", err);
            // Refund logic would go here ideally
            return NextResponse.json<StellarBridgeResponse>({
                success: false,
                transactionHash: pullHash,
                errorReason: `1-Click Quote Failed: ${err instanceof Error ? err.message : 'Unknown'}`
            }, { status: 500 });
        }

        // Step 3: Send Funds to 1-Click Deposit Address
        console.log(">>> [Stellar Bridge XLM] Step 3: Sending Funds to Deposit Address...");

        const amountAtomic = BigInt(Math.floor(parseFloat(amountToBridge) * 1_000_000));

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

        console.log(">>> [Stellar Bridge XLM] Deposit TX Sent:", depositHash);

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

        console.log(">>> [Stellar Bridge XLM] Success! Funds bridged via 1-Click.");

        // Step 4: Submit TX Hash to 1-Click API (As per 6-full-swap.ts)
        console.log(">>> [Stellar Bridge XLM] Step 4: Submitting TX Hash to 1-Click API...");
        await submitTxHash(depositHash, quoteResult.depositAddress);

        return NextResponse.json<StellarBridgeResponse>({
            success: true,
            transactionHash: depositHash
        });

    } catch (error) {
        console.error(">>> [Stellar Bridge XLM] Error:", error);
        return NextResponse.json<StellarBridgeResponse>({
            success: false,
            errorReason: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

