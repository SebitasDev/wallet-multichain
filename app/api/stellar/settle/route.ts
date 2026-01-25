import { NextRequest, NextResponse } from "next/server";
import * as StellarSdk from "stellar-sdk";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { SettleResponse, FacilitatorPaymentPayload } from "@/app/facilitator/types";
import { ChainKey } from "@/app/types/chain";
import { OpenAPI, OneClickService } from '@defuse-protocol/one-click-sdk-typescript';

// Initialize 1-Click API
// Note: This logic was previously in app/api/bridge/services/near.ts
OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.ONE_CLICK_JWT;

const FACILITATOR_STELLAR_PRIVATE_KEY = process.env.FACILITATOR_STELLAR_PRIVATE_KEY;

export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ success: false, errorReason: "Invalid JSON body" }, { status: 400 });
        }

        const {
            paymentPayload,
            sourceChain,
            destChain,
            recipient,
            amount,
            destToken,
            sourceToken,
            senderAddress // Refund address
        } = body;

        if (sourceChain !== "Stellar") {
            return NextResponse.json({ success: false, errorReason: "Only Stellar source supported by this endpoint" }, { status: 400 });
        }

        const signedXDR = (paymentPayload as any)?.signedXDR;
        if (!signedXDR) {
            return NextResponse.json({ success: false, errorReason: "Missing signedXDR" }, { status: 400 });
        }

        // 1. Submit User -> Facilitator TX (Pull)
        console.log("[StellarSettle] Submitting Stellar User -> Facilitator TX...");
        const serverUrl = NETWORKS["Stellar"]?.nonEvm?.rpcUrl;
        if (!serverUrl) throw new Error("Stellar server URL not configured");

        const server = new StellarSdk.Horizon.Server(serverUrl);
        let pullHash: string;

        try {
            // Re-construct tx to submit
            // Note: networkPassphrase might be needed if SDK logic requires it for hash calculation or validation, 
            // but for submission usually just XDR is enough if signed. 
            // However, Builder.fromXDR needs passphrase.
            const passphrase = NETWORKS["Stellar"]?.nonEvm?.networkPassphrase;
            const tx = StellarSdk.TransactionBuilder.fromXDR(signedXDR, passphrase || StellarSdk.Networks.PUBLIC);

            const result = await server.submitTransaction(tx);
            pullHash = result.hash;
            console.log("[StellarSettle] Pull Success:", pullHash);
        } catch (e: any) {
            console.error("Stellar Submit Error", e.response?.data?.extras?.result_codes || e.message);
            return NextResponse.json({ success: false, errorReason: "Stellar Pull Failed: " + (e.message || "Unknown") }, { status: 500 });
        }

        // 2. Get Quote (needed for deposit address and memo) from 1-Click
        // We reuse logic similar to getNearQuote but minimal here for Stellar flow
        // Or we can just call OneClickService.getQuote directly.

        const sourceConfig = NETWORKS["Stellar"];
        const destConfig = NETWORKS[destChain as ChainKey];
        if (!destConfig) throw new Error("Invalid dest chain");

        // Identify Assets
        const sourceAssetInfo = sourceConfig.assets.find(a => a.name === (sourceToken || "USDC"));
        const destAssetInfo = destConfig.crossChainInformation.nearIntentInformation?.assetsId.find(
            a => a.name === (destToken || "USDC")
        ) || destConfig.crossChainInformation.nearIntentInformation?.assetsId[0];

        if (!sourceAssetInfo || !destAssetInfo) {
            throw new Error("Asset info missing for quote");
        }

        const decimals = sourceAssetInfo.decimals || 7;
        const amountAtomicTotal = Math.floor(parseFloat(amount) * Math.pow(10, decimals));

        // Fee Logic (Keep consistent with deprecated code)
        const isDev = process.env.NEXT_PUBLIC_ENVIROMENT === "development" || process.env.NODE_ENV === "development";
        const feeValue = isDev ? 0 : 0.02;
        const feeUnits = Math.floor(feeValue * Math.pow(10, decimals));
        const amountAtomicNet = (amountAtomicTotal - feeUnits).toString();

        if (BigInt(amountAtomicNet) <= 0) {
            throw new Error("Amount too small to cover fees");
        }

        // Quote Params
        const quoteRequest = {
            dry: false,
            swapType: "EXACT_INPUT",
            slippageTolerance: 100,
            originAsset: sourceAssetInfo.address || "usdc", // Adjust if Stellar uses special ID? 
            // Wait, existing code used `sourceAssetInfo?.assetId` from nearIntentInformation.
            // Stellar config in NETWORKS has nearIntentInformation.assetsId? 
            // Let's check NETWORKS definition in chainsInformation.tsx again.
            // Yes: assetsId: [{name: "USDC", assetId: "usdc.fakes.testnet"}]
            depositType: "ORIGIN_CHAIN",
            depositMode: "MEMO",
            destinationAsset: destAssetInfo.assetId,
            amount: amountAtomicNet,
            refundTo: senderAddress || recipient,
            refundType: "ORIGIN_CHAIN",
            recipient: recipient,
            recipientType: "DESTINATION_CHAIN",
            deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            referral: "1llet",
            quoteWaitingTimeMs: 10000,
        };

        // Need the source ASSET ID for OneClick.
        // In NETWORKS['Stellar'], we defined `crossChainInformation.nearIntentInformation`.
        const sourceNearInfo = sourceConfig.crossChainInformation.nearIntentInformation?.assetsId.find(a => a.name === (sourceToken || "USDC"));
        if (sourceNearInfo) {
            (quoteRequest as any).originAsset = sourceNearInfo.assetId;
        } else {
            // Fallback or error?
            // Existing code: `sourceAssetInfo?.assetId` (from nearIntentInfo)
        }

        console.log("[StellarSettle] Getting Quote for Push...");
        const quote = await OneClickService.getQuote(quoteRequest as any);
        if (!quote.quote?.depositAddress) {
            throw new Error("No deposit address returned");
        }
        const depositAddress = quote.quote.depositAddress;

        // 3. Push Funds (Facilitator -> Bridge)
        if (!FACILITATOR_STELLAR_PRIVATE_KEY) throw new Error("FACILITATOR_STELLAR_PRIVATE_KEY missing");

        const facilitatorKeypair = StellarSdk.Keypair.fromSecret(FACILITATOR_STELLAR_PRIVATE_KEY);
        const facilitatorAccount = await server.loadAccount(facilitatorKeypair.publicKey());

        // Resolve Asset for Push
        const assetAddr = sourceAssetInfo.address;
        let asset: StellarSdk.Asset;
        if (sourceToken === "XLM" || !assetAddr) {
            asset = StellarSdk.Asset.native();
        } else {
            // Use asset ID logic or address? Stellar asset is Code + Issuer. 
            // NETWORKS assets should have `address` as Issuer for non-native.
            asset = new StellarSdk.Asset(sourceToken || "USDC", assetAddr);
        }

        // Resolve Memo
        let memo: StellarSdk.Memo = StellarSdk.Memo.none();
        const quoteAny = quote.quote as any;
        const quoteMemo = quoteAny.depositMemo || quoteAny.memo;
        if (quoteMemo) {
            memo = StellarSdk.Memo.text(String(quoteMemo));
        }

        // Calculate decimal amount from net atomic
        const amountDecimal = (Number(amountAtomicNet) / Math.pow(10, decimals)).toFixed(decimals);

        const pushTx = new StellarSdk.TransactionBuilder(facilitatorAccount, {
            fee: "100000",
            networkPassphrase: NETWORKS["Stellar"]?.nonEvm?.networkPassphrase!
        })
            .addOperation(StellarSdk.Operation.payment({
                destination: depositAddress,
                asset: asset,
                amount: amountDecimal
            }))
            .addMemo(memo)
            .setTimeout(30)
            .build();

        pushTx.sign(facilitatorKeypair);
        const pushResult = await server.submitTransaction(pushTx);
        const pushHash = pushResult.hash;
        console.log("[StellarSettle] Push Success:", pushHash);

        // 4. Submit Hash to 1-Click
        await OneClickService.submitDepositTx({ txHash: pushHash, depositAddress });

        return NextResponse.json<SettleResponse>({
            success: true,
            transactionHash: pushHash as `0x${string}`,
            fee: "0",
            netAmount: quote.quote?.amountOutFormatted || "0"
        });

    } catch (error: any) {
        console.error("[StellarSettle] Error:", error);
        return NextResponse.json({ success: false, errorReason: error.message || "Internal Server Error" }, { status: 500 });
    }
}
