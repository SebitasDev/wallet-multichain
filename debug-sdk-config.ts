
import { CHAIN_CONFIGS } from "@1llet.xyz/erc4337-gasless-sdk";

console.log("--- SDK CHAIN_CONFIGS DUMP ---");
console.log(JSON.stringify(CHAIN_CONFIGS, null, 2));

try {
    // Check if there is any 'Stacks' key or similar
    const keys = Object.keys(CHAIN_CONFIGS);
    console.log("Available Keys:", keys);

    // Check for 5000 just in case
    // @ts-ignore
    if (CHAIN_CONFIGS[5000]) {
        console.log("Found config for 5000:", JSON.stringify((CHAIN_CONFIGS as any)[5000], null, 2));
    } else {
        console.log("No config for 5000 found.");
    }

} catch (e) {
    console.error(e);
}
