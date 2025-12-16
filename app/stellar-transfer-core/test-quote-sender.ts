// @ts-nocheck
import { OpenAPI, OneClickService, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import "dotenv/config";

// Initialize API
OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.ONE_CLICK_JWT;

const originAsset = "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near";
const destinationAsset = "nep245:v2_1.omni.hot.tg:1100_111bzQBB65GxAPAVoxqmMcgYo5oS3txhqs1Uh1cgahKQUeTUq1TJu";
const amount = "300000"; // 0.3 USDC
const senderAddress = "0xF2dc6F3d0dd5ED6E9A794ea5914C85d6012b25A9";
const recipientAddress = "GCXWKC7KWZU7C7IJUM2P5PO2PAFMJAKSDELEUPGXSB7KKPS25KVSQXZA"; // User requested SAME sender as recipient

async function testQuoteSender() {
    console.log(">>> [Test Quote] Requesting Quote with Sender as Recipient...");
    console.log("Params:", { originAsset, destinationAsset, amount, recipient: recipientAddress });

    try {
        const quoteRequest: QuoteRequest = {
            dry: false,
            swapType: QuoteRequest.swapType.EXACT_INPUT,
            slippageTolerance: 100,
            originAsset,
            depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
            destinationAsset,
            amount,
            refundTo: senderAddress,
            refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
            recipient: recipientAddress,
            recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
            deadline: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
            referral: "multichain-wallet",
            quoteWaitingTimeMs: 5000,
        };

        const quote = await OneClickService.getQuote(quoteRequest);
        console.log(">>> SUCCESS! Quote Received:", JSON.stringify(quote, null, 2));

    } catch (error: any) {
        console.error(">>> FAIL! Error:", error);
        if (error.body) {
            console.error(">>> Error Body:", JSON.stringify(error.body, null, 2));
        }
    }
}

if (require.main === module) {
    testQuoteSender();
}
