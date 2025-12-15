// @ts-nocheck
import { ApiError } from '@defuse-protocol/one-click-sdk-typescript';
import { getQuote } from './2-get-quote';
import { sendTokens } from './3-send-deposit';
import { submitTxHash } from './4-submit-tx-hash-OPTIONAL';
import { pollStatusUntilSuccess } from './5-check-status-OPTIONAL';
import { displaySwapCostTable } from './utils';
import "dotenv/config";

/**
 *  Step 5: Full Swap Implementation
 *
 *  This combines steps 2 - 5:
 *   1. Get a quote with deposit address
 *   2. Send deposit to the quote's deposit address
 *   3. Submit transaction hash to 1-Click API
 *   4. Check the status of the swap
 * 
 *  NOTE: Configure this file independently of the other files in this directory
 */

const senderPrivateKey = "0x02fde17f8af8c9ca221b047e7408387de01a048c2ab8371f403ee31a56edac67";
const isTest = false;  // set to true for quote estimation / testing, false for actual execution
const senderAddress = "0x0b00a75637601e0f1b98d7b79b28a77c1f64e16d";  // Configure in .env
const recipientAddress = 'GCZFSBXYF7ESOPLE3UJJKLMCHR6463V5UUQIJKWIM7D4UFJDAZFYJQTM';  // Token swap recipient address on Arbitrum
const originAsset = "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near";  // Native $NEAR
const destinationAsset = "nep245:v2_1.omni.hot.tg:1100_111bzQBB65GxAPAVoxqmMcgYo5oS3txhqs1Uh1cgahKQUeTUq1TJu";  // Native $ARB
const amount = "24000";


async function fullSwap() {
  try {
    console.log("Starting NEAR Intents full swap process w/ 1-Click API...\n");
    
    // Step 1: Get quote and extract deposit address
    console.log("Step 1: Getting quote...");
    console.log("--------------------------------");
    const quote = await getQuote(isTest, senderAddress, recipientAddress, originAsset, destinationAsset, amount);

    // Extract deposit address from quote response
    const depositAddress = quote.quote?.depositAddress;
    if (!depositAddress) {
      throw new Error("No deposit address found in quote response");
    }
    
    console.log(`💬 - Quote: ${quote.quote?.amountInFormatted} NEAR → ${quote.quote?.amountOutFormatted} ARB`);
    console.log(`🎯 - Deposit address: ${depositAddress}`);
    
    // Display swap cost breakdown table
    displaySwapCostTable(quote);

    // Step 2: Send deposit
    console.log("Step 2: Sending deposit...");
    console.log("--------------------------------");
    const depositResult = await sendTokens(senderAddress, senderPrivateKey, depositAddress, amount);
    console.log("✅ - Deposit sent successfully!");
    console.log(`🔍 - See transaction: https://nearblocks.io/txns/${depositResult.transactionHash}\n`);
    
    // Step 3: Submit transaction hash
    console.log("Step 3: Submitting transaction hash...");
    console.log("--------------------------------");
    const submitResult = await submitTxHash(depositResult.transactionHash, depositAddress);
    console.log("✅ - Transaction hash submitted successfully!\n");
    
    // Step 4: Poll status until success
    console.log("Step 4: Monitoring swap status...");
    console.log("--------------------------------");
    console.log("⏳ Waiting 5 seconds before starting status checks...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalStatus = await pollStatusUntilSuccess(depositAddress);
    console.log("--------------------------------");
    console.log("✅ Full swap process completed! \n\n");
    console.log(`🔍 View full transaction on NEAR Intents Explorer: \n https://explorer.near-intents.org/transactions/${depositAddress} \n`);
    
    return { quote, depositAddress, depositResult, submitResult, finalStatus };
    
  } catch (error) {
    console.error("❌ Full swap failed:", error as ApiError);
    throw error;
  }
}

fullSwap().catch(console.error);
