
import { createPublicClient, http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { mainnet } from "viem/chains";

import * as fs from 'fs';
import * as path from 'path';

// Manual .env loading
try {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
            }
        });
        console.log("Loaded .env.local");
    }
} catch (err) {
    console.warn("Could not load .env.local", err);
}

const RELAYER_KEY = (process.env.RELAYER_PRIVATE_KEY || process.env.NEXT_PUBLIC_FACILITATOR_PRIVATE_KEY || "0x1de32b06cfc2235dbb8655edae07681f051d6eedb38640dcc898af50ebef4bb8") as `0x${string}`;

async function main() {
    const account = privateKeyToAccount(RELAYER_KEY);
    console.log(`Facilitator Address: ${account.address}`);

    const client = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org")
    });

    try {
        const balance = await client.getBalance({ address: account.address });
        console.log(`Balance on Base: ${formatEther(balance)} ETH`);

        const gasPrice = await client.getGasPrice();
        console.log(`Gas Price on Base: ${gasPrice} wei`);

        // Check against typical gas limit
        const limit = 200000n;
        const cost = limit * gasPrice;
        console.log(`Est. Cost for 200k gas: ${formatEther(cost)} ETH`);

        if (balance < cost) {
            console.log("WARNING: Insufficient funds for 200k gas limit!");
        } else {
            console.log("Funds OK for 200k limit.");
        }

    } catch (e) {
        console.error("Error checking balance:", e);
    }
}

main();
