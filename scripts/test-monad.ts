
import { createWalletClient, http, defineChain, toHex, keccak256, getContract } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// --- CONFIG ---
const API_URL = "http://localhost:3000/api/bridge/settle";
const PRIVATE_KEY = "0xfcf421172e139e283896401018a6d5147f8d99c4a127c1047a655a0498647d61";
const AMOUNT = "0.03"; // USDC
const SOURCE_CHAIN = "Base";
const DEST_CHAIN = "Monad";
const USDC_ADDRESS_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base Mainnet USDC
const FACILITATOR_ADDRESS = "0xBfB565Afa19a40D76ca15505c230863Eb2480CbD"; // From .env.local

const account = privateKeyToAccount(PRIVATE_KEY);
const USER_ADDRESS = account.address;
const FACILITATOR_RECEIVER = account.address; // Self-transfer for the "Pull"

console.log("User:", USER_ADDRESS);

// EIP-712 Domain
const domain = {
    name: "USD Coin", // Base Mainnet Name
    version: "2",
    chainId: base.id,
    verifyingContract: USDC_ADDRESS_BASE as `0x${string}`
};

// EIP-3009 Types
const types = {
    TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
    ],
};

async function main() {
    // 1. Calculate Amount (6 decimals) + Fee
    // Fee is 0.01 USDC (10000) usually
    const amountAtomic = BigInt(Math.floor(parseFloat(AMOUNT) * 1_000_000));
    const feeAtomic = BigInt(10000); // 0.01
    const totalAtomic = amountAtomic + feeAtomic;

    // 2. Generate Nonce
    const nonce = keccak256(toHex(crypto.getRandomValues(new Uint8Array(32))));
    const validAfter = 0n;
    const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

    // 3. Sign Authorization
    const message = {
        from: USER_ADDRESS,
        to: FACILITATOR_RECEIVER,
        value: totalAtomic,
        validAfter,
        validBefore,
        nonce
    };

    console.log("Signing EIP-3009 Authorization...");
    const client = createWalletClient({
        account,
        chain: base,
        transport: http("https://mainnet.base.org")
    });

    const signature = await client.signTypedData({
        domain,
        types,
        primaryType: "TransferWithAuthorization",
        message
    });

    console.log("Signature:", signature);

    // 4. Construct Payload
    const paymentPayload = {
        authorization: {
            from: USER_ADDRESS,
            to: FACILITATOR_RECEIVER,
            value: totalAtomic.toString(),
            validAfter: validAfter.toString(),
            validBefore: validBefore.toString(),
            nonce
        },
        signature,
        sourceChain: SOURCE_CHAIN,
        domainName: domain.name,
        domainVersion: domain.version
    };

    // 5. Send Request
    console.log("Sending Bridge Request to:", API_URL);
    const body = {
        paymentPayload,
        sourceChain: SOURCE_CHAIN,
        destChain: DEST_CHAIN,
        recipient: USER_ADDRESS,
        amount: AMOUNT
    };

    console.log("Body:", JSON.stringify(body, null, 2));

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        console.log("Response Status:", res.status);
        console.log("Response Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Request Failed:", e);
    }
}

main();
