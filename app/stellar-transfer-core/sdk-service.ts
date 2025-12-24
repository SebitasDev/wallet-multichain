import { OpenAPI, OneClickService, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import { STELLAR } from '../constants/chais';

// Initialize API
OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.ONE_CLICK_JWT;

import { NETWORKS } from '@/app/constants/chainsInformation';
import { ChainKey } from '@/app/types/chain';

// Helper to get asset ID from NETWORKS config
const getAssetId = (chainName: string, tokenName: string = "USDC") => {
    if (chainName === "Stellar" && tokenName === "XLM") {
        return "nep245:v2_1.omni.hot.tg:1100_111bzQBB5v7AhLyPMDwS8uJgQV24KaAPXtwyVWu2KXbbfQU6NXRCz";
    }

    const config = NETWORKS[chainName as ChainKey];
    // Special handling for Stellar config which is separate or integrated depending on version
    if (chainName === "Stellar" && !config) {
        return STELLAR.crossChainInformation.nearIntentInformation?.assetsId[0].assetId;
    }

    if (!config) return undefined;

    const assetInfo = config.crossChainInformation.nearIntentInformation?.assetsId.find(
        (a) => a.name === tokenName
    ) || config.crossChainInformation.nearIntentInformation?.assetsId[0]; // Fallback to first (usually USDC)

    return assetInfo?.assetId;
};

export async function getOneClickQuote({
    amount,
    sourceChain,
    destinationChain,
    recipientStellar,
    userSenderAddress,
    destinationToken,
    sourceToken, // Add sourceToken support
    options
}: {
    amount: string;
    sourceChain: string;
    destinationChain: string;
    recipientStellar?: string;
    userSenderAddress: string;
    destinationToken?: string;
    sourceToken?: string;
    options?: { dry?: boolean };
}) {

    const originAsset = getAssetId(sourceChain, sourceToken);

    if (!originAsset) throw new Error(`Unsupported source chain or token: ${sourceChain} (${sourceToken || 'Default'})`);

    const destinationAsset = getAssetId(destinationChain, destinationToken);

    if (!destinationAsset) throw new Error(`Unsupported destination chain or token: ${destinationChain} (${destinationToken || 'Default'})`);

    let decimals = 6;
    if (sourceChain === "Stellar") {
        decimals = 7;
    } else {
        const config = NETWORKS[sourceChain as ChainKey];
        if (config) {
            const assetDesc = config.assets.find(a => a.name === (sourceToken || "USDC"));
            if (assetDesc) {
                decimals = assetDesc.decimals;
            }
        }
    }

    const amountAtomic = Math.floor(parseFloat(amount) * Math.pow(10, decimals)).toString();

    const isDry = options?.dry ?? false;

    const quoteRequest: QuoteRequest = {
        dry: isDry,
        swapType: QuoteRequest.swapType.EXACT_INPUT,
        slippageTolerance: 100, // 1%
        originAsset,
        depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
        depositMode: sourceChain === "Stellar" ? QuoteRequest.depositMode.MEMO : undefined,
        destinationAsset,
        amount: amountAtomic,
        refundTo: userSenderAddress,
        refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
        recipient: recipientStellar || userSenderAddress, // recipient is actually the destination address
        recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
        deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        referral: "1llet",
        quoteWaitingTimeMs: 5000,
    };

    console.log(">>> [1-Click SDK] Requesting Quote:", { originAsset, destinationAsset, amount: amountAtomic, recipient: recipientStellar });

    try {
        const quote = await OneClickService.getQuote(quoteRequest);

        if (!isDry && !quote.quote?.depositAddress) {
            throw new Error("No deposit address returned from 1-Click Quote");
        }

        return {
            quote,
            depositAddress: quote.quote?.depositAddress || "",
            estimatedOutput: quote.quote?.amountOutFormatted || "0"
        };
    } catch (error: any) {
        console.error(">>> [1-Click SDK] Quote Error Raw:", error);
        if (error.body && error.body.message) {
            const msg = error.body.message;

            // Parse "Amount is too low" error
            if (msg.includes("try at least")) {
                const match = msg.match(/try at least (\d+)/);
                if (match && match[1]) {
                    const minAtomic = parseInt(match[1]);
                    // Use the same decimals logic as input (source chain)
                    const minReadable = (minAtomic / Math.pow(10, decimals)).toFixed(6); // Keep it clean with 6 decimals max for display
                    // Or better, removing trailing zeros
                    const formatted = parseFloat(minReadable).toString();
                    throw new Error(`Monto muy bajo para el puente. Intenta enviar al menos ${formatted} ${sourceToken || 'USDC'}`);
                }
            }

            // Clean generic error
            throw new Error(msg.replace("1-Click API: ", ""));
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
        return false;
    }
}
