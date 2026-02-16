
import { createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";

const RELAYER_ADDRESS = "0xA08979bA1Aac1c19Dc659817C295C77018533a97";

async function main() {
    console.log(`Checking Relayer balance on Base Sepolia (Testnet)...`);
    const client = createPublicClient({
        chain: baseSepolia,
        transport: http("https://sepolia.base.org")
    });

    const balance = await client.getBalance({ address: RELAYER_ADDRESS });
    console.log(`Balance: ${formatEther(balance)} ETH (Sepolia)`);
}

main();
