
import { createPublicClient, http, formatUnits } from "viem";
import { base } from "viem/chains";

async function main() {
    const client = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org")
    });

    const gasPrice = await client.getGasPrice();
    console.log(`Current Gas Price: ${formatUnits(gasPrice, 9)} Gwei`);
    console.log(`Gas Price (Wei): ${gasPrice}`);

    // Estimate cost for 150k gas (typical for Permit Transfer)
    const estimatedGas = 150000n;
    const costWei = estimatedGas * gasPrice;
    const costEth = formatUnits(costWei, 18);

    console.log(`Estimated Cost (150k gas): ${costEth} ETH`);

    // Check against 0.0000257 ETH
    if (costWei < 25700000000000n) {
        console.log("PASS: 0.0000257 ETH SHOULD BE SUFFICIENT.");
    } else {
        console.log("FAIL: INSUFFICIENT.");
    }
}

main();
