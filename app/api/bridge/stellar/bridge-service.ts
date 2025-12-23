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
import { STELLAR } from "@/app/constants/chais/Stellar";
import * as StellarSdk from "stellar-sdk";

const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY as `0x${string}`;
const FACILITATOR_STELLAR_PRIVATE_KEY = process.env.FACILITATOR_STELLAR_PRIVATE_KEY;

function getFacilitatorKeypair() {
    if (!FACILITATOR_STELLAR_PRIVATE_KEY) {
        throw new Error("Facilitator Stellar private key not configured");
    }
    return StellarSdk.Keypair.fromSecret(FACILITATOR_STELLAR_PRIVATE_KEY);
}

export type BridgeServiceParams = {
    amountStr: string;
    sourceChain: string;
    targetChain?: string; // Optional for Stellar->EVM (defaults to Base)
    recipientStellar?: string;
    recipientOther?: string;
    paymentPayload?: any;
    signedXDR?: string;
    fee: number;
};

// --- LOGIC: Stellar -> EVM ---
export async function processStellarToEvm(params: BridgeServiceParams): Promise<StellarBridgeResponse> {
    const { amountStr, sourceChain, recipientOther, signedXDR, fee } = params;
    const destinationChain = params.targetChain || "Base";

    if (!recipientOther) {
        throw new Error("Recipient address is required for Stellar -> EVM transfer");
    }
    if (!signedXDR) {
        throw new Error("Missing Signed XDR: User must sign the funding transaction.");
    }

    console.log(">>> [Stellar Bridge USDC] Processing Stellar -> EVM request");

    try {
        const server = new StellarSdk.Horizon.Server(STELLAR.nonEvm!.serverURL!);

        // 1. Submit User's Funding Transaction
        console.log(">>> [Stellar Bridge USDC] Submitting User Funding TX (XDR)...");
        try {
            const tx = StellarSdk.TransactionBuilder.fromXDR(signedXDR, STELLAR.nonEvm!.networkPassphrase!);
            const fundingResult = await server.submitTransaction(tx);
            console.log(">>> [Stellar Bridge USDC] Funding TX Success:", fundingResult.hash);
        } catch (e: any) {
            const errorMsg = e.response?.data?.extras?.result_codes?.operations?.[0] || e.message;
            console.error(">>> [Stellar Bridge USDC] Funding TX Failed:", e.response?.data?.extras?.result_codes || e.message);
            throw new Error("Failed to pull funds from user: " + errorMsg);
        }

        // 2. Facilitator executes
        const sourceKeypair = getFacilitatorKeypair();
        const facilitatorAddress = sourceKeypair.publicKey();

        const amountNum = parseFloat(amountStr);
        const amountToBridge = (amountNum - fee).toFixed(6);

        // Get Quote
        const quoteResult = await getOneClickQuote({
            amount: amountToBridge,
            sourceChain: "Stellar",
            destinationChain: destinationChain,
            userSenderAddress: facilitatorAddress,
            recipientStellar: recipientOther
        });

        console.log(">>> [Stellar Bridge USDC] Quote Received:", quoteResult.depositAddress);

        const quoteData = quoteResult.quote.quote as any;
        const memoText = quoteData.depositMemo || quoteData.memo;
        if (!memoText) throw new Error("No memo returned from quote");

        const depositAddress = quoteResult.depositAddress;

        // Load Account & Build TX
        const account = await server.loadAccount(facilitatorAddress);
        const usdcAddress = STELLAR.assets.find(a => a.name === "USDC")?.address;
        if (!usdcAddress) throw new Error("USDC address not found in STELLAR config");
        const usdcAsset = new StellarSdk.Asset("USDC", usdcAddress);

        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: "100000",
            networkPassphrase: STELLAR.nonEvm!.networkPassphrase!
        })
            .addOperation(StellarSdk.Operation.payment({
                destination: depositAddress,
                asset: usdcAsset,
                amount: amountToBridge
            }))
            .addMemo(StellarSdk.Memo.text(memoText))
            .setTimeout(30)
            .build();

        transaction.sign(sourceKeypair);

        console.log(">>> [Stellar Bridge USDC] Submitting Facilitator -> Bridge Transaction...");
        const result = await server.submitTransaction(transaction);
        console.log(">>> [Stellar Bridge USDC] Stellar TX Submitted! Hash:", result.hash);

        return {
            success: true,
            transactionHash: result.hash,
            depositAddress: depositAddress,
            memo: memoText
        };

    } catch (err) {
        throw err;
    }
}

// --- LOGIC: EVM -> Stellar ---
export async function processEvmToStellar(params: BridgeServiceParams): Promise<StellarBridgeResponse> {
    const { amountStr, sourceChain, recipientStellar, paymentPayload, fee } = params;

    if (!paymentPayload) throw new Error("Payment payload required for EVM source");
    if (!FACILITATOR_PRIVATE_KEY) throw new Error("Facilitator private key not configured");

    const networkConfig = FACILITATOR_NETWORKS[sourceChain as FacilitatorChainKey];
    if (!networkConfig) throw new Error(`Unsupported chain: ${sourceChain}`);

    const { authorization, signature } = paymentPayload;

    // Setup clients
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

    const { v, r, s } = parseSignature(signature);

    const amountNum = parseFloat(amountStr);
    const amountToBridge = (amountNum - fee).toFixed(6);

    console.log(">>> [Stellar Bridge USDC] Step 1: Pull Funds via EIP-3009...");

    // Step 1: Pull Funds
    const pullHash = await walletClient.writeContract({
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
    console.log(">>> [Stellar Bridge USDC] Pull TX:", pullHash);

    const pullReceipt = await publicClient.waitForTransactionReceipt({ hash: pullHash });
    if (pullReceipt.status !== "success") throw new Error("Pull transaction failed");

    // Step 2: Quote
    console.log(">>> [Stellar Bridge USDC] Step 2: Get Quote...");
    let quoteResult;
    try {
        quoteResult = await getOneClickQuote({
            amount: amountToBridge,
            sourceChain,
            destinationChain: "Stellar",
            recipientStellar: recipientStellar || authorization.from,
            userSenderAddress: authorization.from.toString()
        });
    } catch (err) {
        // Here we throw, but in route we might want to catch to return specific JSON. 
        // For simplicity now, we throw.
        throw new Error(`1-Click Quote Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    }

    // Step 3: Send to Deposit Address
    console.log(">>> [Stellar Bridge USDC] Step 3: Send to Deposit Address...");
    const amountAtomic = BigInt(Math.floor(parseFloat(amountToBridge) * 1_000_000));

    const depositHash = await walletClient.writeContract({
        chain: networkConfig.chain,
        address: networkConfig.usdc,
        abi: usdcErc3009Abi,
        functionName: "transfer",
        args: [quoteResult.depositAddress as Address, amountAtomic]
    });
    console.log(">>> [Stellar Bridge USDC] Deposit TX:", depositHash);

    const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositHash });
    if (depositReceipt.status !== "success") throw new Error("Deposit to Bridge failed (Funds stuck)");

    // Step 4: Submit Hash
    await submitTxHash(depositHash, quoteResult.depositAddress);

    return {
        success: true,
        transactionHash: depositHash
    };
}
