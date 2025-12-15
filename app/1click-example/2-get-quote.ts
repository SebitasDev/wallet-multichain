// @ts-nocheck
import { OpenAPI, OneClickService, QuoteRequest, ApiError } from '@defuse-protocol/one-click-sdk-typescript';
import { NEAR } from '@near-js/tokens';
import "dotenv/config";

/**
 *  Step 2: Get Quote
 *
 *  This endpoint retrieves a quote for cross-chain token swaps.
 *  It calculates the expected output and fees for a given swap configuration.
 *  Will provide a quote and unique deposit address to send the funds to.
 * 
 */

// Example Swap Configuration
const isTest = false;  // set to true for quote estimation / testing, false for actual execution
const senderAddress = "0x0b00a75637601e0f1b98d7b79b28a77c1f64e16d";  // Configure in .env
const recipientAddress = 'GCZFSBXYF7ESOPLE3UJJKLMCHR6463V5UUQIJKWIM7D4UFJDAZFYJQTM';  // Token swap recipient address on Arbitrum
const originAsset = "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near";  // Native $NEAR
const destinationAsset = "nep245:v2_1.omni.hot.tg:1100_111bzQBB65GxAPAVoxqmMcgYo5oS3txhqs1Uh1cgahKQUeTUq1TJu";  // Native $ARB
const amount = "24000";

// Initialize the API client
OpenAPI.BASE = 'https://1click.chaindefuser.com';

// Configure your JSON Web Token (JWT) required for most endpoints
// Request one here -> https://docs.google.com/forms/d/e/1FAIpQLSdrSrqSkKOMb_a8XhwF0f7N5xZ0Y5CYgyzxiAuoC2g4a2N68g/viewform
// If you don't have a JWT, you can comment out line 28 but you will pay a 0.1% fee on all swaps
OpenAPI.TOKEN = process.env.ONE_CLICK_JWT;

export async function getQuote(dry: boolean, senderAddress: string, recipientAddress: string, originAsset: string, destinationAsset: string, amount: string) {
try {
    const quoteRequest: QuoteRequest = {
    // Testing Mode : set to true for quote estimation / testing, false for actual execution
    // When true, the response will NOT CONTAIN the following fields:
    //  - depositAddress
    //  - timeWhenInactive
    //  - timeEstimate
    //  - deadline
    dry, 
    
    // Swap execution type - determines whether input or output amount is the basis of the swap
    // EXACT_INPUT: input amount is fixed, output varies
    // EXACT_OUTPUT: output amount is fixed, input varies (refundTo address will receive excess tokens back even after the swap is complete)
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    
    // Maximum acceptable slippage as basis points (100 = 1.00%)
    slippageTolerance: 100, 
    
    // Source token identifier in NEP:contract format listed as `assetId`
    // Use getTokens or API docs to get the correct format
    // Example: nep141:wrap.near (Native $NEAR wrapped or unwrapped)
    originAsset,
    
    // Type of deposit address:
    // - ORIGIN_CHAIN: deposit address on the origin chain
    // - INTENTS: deposit address inside of near intents (the verifier smart contract)
    depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
    
    // Target token identifier in NEP:contract format listed as `assetId`
    // Use getTokens or API docs to get the correct format
    // Example: "nep141:eth.bridge.near" ($ETH bridged to NEAR)
    destinationAsset,
    
    // Amount to swap (in token's smallest unit/decimals)
    // Based on the swapType, this will be the INPUT or OUTPUT token amount
    amount,
    
    // Address to receive refunds if swap fails
    refundTo: senderAddress, 
    
    // Type of refund address:
    // - ORIGIN_CHAIN: refund to the account on source chain
    // - INTENTS: refund to the account inside intents contract
    refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
    
    // Final recipient address for the swapped tokens. Format should match recipientType.
    recipient: recipientAddress, 
    
    // Type of recipient address:
    // - DESTINATION_CHAIN: send to destination chain
    // - INTENTS: send to account inside intents contract
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    
    // Quote expiration timestamp in ISO format.
    // Swap must execute before this time (currently set to 3 minutes from now)
    deadline: new Date(Date.now() + 3 * 60 * 1000).toISOString(), 
    
    // Referral identifier for fee sharing/tracking
    referral: "referral",
    
    // Maximum time to wait for quote response in milliseconds
    quoteWaitingTimeMs: 3000,
};

    // Fetch quote from 1-Click API `/quote` endpoint
    const quote = await OneClickService.getQuote(quoteRequest);
    return quote;
  } catch (error) {
    console.error('Error fetching quote:', error);
    throw error;
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  getQuote(isTest, senderAddress, recipientAddress, originAsset, destinationAsset, amount)
    .then(result => console.log("\n\nAuthenticated getQuote RESPONSE:", result))
    .catch(console.error);
}
