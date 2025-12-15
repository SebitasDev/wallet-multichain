// @ts-nocheck
import "dotenv/config";
import {
    createWalletClient,
    createPublicClient,
    http,
    parseUnits, Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {base, baseSepolia} from "viem/chains";

/**
 * Step 3: Send Deposit to Quote Address (EVM)
 *
 * This sends ERC20 tokens (USDC) from an EVM wallet
 * to the depositAddress returned by the 1Click quote.
 *
 * Network: Base Sepolia
 */

// ------------------------

export async function sendTokens(
    senderAccount: string,
    senderPrivateKey: string,
    depositAddress: string,
    depositAmount: string
) {

    const account = privateKeyToAccount(senderPrivateKey as Address);

    const publicClient = createPublicClient({
        chain: base, //baseSepolia,
        transport: http(),
    });

    const walletClient = createWalletClient({
        account,
        chain: base, //baseSepolia,
        transport: http(),
    });

    console.log("Sending from:", account.address);
    console.log("Deposit address:", depositAddress);

    const hash = await walletClient.writeContract({
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", //"0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        abi: [
            {
                type: "function",
                name: "transfer",
                stateMutability: "nonpayable",
                inputs: [
                    { name: "to", type: "address" },
                    { name: "amount", type: "uint256" },
                ],
                outputs: [{ type: "bool" }],
            },
        ],
        functionName: "transfer",
        args: [
            depositAddress as Address,
            BigInt(depositAmount),//parseUnits(depositAmount, 6), // USDC = 6 decimals
        ],
    });

    console.log("Tx sent:", hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(
        `\n✅ Deposit sent!\nExplorer: https://basescan.org/tx/${hash}`
    );

    return receipt;
}

// Execute if run directly
/*if (require.main === module) {
    sendTokens().catch(console.error);
}*/
