// @ts-nocheck
import "dotenv/config";
import { getOneClickQuote, submitTxHash } from "./sdk-service";

async function debugQuote() {
    console.log(">>> Debugging Wrapper Service...");

    // Case 1: Too low amount (Should fail with nice message)
    try {
        console.log("--- Testing Low Amount (40000) ---");
        await getOneClickQuote({
            amount: "0.04", // 40000 atomic
            sourceChain: "Base",
            recipientStellar: "GCVTVY3M7GC7UQ2SL2TLNXKTGROHPWHOZ4LASMWH3OGQMT2ZFJQLNQBB",
            facilitatorAddress: "0xF2dc6F3d0dd5ED6E9A794ea5914C85d6012b25A9"
        });
    } catch (e: any) {
        console.log("Expected Error Caught:", e.message);
    }

    // Case 2: Valid Amount
    try {
        console.log("\n--- Testing Valid Amount (0.3) ---");
        const originAsset = "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near";
        const destinationAsset = "nep245:v2_1.omni.hot.tg:10_359RPSJVdTxwTJT9TyGssr2rFoWo";
        const result = await getOneClickQuote({
            amount: "0.3", // 300000 atomic
            sourceChain: "Base",
            // User requested to use the sender address (Facilitator EVM) as recipient for testing
            recipientStellar: "0xF2dc6F3d0dd5ED6E9A794ea5914C85d6012b25A9",
            facilitatorAddress: "0xF2dc6F3d0dd5ED6E9A794ea5914C85d6012b25A9"
        });
        console.log("Valid Quote Result:", result.estimatedOutput);
    } catch (e: any) {
        console.error("Unexpected Error:", e);
    }
}

if (require.main === module) {
    debugQuote();
}
