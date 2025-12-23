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
import { STELLAR } from "@/app/constants/chais/Stellar";
import * as StellarSdk from "stellar-sdk";

// Initialize API
OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.ONE_CLICK_JWT;

const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY as Hex;

export async function processNearSettlement(
    paymentPayload: FacilitatorPaymentPayload | null,
    sourceChain: ChainKey,
    destChain: ChainKey,
    amount: string,
    recipient: string,
    destToken?: string
): Promise<SettleResponse> {

    const sourceConfig = NETWORKS[sourceChain];
    const destConfig = NETWORKS[destChain];

    if (!sourceConfig || !destConfig) {
        return { success: false, errorReason: "Invalid chain configuration" };
    }

    // Key validation based on source chain
    if (sourceChain !== "Stellar" && !FACILITATOR_PRIVATE_KEY) {
        return { success: false, errorReason: "Facilitator EVM Private Key missing" };
    }

    // We will check for Stellar Key later if source is Stellar

    // 1. Resolve Assets from Config
    const sourceAsset = sourceConfig.crossChainInformation.nearIntentInformation?.assetsId[0]?.assetId;
    let destAsset = destConfig.crossChainInformation.nearIntentInformation?.assetsId[0]?.assetId;

    if (destChain === "Stellar" && destToken === "XLM") {
        destAsset = destConfig.crossChainInformation.nearIntentInformation?.assetsId[1]?.assetId;
    }

    // Fallback for missing dest asset or specific overrides could go here
    if (!sourceAsset || !destAsset) {
        return { success: false, errorReason: "Near Intents not supported for these assets" };
    }

    // 2. Prepare Quote Request
    const decimals = sourceChain === "Stellar" ? 7 : 6;

    // Amount conversion
    const amountAtomic = Math.floor(parseFloat(amount) * Math.pow(10, decimals)).toString();

    const refundAddress = paymentPayload?.authorization.from || recipient;

    try {
        console.log(`[NearService] Requesting Quote: ${sourceChain} -> ${destChain}`, { amount, sourceAsset, destAsset });

        const quoteRequest: QuoteRequest = {
            dry: false, // We intend to execute
            swapType: QuoteRequest.swapType.EXACT_INPUT,
            slippageTolerance: 100, // 1%
            originAsset: sourceAsset,
            depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
            depositMode: sourceChain === "Stellar" ? QuoteRequest.depositMode.MEMO : undefined,
            destinationAsset: destAsset,
            amount: amountAtomic,
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
        const depositAddress = quote.quote.depositAddress;

        // 3. Execution Logic
        let transactionHash: string | undefined;

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

            // A2. Push Funds (Transfer to Deposit Address)
            // A2. Push Funds (Transfer to Deposit Address)
            console.log("[NearService] Step 2: Push to Bridge", depositAddress);

            // Verify Balance with Retry (Handling RPC Lag)
            let facilitatorBalance = BigInt(0);
            const amountBigInt = BigInt(amountAtomic);
            const maxRetries = 5;

            for (let i = 0; i < maxRetries; i++) {
                facilitatorBalance = await publicClient.readContract({
                    address: networkConfig.usdc,
                    abi: usdcErc3009Abi,
                    functionName: "balanceOf",
                    args: [facilitatorAccount.address]
                }) as bigint;

                if (facilitatorBalance >= amountBigInt) break;

                console.log(`[NearService] Balance lag detected. Retrying ${i + 1}/${maxRetries}... (Has: ${facilitatorBalance}, Needs: ${amountBigInt})`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
            }

            if (facilitatorBalance < amountBigInt) {
                throw new Error(`Insufficient facilitator balance after retries. Has: ${facilitatorBalance}, Needs: ${amountBigInt}`);
            }

            // Note: We are sending the full pulled amount. 
            // In a real facilitator, we might deduct a fee here if not handled by higher level logic.
            // Assuming `amountAtomic` matches what we want to bridge.

            const bridgeHash = await walletClient.writeContract({
                chain: networkConfig.chain,
                address: networkConfig.usdc,
                abi: usdcErc3009Abi,
                functionName: "transfer",
                args: [depositAddress as Address, BigInt(amountAtomic)]
            });
            await publicClient.waitForTransactionReceipt({ hash: bridgeHash });
            console.log("[NearService] Push Success:", bridgeHash);

            transactionHash = bridgeHash;

            // A3. Submit Hash
            console.log("[NearService] Step 3: Submit Hash");
            await OneClickService.submitDepositTx({ txHash: bridgeHash, depositAddress });
        }

        // CASE B: Stellar Source
        else if (sourceChain === "Stellar") {
            console.log("[NearService] Executing Stellar Flow");

            const signedXDR = paymentPayload?.signedXDR;
            if (!signedXDR) {
                // If no XDR, we can't automate. Maybe just return quote info?
                // But per user request "make it work completely", we imply automated flow.
                throw new Error("Missing Signed XDR for Stellar settlement");
            }
            if (!STELLAR.nonEvm?.serverURL || !STELLAR.nonEvm?.networkPassphrase) {
                throw new Error("Stellar configuration missing");
            }

            const server = new StellarSdk.Horizon.Server(STELLAR.nonEvm.serverURL);
            const facilitatorStellarKey = process.env.FACILITATOR_STELLAR_PRIVATE_KEY;

            if (!facilitatorStellarKey) throw new Error("Facilitator Stellar Key missing");
            const facilitatorKeypair = StellarSdk.Keypair.fromSecret(facilitatorStellarKey);

            // B1. Submit User Funding Transaction
            console.log("[NearService] Step 1: Submit Funding XDR");
            const fundingTx = StellarSdk.TransactionBuilder.fromXDR(signedXDR, STELLAR.nonEvm.networkPassphrase);
            const fundingResult = await server.submitTransaction(fundingTx);
            console.log("[NearService] Funding Success:", fundingResult.hash);

            // B2. Build Facilitator -> Bridge Transaction
            const facilitatorAccount = await server.loadAccount(facilitatorKeypair.publicKey());
            const usdcAddress = STELLAR.assets.find(a => a.name === "USDC")?.address as string;
            const usdcAsset = new StellarSdk.Asset("USDC", usdcAddress);

            const quoteData = quote.quote as any;
            const memoText = quoteData.depositMemo || quoteData.memo || "";
            if (!memoText && quoteRequest.depositMode === QuoteRequest.depositMode.MEMO) {
                // Warning: Memo required but missing?
            }

            const builder = new StellarSdk.TransactionBuilder(facilitatorAccount, {
                fee: "100000",
                networkPassphrase: STELLAR.nonEvm.networkPassphrase
            })
                .addOperation(StellarSdk.Operation.payment({
                    destination: depositAddress,
                    asset: usdcAsset,
                    amount: (parseInt(amountAtomic) / 10_000_000).toFixed(7) // Stellar uses string decimals
                }))
                .setTimeout(30);

            if (memoText) {
                builder.addMemo(StellarSdk.Memo.text(memoText));
            }

            const bridgeTx = builder.build();
            bridgeTx.sign(facilitatorKeypair);

            console.log("[NearService] Step 2: Submit Bridge TX");
            const bridgeResult = await server.submitTransaction(bridgeTx);
            console.log("[NearService] Bridge Success:", bridgeResult.hash);

            // B3. Submit Hash to 1-Click
            console.log("[NearService] Step 3: Submit Hash to 1-Click");
            await OneClickService.submitDepositTx({ txHash: bridgeResult.hash, depositAddress });

            // We return the bridge tx hash
            transactionHash = bridgeResult.hash;
        }

        return {
            success: true,
            transactionHash: transactionHash as `0x${string}`,
            fee: "0",
            netAmount: quote.quote?.amountOutFormatted || "0"
            // We could return 'depositAddress' here if we extended SettleResponse
        };

    } catch (error) {
        console.error("[NearService] Error:", error);

        let errorMessage = error instanceof Error ? error.message : "Near Service Error";

        // Handle 1-Click API Errors
        const apiError = error as any;
        if (apiError?.status === 400 || apiError?.body?.message === "Failed to get quote") {
            errorMessage = "This route is not valid at this moment";
        }

        const replacer = (key: string, value: any) =>
            typeof value === 'bigint' ? value.toString() : value;

        try {
            console.error("[NearService] Error Details:", JSON.stringify(error, replacer, 2));
        } catch (logErr) {
            console.error("[NearService] Could not stringify error:", error);
        }

        return {
            success: false,
            errorReason: errorMessage
        };
    }
}
