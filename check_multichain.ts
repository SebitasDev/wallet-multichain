
import { createPublicClient, http, formatEther, parseAbi } from "viem";
import { mainnet, polygon, optimism, arbitrum } from "viem/chains";

const USER_ADDRESS = "0xBDb3465bDD3EA58cD33457c2D064b59214390F47";

const CHAINS = [
    { name: "Polygon", chain: polygon, rpc: "https://polygon-rpc.com", usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" },
    { name: "Optimism", chain: optimism, rpc: "https://mainnet.optimism.io", usdc: "0x0b2C639c533813f4Aa9D7837CAf992c96bdB5a83" }, // Native
    { name: "Arbitrum", chain: arbitrum, rpc: "https://arb1.arbitrum.io/rpc", usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" }, // Native
    { name: "Ethereum", chain: mainnet, rpc: "https://eth.llamarpc.com", usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
];

const ERC20_ABI = parseAbi(["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"]);

async function checkChain(c: any) {
    try {
        const client = createPublicClient({
            chain: c.chain,
            transport: http(c.rpc)
        });

        const ethBal = await client.getBalance({ address: USER_ADDRESS });

        let usdcBal = 0;
        try {
            if (c.usdc) {
                const bal = await client.readContract({
                    address: c.usdc,
                    abi: ERC20_ABI,
                    functionName: "balanceOf",
                    args: [USER_ADDRESS]
                });
                const dec = await client.readContract({
                    address: c.usdc,
                    abi: ERC20_ABI,
                    functionName: "decimals",
                    args: []
                });
                usdcBal = Number(bal) / (10 ** dec);
            }
        } catch (e) { }

        console.log(`[${c.name}] ETH/Native: ${formatEther(ethBal)} | USDC: ${usdcBal}`);
    } catch (e) {
        console.log(`[${c.name}] Error checking: ${e.message}`);
    }
}

async function main() {
    console.log(`Checking funds for ${USER_ADDRESS}...`);
    await Promise.all(CHAINS.map(checkChain));
}

main();
