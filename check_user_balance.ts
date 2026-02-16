
import { createPublicClient, http, formatEther } from "viem";
import { base } from "viem/chains";

const USER_ADDRESS = "0xBDb3465bDD3EA58cD33457c2D064b59214390F47";

async function main() {
    console.log(`checking balance for ${USER_ADDRESS} on Base...`);
    const client = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org")
    });

    const balance = await client.getBalance({ address: USER_ADDRESS });
    console.log(`ETH Balance: ${formatEther(balance)} ETH`);

    // Check USDC Balance too just in case
    // USDC Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    // ABI only balanceOf
    const usdcBalance = await client.readContract({
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        abi: [{ name: "balanceOf", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }], type: "function" }],
        functionName: "balanceOf",
        args: [USER_ADDRESS]
    });
    console.log(`USDC Balance: ${Number(usdcBalance) / 1e6} USDC`);
}

main();
