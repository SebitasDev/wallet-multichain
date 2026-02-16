
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { mainnet, polygon, optimism, arbitrum, base } from "viem/chains";

const USER = "0xBDb3465bDD3EA58cD33457c2D064b59214390F47";
const ERC20 = parseAbi(["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"]);

const CHAINS = [
    { name: "Base", chain: base, rpc: "https://mainnet.base.org", usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
    { name: "Polygon", chain: polygon, rpc: "https://polygon-rpc.com", usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" }, // Bridged USDC (most common)
    { name: "PolygonNative", chain: polygon, rpc: "https://polygon-rpc.com", usdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" }, // USDC.e
    { name: "Optimism", chain: optimism, rpc: "https://mainnet.optimism.io", usdc: "0x0b2C639c533813f4Aa9D7837CAf992c96bdB5a83" },
    { name: "Arbitrum", chain: arbitrum, rpc: "https://arb1.arbitrum.io/rpc", usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
];

async function check() {
    console.log(`Searching for 0.22 USDC on ${USER}...`);

    for (const c of CHAINS) {
        try {
            const client = createPublicClient({ chain: c.chain, transport: http(c.rpc) });
            const bal = await client.readContract({ address: c.usdc, abi: ERC20, functionName: "balanceOf", args: [USER] });
            const dec = await client.readContract({ address: c.usdc, abi: ERC20, functionName: "decimals", args: [] });
            const fmt = formatUnits(bal, dec);
            console.log(`[${c.name}] USDC: ${fmt}`);
        } catch (e) {
            console.log(`[${c.name}] Error checking`);
        }
    }
}

check();
