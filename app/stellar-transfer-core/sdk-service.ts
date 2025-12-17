import { OpenAPI, OneClickService, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';

// Initialize API
OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.ONE_CLICK_JWT;

export const SOURCE_TOKENS: Record<string, string> = {
    "Base": "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near",
    "Polygon": "nep141:polygon-0x3c499c542cef5e3811e1192ce70d8cc03d5c3359.omft.near",
};

// User provided Asset ID for Stellar USDC (via Omni/Hot bridge representation)
const STELLAR_ASSET_ID = "nep245:v2_1.omni.hot.tg:1100_111bzQBB65GxAPAVoxqmMcgYo5oS3txhqs1Uh1cgahKQUeTUq1TJu";

export async function getOneClickQuote({
    amount,
    sourceChain,
    recipientStellar,
    userSenderAddress,
}: {
    amount: string;
    sourceChain: string;
    recipientStellar: string;
    userSenderAddress: string;
}) {

    const originAsset = SOURCE_TOKENS[sourceChain];
    if (!originAsset) throw new Error(`Unsupported source chain for 1-Click: ${sourceChain}`);

    const destinationAsset = STELLAR_ASSET_ID;

    const amountAtomic = Math.floor(parseFloat(amount) * 1_000_000).toString();

    const quoteRequest: QuoteRequest = {
        dry: false,
        swapType: QuoteRequest.swapType.EXACT_INPUT,
        slippageTolerance: 100, // 1%
        originAsset,
        depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
        depositMode: sourceChain === "Stellar" ? ('MEMO' as any) : undefined,
        destinationAsset,
        amount: amountAtomic,
        refundTo: userSenderAddress,
        refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
        recipient: recipientStellar,
        recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
        deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        referral: "1llet",
        quoteWaitingTimeMs: 5000,
    };

    console.log(">>> [1-Click SDK] Requesting Quote:", { originAsset, destinationAsset, amount: amountAtomic, recipient: recipientStellar });

    try {
        const quote = await OneClickService.getQuote(quoteRequest);

        if (!quote.quote?.depositAddress) {
            throw new Error("No deposit address returned from 1-Click Quote");
        }

        return {
            quote,
            depositAddress: quote.quote.depositAddress,
            estimatedOutput: quote.quote.amountOutFormatted
        };
    } catch (error: any) {
        console.error(">>> [1-Click SDK] Quote Error Raw:", error);
        if (error.body && error.body.message) {
            throw new Error(`1-Click API: ${error.body.message}`);
        }
        throw error;
    }
}

export async function submitTxHash(txHash: string, depositAddress: string) {
    console.log(`>>> [1-Click SDK] Submitting TX Hash: ${txHash} for deposit: ${depositAddress}`);
    try {
        await OneClickService.submitDepositTx({
            txHash,
            depositAddress
        });
        console.log(">>> [1-Click SDK] TX Hash Submitted Successfully");
        return true;
    } catch (error) {
        console.error(">>> [1-Click SDK] Error submitting TX Hash:", error);
        // We don't throw here to avoid failing the whole request if just the notification fails
        return false;
    }
}
