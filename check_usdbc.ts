
import { createPublicClient, http, formatEther } from "viem";
import { base } from "viem/chains";

const USER_ADDRESS = "0xBDb3465bDD3EA58cD33457c2D064b59214390F47";
const USDbC_ADDRESS = "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA";

async function main() {
    console.log(`checking USDbC balance for ${USER_ADDRESS} on Base...`);
    const client = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org")
    });

    // Check USDbC Balance
    try {
        const balance = await client.readContract({
            address: USDbC_ADDRESS,
            abi: [{ name: "balanceOf", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }], type: "function" }],
            functionName: "balanceOf",
            args: [USER_ADDRESS]
        });
        console.log(`USDbC Balance: ${Number(balance) / 1e6} USDbC`);
    } catch (e) {
        console.log("Error fetching USDbC", e);
    }
}

main();
