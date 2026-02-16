
import { createPublicClient, http, getContract } from "viem";
import { base } from "viem/chains";

const usdcErc3009Abi = [
    {
        inputs: [],
        name: "name",
        outputs: [{ type: "string" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "version",
        outputs: [{ type: "string" }],
        stateMutability: "view",
        type: "function"
    }
] as const;

async function main() {
    console.log("Checking Base USDC...");
    const client = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org")
    });

    const usdc = getContract({
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        abi: usdcErc3009Abi,
        client
    });

    try {
        const name = await usdc.read.name();
        console.log("USDC Name:", name);
    } catch (e) {
        console.error("Failed to read name:", e);
    }

    try {
        const version = await usdc.read.version();
        console.log("USDC Version:", version);
    } catch (e) {
        console.error("Failed to read version:", e);
    }
}

main();
