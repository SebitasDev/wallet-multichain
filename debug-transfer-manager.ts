
import { TransferManager } from "@1llet.xyz/erc4337-gasless-sdk";

async function main() {
    console.log("Initializing...");
    const tm = new TransferManager();
    // @ts-ignore
    const method = tm.executeEVMToStacks;

    if (typeof method === 'function') {
        console.log("--- executeEVMToStacks Info ---");
        console.log("Arity (args length):", method.length);
        const source = method.toString();
        // Print first 500 chars to see args
        console.log("Source head:\n", source.substring(0, 500));
    } else {
        console.log("Method executeEVMToStacks NOT FOUND on instance.");
    }
}

main().catch(err => {
    console.error("Script Error:", err);
});
