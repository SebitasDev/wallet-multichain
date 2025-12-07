import { formatUnits, erc20Abi } from "viem";
import { Address } from "abitype";
import {getClient} from "@/app/utils/rpcClientCache";

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
        const raw = await client.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address],
        });

        const formatted = formatUnits(raw, 6);

        balanceCache[key] = { value: formatted, timestamp: now };

        return { balance: formatted, error: null };
    } catch (err) {
        // @ts-ignore
        return { balance: "0", error: err.message };
    }
}
