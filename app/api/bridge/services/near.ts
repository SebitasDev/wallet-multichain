import { OpenAPI, OneClickService, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { SettleResponse, FacilitatorPaymentPayload } from "@/app/facilitator/types";
import {
    createPublicClient,
    createWalletClient,
    http,
    parseSignature,
    Address,
    Hex
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { FACILITATOR_NETWORKS } from "@/app/facilitator/evm/config";
import { FacilitatorChainKey } from "@/app/facilitator/config";
import { usdcErc3009Abi } from "@/app/facilitator/evm/usdcErc3009Abi";
import { STELLAR } from "@/app/constants/chais/NoEvm/Stellar";
import * as StellarSdk from "stellar-sdk";
import { BridgeStrategy, BridgeContext } from "./types";

// Initialize API
OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.ONE_CLICK_JWT;

const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY as Hex;

export class NearStrategy implements BridgeStrategy {
    name = "NearIntents";

    canHandle(context: BridgeContext): boolean {
        const { sourceChain, destChain } = context;
        const sourceConfig = NETWORKS[sourceChain];
        const destConfig = NETWORKS[destChain];

        if (!sourceConfig || !destConfig) return false;

        const sourceNear = sourceConfig.crossChainInformation.nearIntentInformation?.support;
        const destNear = destConfig.crossChainInformation.nearIntentInformation?.support;

        return !!(sourceNear && destNear);
    }

    async execute(context: BridgeContext): Promise<SettleResponse> {
        const { paymentPayload, sourceChain, destChain, amount, recipient, destToken, sourceToken, senderAddress } = context;

        return processNearSettlement(
            paymentPayload,
            sourceChain,
            destChain,
            amount,
            recipient,
            destToken,
            sourceToken,
            senderAddress
        );
    }
}

export async function getNearQuote(
    sourceChain: ChainKey,
    destChain: ChainKey,
    amount: string,
    destToken?: string,
    sourceToken?: string,
    recipient?: string,
    senderAddress?: string
) {
    const sourceConfig = NETWORKS[sourceChain];
    const destConfig = NETWORKS[destChain];

    if (!sourceConfig || !destConfig) {
        throw new Error("Invalid chain configuration");
    }

    const sourceAssetInfo = sourceConfig.crossChainInformation.nearIntentInformation?.assetsId.find(
        (a) => a.name === (sourceToken || "USDC")
    ) || sourceConfig.crossChainInformation.nearIntentInformation?.assetsId[0];

    const destAssetInfo = destConfig.crossChainInformation.nearIntentInformation?.assetsId.find(
        (a) => a.name === (destToken || "USDC")
    ) || destConfig.crossChainInformation.nearIntentInformation?.assetsId[0];

    const sourceAsset = sourceAssetInfo?.assetId;
    const destAsset = destAssetInfo?.assetId;

    if (!sourceAsset || !destAsset) {
        throw new Error("Near Intents not supported for these assets");
    }

    const decimals = sourceAssetInfo?.decimals || (sourceChain === "Stellar" ? 7 : 6);
    const amountAtomicTotal = Math.floor(parseFloat(amount) * Math.pow(10, decimals));
    const isDev = process.env.NEXT_PUBLIC_ENVIROMENT === "development" || process.env.NODE_ENV === "development";
    const feeValue = isDev ? 0 : 0.02;

    const feeUnits = Math.floor(feeValue * Math.pow(10, decimals));
    const amountAtomicNet = (amountAtomicTotal - feeUnits).toString();

    if (BigInt(amountAtomicNet) <= 0) {
        throw new Error("Amount too small to cover fees");
    }

    if (!recipient) {
        throw new Error("Recipient address is required for NEAR Quote");
    }

    const refundAddress = senderAddress || recipient;

    console.log(`[NearService] Requesting Quote: ${sourceChain} -> ${destChain}`, { amount, sourceAsset, destAsset });

    const quoteRequest: QuoteRequest = {
        dry: false,
        swapType: QuoteRequest.swapType.EXACT_INPUT,
        slippageTolerance: 100,
        originAsset: sourceAsset as string,
        depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
        depositMode: sourceChain === "Stellar" ? QuoteRequest.depositMode.MEMO : undefined,
        destinationAsset: destAsset as string,
        amount: amountAtomicNet,
        refundTo: refundAddress,
        refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
        recipient: recipient,
        recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
        deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        referral: "1llet",
        quoteWaitingTimeMs: 10000,
    };

    const quote = await OneClickService.getQuote(quoteRequest);

    if (!quote.quote?.depositAddress) {
        throw new Error("No deposit address returned from 1-Click Quote");
    }

    return {
        quote,
        depositAddress: quote.quote.depositAddress,
        amountAtomicTotal: BigInt(amountAtomicTotal),
        amountAtomicNet
    };
}

export async function processNearSettlement(
    paymentPayload: FacilitatorPaymentPayload | null,
    sourceChain: ChainKey,
    destChain: ChainKey,
    amount: string,
    recipient: string,
    destToken?: string,
    sourceToken?: string,
    senderAddress?: string
): Promise<SettleResponse> {

    // Key validation based on source chain
    if (sourceChain !== "Stellar" && !FACILITATOR_PRIVATE_KEY) {
        return { success: false, errorReason: "Facilitator EVM Private Key missing" };
    }

    // 1. Get Quote
    let quoteResult;
    try {
        quoteResult = await getNearQuote(
            sourceChain,
            destChain,
            amount,
            destToken,
            sourceToken,
            recipient,
            senderAddress || paymentPayload?.authorization?.from
        );
    } catch (e: any) {
        return { success: false, errorReason: e.message };
    }

    const { quote, depositAddress, amountAtomicTotal, amountAtomicNet } = quoteResult;

    try {
        // CASE A: EVM Source (Pull -> Push -> Submit)
        if (sourceChain !== "Stellar" && paymentPayload) {
            console.log(`[NearService] Executing EVM Flow: ${sourceChain} -> ${destChain}`);

            const networkConfig = FACILITATOR_NETWORKS[sourceChain as FacilitatorChainKey];
            if (!networkConfig) throw new Error(`Facilitator config missing for ${sourceChain}`);

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

            const { authorization, signature } = paymentPayload;
            const { v, r, s } = parseSignature(signature);

            // A1. Pull Funds (TransferWithAuthorization)
            console.log("[NearService] Step 1: Pull Funds via EIP-3009");
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
            await publicClient.waitForTransactionReceipt({ hash: pullHash });
            console.log("[NearService] Pull Success:", pullHash);

            // Execute Bridge Logic
            return executeNearBridge(
                sourceChain,
                destChain,
                amount,
                recipient,
                pullHash,
                quote,
                depositAddress,
                amountAtomicTotal,
                amountAtomicNet,
                sourceToken // Pass sourceToken
            );
        }
        else if (sourceChain === "Stellar") {
            const signedXDR = paymentPayload?.signedXDR;
            if (!signedXDR) return { success: false, errorReason: "Missing signedXDR for Stellar transfer" };

            // 1. Submit User -> Facilitator TX
            console.log("[NearService] Submitting Stellar User -> Facilitator TX...");
            const serverUrl = STELLAR.nonEvm?.serverURL;

            if (!serverUrl) throw new Error("Stellar server URL not configured");
            const server = new StellarSdk.Horizon.Server(serverUrl);

            let pullHash: string;
            try {
                const passphrase = STELLAR.nonEvm?.networkPassphrase;
                const tx = StellarSdk.TransactionBuilder.fromXDR(signedXDR, passphrase || StellarSdk.Networks.PUBLIC);
                const result = await server.submitTransaction(tx);
                pullHash = result.hash;
                console.log("[NearService] Pull Success (Stellar):", pullHash);
            } catch (e: any) {
                console.error("Stellar Submit Error", e.response?.data?.extras?.result_codes || e.message);
                return { success: false, errorReason: "Stellar Pull Failed: " + (e.message || "Unknown") };
            }

            // 2. Execute Bridge (Facilitator -> Bridge)
            return executeStellarBridge(
                sourceChain,
                destChain,
                amount,
                recipient,
                pullHash,
                quote,
                depositAddress,
                amountAtomicNet,
                sourceToken
            );
        }

        return { success: false, errorReason: "Invalid flow" };

    } catch (error: any) {
        console.error("[NearService] Error:", error);
        return { success: false, errorReason: error.message || "Near Service Error" };
    }
}

export async function executeNearBridge(
    sourceChain: ChainKey,
    destChain: ChainKey,
    amount: string,
    recipient: string,
    pullHash: string,
    quote: any,
    depositAddress: string,
    amountAtomicTotal: bigint,
    amountAtomicNet: string,
    sourceToken?: string // Added sourceToken
): Promise<SettleResponse> {
    const facilitatorNetworkConfig = FACILITATOR_NETWORKS[sourceChain as FacilitatorChainKey];
    if (!facilitatorNetworkConfig) throw new Error(`Facilitator config missing for ${sourceChain}`);

    // Lookup valid token address from global NETWORKS config
    const globalNetworkConfig = NETWORKS[sourceChain];
    const tokenInfo = globalNetworkConfig.assets.find(a => a.name === (sourceToken || "USDC"));
    if (!tokenInfo) throw new Error(`Token info not found for ${sourceToken || "USDC"}`);

    const tokenAddress = tokenInfo.address as Address;

    const facilitatorAccount = privateKeyToAccount(FACILITATOR_PRIVATE_KEY);
    const walletClient = createWalletClient({
        account: facilitatorAccount,
        chain: facilitatorNetworkConfig.chain,
        transport: http(facilitatorNetworkConfig.rpcUrl)
    });
    const publicClient = createPublicClient({
        chain: facilitatorNetworkConfig.chain,
        transport: http(facilitatorNetworkConfig.rpcUrl)
    });

    const isNative = tokenAddress === "0x0000000000000000000000000000000000000000" || tokenAddress.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

    // A2. Push Funds (Transfer to Deposit Address)
    console.log(`[NearService] Step 2: Push to Bridge (${sourceToken || "USDC"})`, depositAddress);

    // Verify Balance with Retry (Handling RPC Lag)
    let facilitatorBalance = BigInt(0);
    const maxRetries = 10;

    // [FIX] Initial Wait for 7702 Transaction Propagation (User Request: 7s)
    console.log("[NearService] Waiting 7s for funds to arrive...");
    await new Promise(resolve => setTimeout(resolve, 7000));

    for (let i = 0; i < maxRetries; i++) {
        if (isNative) {
            facilitatorBalance = await publicClient.getBalance({
                address: facilitatorAccount.address
            });
        } else {
            facilitatorBalance = await publicClient.readContract({
                address: tokenAddress, // Dynamic Token
                abi: usdcErc3009Abi, // ERC20 ABI is compatible for balanceOf/transfer
                functionName: "balanceOf",
                args: [facilitatorAccount.address]
            }) as bigint;
        }

        if (facilitatorBalance >= amountAtomicTotal) {
            console.log(`[NearService] Balance Verified: ${facilitatorBalance} >= ${amountAtomicTotal}`);
            break;
        }

        console.log(`[NearService] Balance lag detected. Retrying ${i + 1}/${maxRetries}... (Has: ${facilitatorBalance}, Needs: ${amountAtomicTotal})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (facilitatorBalance < amountAtomicTotal) {
        console.error(`[NearService] Insufficient Balance. Has: ${facilitatorBalance}, Needs: ${amountAtomicTotal}`);
        throw new Error(`Insufficient facilitator balance after retries. Has: ${facilitatorBalance}, Needs: ${amountAtomicTotal}`);
    }

    let bridgeHash: Hex;
    if (isNative) {
        bridgeHash = await walletClient.sendTransaction({
            account: facilitatorAccount,
            to: depositAddress as Address,
            value: BigInt(amountAtomicNet),
            chain: facilitatorNetworkConfig.chain
        });
    } else {
        bridgeHash = await walletClient.writeContract({
            chain: facilitatorNetworkConfig.chain,
            address: tokenAddress, // Dynamic Token
            abi: usdcErc3009Abi,
            functionName: "transfer",
            args: [depositAddress as Address, BigInt(amountAtomicNet)]
        });
    }
    await publicClient.waitForTransactionReceipt({ hash: bridgeHash });
    console.log("[NearService] Push Success:", bridgeHash);

    // A3. Submit Hash
    console.log("[NearService] Step 3: Submit Hash");
    await OneClickService.submitDepositTx({ txHash: bridgeHash, depositAddress });

    return {
        success: true,
        transactionHash: bridgeHash,
        fee: "0",
        netAmount: quote.quote?.amountOutFormatted || "0"
    };
}

export async function executeStellarBridge(
    sourceChain: ChainKey,
    destChain: ChainKey,
    amount: string,
    recipient: string,
    pullHash: string,
    quote: any,
    depositAddress: string,
    amountAtomicNet: string,
    sourceToken?: string
): Promise<SettleResponse> {
    const facilitatorKey = process.env.FACILITATOR_STELLAR_PRIVATE_KEY;
    if (!facilitatorKey) throw new Error("FACILITATOR_STELLAR_PRIVATE_KEY missing in environment");

    const sourceConfig = NETWORKS[sourceChain];
    const sourceAssetInfo = sourceConfig.assets.find(a => a.name === (sourceToken || "USDC"));
    if (!sourceAssetInfo) throw new Error("Source asset info not found");

    // Stellar amounts are decimals
    const decimals = sourceAssetInfo.decimals || 7;
    // Calculate decimal amount from atomic net
    const amountVal = BigInt(amountAtomicNet);
    const amountDecimal = (Number(amountVal) / Math.pow(10, decimals)).toFixed(decimals);

    console.log(`[NearService] Step 2: Push to Bridge (Stellar) ${amountDecimal} ${sourceToken || "USDC"} -> ${depositAddress}`);
    console.log(`[NearService] Memo: ${quote.quote.depositMemo || quote.quote.memo}`);

    const serverUrl = STELLAR.nonEvm?.serverURL;
    if (!serverUrl) throw new Error("Stellar configuration missing");

    const server = new StellarSdk.Horizon.Server(serverUrl);
    const keypair = StellarSdk.Keypair.fromSecret(facilitatorKey);
    const sourceAccount = await server.loadAccount(keypair.publicKey());

    // Resolve Asset
    const assetAddr = sourceAssetInfo.address;
    let asset: StellarSdk.Asset;
    if (sourceToken === "XLM" || !assetAddr) {
        asset = StellarSdk.Asset.native();
    } else {
        asset = new StellarSdk.Asset(sourceToken || "USDC", assetAddr);
    }

    // Resolve Memo
    let memo: StellarSdk.Memo = StellarSdk.Memo.none();
    const quoteMemo = quote.quote.depositMemo || quote.quote.memo; // Use depositMemo as primary, fallback to memo
    if (quoteMemo) {
        // Try Text first? Or ID? 1-Click usually uses Memo Text or ID.
        // If purely numeric, could be ID. But standard is often Text for simplicity unless limited.
        // We'll try Text. If it fails due to bytes, fallback or error.
        // SDK 'Memo.text' throws if > 28 bytes.
        memo = StellarSdk.Memo.text(String(quoteMemo));
    }

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: "100000",
        networkPassphrase: STELLAR.nonEvm?.networkPassphrase!
    })
        .addOperation(StellarSdk.Operation.payment({
            destination: depositAddress,
            asset: asset,
            amount: amountDecimal
        }))
        .addMemo(memo)
        .setTimeout(30)
        .build();

    tx.sign(keypair);

    const result = await server.submitTransaction(tx);
    const pushHash = result.hash;
    console.log("[NearService] Push Success (Stellar):", pushHash);

    // Step 3: Submit Hash
    console.log("[NearService] Step 3: Submit Hash");
    await OneClickService.submitDepositTx({ txHash: pushHash, depositAddress });

    return {
        success: true,
        transactionHash: pushHash as `0x${string}`,
        fee: "0",
        netAmount: quote.quote?.amountOutFormatted || "0"
    };
}
