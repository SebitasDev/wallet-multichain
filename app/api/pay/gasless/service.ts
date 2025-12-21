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
import { STELLAR } from "@/app/constants/chais/Stellar";
import * as StellarSdk from "stellar-sdk";

const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY as `0x${string}`;
const FACILITATOR_STELLAR_PRIVATE_KEY = process.env.FACILITATOR_STELLAR_PRIVATE_KEY;

function getFacilitatorStellarKeypair() {
    if (!FACILITATOR_STELLAR_PRIVATE_KEY) {
        throw new Error("Facilitator Stellar private key not configured");
    }
    return StellarSdk.Keypair.fromSecret(FACILITATOR_STELLAR_PRIVATE_KEY);
}

export type GaslessPayParams = {
    chain: string; // "base" | "stellar"
    amountStr: string;
    recipient: string;
    payload: any; // signature (string) or signedXDR (string)
};

export type GaslessPayResponse = {
    success: boolean;
    txHash: string;
    pullHash?: string; // For audit
};

// --- LOGIC: EVM (Base) Gasless Transfer ---
export async function processEvmGaslessPay(params: GaslessPayParams): Promise<GaslessPayResponse> {
    const { chain, amountStr, recipient, payload } = params;

    if (!FACILITATOR_PRIVATE_KEY) throw new Error("Facilitator private key not configured");

    const networkConfig = FACILITATOR_NETWORKS[chain as FacilitatorChainKey];
    if (!networkConfig) throw new Error(`Unsupported EVM chain: ${chain}`);

    const { authorization, signature } = payload;
    if (!authorization || !signature) throw new Error("Missing authorization or signature in payload");

    // Fee Logic
    // Fee: 0.02 USDC, Min: 0.2 USDC
    const FEE_AMOUNT = 0.02 * 1_000_000;
    const MIN_AMOUNT = 0.2 * 1_000_000;

    const amountBigInt = BigInt(authorization.value);

    if (amountBigInt < BigInt(MIN_AMOUNT)) {
        throw new Error(`Amount too low. Minimum required: 0.2 USDC`);
    }

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

    console.log(`>>> [Gasless Pay EVM] Step 1: Pull Funds from ${authorization.from}...`);

    // Step 1: Pull Funds (User -> Facilitator)
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
    console.log(">>> [Gasless Pay EVM] Pull TX:", pullHash);

    const pullReceipt = await publicClient.waitForTransactionReceipt({ hash: pullHash });
    if (pullReceipt.status !== "success") throw new Error("Pull transaction failed");

    // Step 2: Push Funds (Facilitator -> Recipient)
    console.log(`>>> [Gasless Pay EVM] Step 2: Push Funds to ${recipient}...`);

    // Deduct fee
    const amountToSend = amountBigInt - BigInt(FEE_AMOUNT);
    if (amountToSend <= BigInt(0)) throw new Error("Amount after fee is zero or negative");

    const pushHash = await walletClient.writeContract({
        chain: networkConfig.chain,
        address: networkConfig.usdc,
        abi: usdcErc3009Abi,
        functionName: "transfer",
        args: [recipient as Address, amountToSend]
    });
    console.log(">>> [Gasless Pay EVM] Push TX:", pushHash);

    await publicClient.waitForTransactionReceipt({ hash: pushHash });

    return {
        success: true,
        txHash: pushHash,
        pullHash: pullHash
    };
}

// --- LOGIC: Stellar Gasless Transfer ---
export async function processStellarGaslessPay(params: GaslessPayParams): Promise<GaslessPayResponse> {
    const { amountStr, recipient, payload } = params;
    const signedXDR = payload.signedXDR;

    if (!signedXDR) {
        throw new Error("Missing Signed XDR for Stellar transaction");
    }

    // Fee Logic
    // Fee: 0.02 USDC, Min: 0.2 USDC
    const FEE_AMOUNT = 0.02;
    const MIN_AMOUNT = 0.2;

    if (parseFloat(amountStr) < MIN_AMOUNT) {
        throw new Error(`Amount too low. Minimum required: 0.2 USDC`);
    }

    console.log(">>> [Gasless Pay Stellar] Processing request...");

    const server = new StellarSdk.Horizon.Server(STELLAR.serverURL);
    const facilitatorKeypair = getFacilitatorStellarKeypair();

    // 1. Submit User's Funding Transaction (Pull)
    console.log(">>> [Gasless Pay Stellar] Submitting User Funding TX (XDR)...");
    let fundingHash = "";
    try {
        const tx = StellarSdk.TransactionBuilder.fromXDR(signedXDR, STELLAR.networkPassphrase);
        // Verify amount in tx matches usage if needed, but for now relying on what we received
        // Ideally we decode tx to verify amount

        const fundingResult = await server.submitTransaction(tx);
        fundingHash = fundingResult.hash;
        console.log(">>> [Gasless Pay Stellar] Funding TX Success:", fundingHash);
    } catch (e: any) {
        const errorMsg = e.response?.data?.extras?.result_codes?.operations?.[0] || e.message;
        console.error(">>> [Gasless Pay Stellar] Funding TX Failed:", e.response?.data?.extras?.result_codes || e.message);
        throw new Error("Failed to pull funds from user: " + errorMsg);
    }

    // 2. Facilitator executes Push (Facilitator -> Recipient)
    console.log(`>>> [Gasless Pay Stellar] Pushing funds to ${recipient}...`);

    // Verify recipient address validity? (StellarSdk checks this loosely on build)

    const account = await server.loadAccount(facilitatorKeypair.publicKey());
    const usdcAsset = new StellarSdk.Asset(STELLAR.code, STELLAR.usdc);

    // Calculate net amount
    const netAmount = (parseFloat(amountStr) - FEE_AMOUNT).toFixed(7); // Stellar precision check

    const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: STELLAR.networkPassphrase
    })
        .addOperation(StellarSdk.Operation.payment({
            destination: recipient,
            asset: usdcAsset,
            amount: netAmount
        }))
        .setTimeout(30)
        .build();

    transaction.sign(facilitatorKeypair);

    const result = await server.submitTransaction(transaction);
    console.log(">>> [Gasless Pay Stellar] Push TX Success:", result.hash);

    return {
        success: true,
        txHash: result.hash,
        pullHash: fundingHash
    };
}
