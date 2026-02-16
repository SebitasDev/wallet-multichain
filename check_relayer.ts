
import { createPublicClient, http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// The fallback key we likely used
const FALLBACK_KEY = "0x1de32b06cfc2235dbb8655edae07681f051d6eedb38640dcc898af50ebef4bb8";

// The address from the error message
const ERROR_ADDRESS = "0xA08979bA1Aac1c19Dc659817C295C77018533a97";

async function main() {
    console.log("--- Checking Relayer Balances ---");

    const client = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org")
    });

    // 1. Check address from Error
    const balanceErrorAddr = await client.getBalance({ address: ERROR_ADDRESS });
    console.log(`Address from Error (${ERROR_ADDRESS}): ${formatEther(balanceErrorAddr)} ETH`);

    // 2. Derive address from Fallback Key
    const account = privateKeyToAccount(FALLBACK_KEY);
    console.log(`Address from Fallback Key: ${account.address}`);

    if (account.address.toLowerCase() === ERROR_ADDRESS.toLowerCase()) {
        console.log("MATCH: The system is using the Fallback Key.");
    } else {
        console.log("MISMATCH: The system is NOT using the Fallback Key (or my derivation is wrong).");
    }

    const balanceFallback = await client.getBalance({ address: account.address });
    console.log(`Balance of Fallback Address: ${formatEther(balanceFallback)} ETH`);
}

main();
