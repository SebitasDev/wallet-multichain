
import { Wallet } from "ethers";

const FACILITATOR_KEY = "0x1de32b06cfc2235dbb8655edae07681f051d6eedb38640dcc898af50ebef4bb8";

async function main() {
    const wallet = new Wallet(FACILITATOR_KEY);
    console.log("--- FACILITATOR WALLET INFO ---");
    console.log("Private Key:", FACILITATOR_KEY.substring(0, 10) + "...");
    console.log("Address:", wallet.address);
    console.log("-------------------------------");
    console.log("Please check if THIS address has ETH on Base Mainnet.");
}

main();
