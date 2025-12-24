import { formatUnits, erc20Abi } from "viem";
import { Address } from "abitype";
import { getClient } from "@/app/utils/rpcClientCache";

const balanceCache: Record<string, { value: string; timestamp: number }> = {};
const CACHE_TIME = 5000;

export async function getBalanceFromChain(
    chain: any,
    address: Address,
    tokenAddress: Address
): Promise<{ balance: string; error: string | null }> {
    const key = `${chain.id}-${address}-${tokenAddress}`;
    const now = Date.now();

    if (balanceCache[key] && (now - balanceCache[key].timestamp) < CACHE_TIME) {
        return { balance: balanceCache[key].value, error: null };
    }

    const client = getClient(chain.id);

    try {
        let raw: bigint;
        let decimals = 6; // Default to 6 for USDC

        // Check for Native Token (0x000...000)
        if (tokenAddress === "0x0000000000000000000000000000000000000000") {
            raw = await client.getBalance({
                address: address,
            });
            decimals = 18; // Native tokens usually have 18 decimals
        } else {
            // ERC20 Token
            raw = await client.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [address],
            });
        }

        const formatted = formatUnits(raw, decimals);

        balanceCache[key] = { value: formatted, timestamp: now };

        return { balance: formatted, error: null };
    } catch (err) {
        // @ts-ignore
        return { balance: "0", error: err.message };
    }
}
