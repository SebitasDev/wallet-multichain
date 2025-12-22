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

export async function processEvmGaslessPay(params: GaslessPayParams): Promise<GaslessPayResponse> {
    const { chain, amountStr, recipient, payload } = params;

    if (!FACILITATOR_PRIVATE_KEY) throw new Error("Facilitator private key not configured");

    // Case-insensitive match for chain key (e.g. "base" -> "Base")
    const chainKey = Object.keys(FACILITATOR_NETWORKS).find(
        key => key.toLowerCase() === chain.toLowerCase()
    ) as FacilitatorChainKey | undefined;

    if (!chainKey) throw new Error(`Unsupported EVM chain: ${chain}`);

    const networkConfig = FACILITATOR_NETWORKS[chainKey];

    const { authorization, signature } = payload;
    if (!authorization || !signature) throw new Error("Missing authorization or signature in payload");

    const FEE_AMOUNT = 0.02 * 1_000_000;
    const MIN_AMOUNT = 0.02 * 1_000_000;

    const amountBigInt = BigInt(authorization.value);

    if (amountBigInt <= BigInt(MIN_AMOUNT)) {
        throw new Error(`Amount too low. Must be greater than 0.02 USDC`);
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
    console.log(">>> [EVM] Pull TX:", pullHash);

    const pullReceipt = await publicClient.waitForTransactionReceipt({ hash: pullHash });
    if (pullReceipt.status !== "success") throw new Error("Pull transaction failed");

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

export async function processStellarGaslessPay(params: GaslessPayParams): Promise<GaslessPayResponse> {
    const { amountStr, recipient, payload } = params;
    const signedXDR = payload.signedXDR;

    if (!signedXDR) {
        throw new Error("Missing Signed XDR for Stellar transaction");
    }

    const FEE_AMOUNT = 0.02;
    const MIN_AMOUNT = 0.02;

    if (parseFloat(amountStr) <= MIN_AMOUNT) {
        throw new Error(`Amount too low. Must be greater than 0.02 USDC`);
    }

    console.log(">>> [Gasless Pay Stellar] Processing request...");

    const serverUrl = STELLAR.nonEvm?.serverURL;
    const passphrase = STELLAR.nonEvm?.networkPassphrase;
    const usdcAddress = STELLAR.assets.find(a => a.name === "USDC")?.address;

    if (!serverUrl || !passphrase || !usdcAddress) {
        throw new Error("Stellar configuration missing");
    }

    const server = new StellarSdk.Horizon.Server(serverUrl);
    const facilitatorKeypair = getFacilitatorStellarKeypair();

    let fundingHash = "";
    try {
        const tx = StellarSdk.TransactionBuilder.fromXDR(signedXDR, passphrase);
        const fundingResult = await server.submitTransaction(tx);
        fundingHash = fundingResult.hash;
        console.log(">>> [Stellar] Funding TX Success:", fundingHash);
    } catch (e: any) {
        const errorMsg = e.response?.data?.extras?.result_codes?.operations?.[0] || e.message;
        console.error(">>> [Gasless Pay Stellar] Funding TX Failed:", e.response?.data?.extras?.result_codes || e.message);
        throw new Error("Failed to pull funds from user: " + errorMsg);
    }

    const account = await server.loadAccount(facilitatorKeypair.publicKey());
    const usdcAsset = new StellarSdk.Asset("USDC", usdcAddress);

    const netAmount = (parseFloat(amountStr) - FEE_AMOUNT).toFixed(7);

    const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: passphrase
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
