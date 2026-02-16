
import { Wallet, JsonRpcProvider, formatEther } from "ethers";

const FACILITATOR_KEY = "0x1de32b06cfc2235dbb8655edae07681f051d6eedb38640dcc898af50ebef4bb8";
const RPC_URL = "https://mainnet.base.org";

async function main() {
    try {
        const provider = new JsonRpcProvider(RPC_URL);
        const wallet = new Wallet(FACILITATOR_KEY, provider);

        console.log("--- Facilitator Status on Base ---");
        console.log("Address:", wallet.address);

        const balance = await provider.getBalance(wallet.address);
        console.log("Balance ETH:", formatEther(balance));
        console.log("Balance Wei:", balance.toString());

        if (balance === 0n) {
            console.warn("\nWARNING: Facilitator has 0 ETH! Bridge transactions requiring facilitator gas will fail.");
        } else {
            console.log("\nSuccess: Facilitator has funds.");
        }

    } catch (e) {
        console.error("Check failed:", e);
    }
}

main();
