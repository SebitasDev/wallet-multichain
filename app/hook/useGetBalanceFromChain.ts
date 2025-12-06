import { createPublicClient, http, formatUnits, erc20Abi } from "viem";
import { Address } from "abitype";
import {CHAIN_ID_TO_KEY, NETWORKS} from "@/app/constants/chainsInformation";

export async function getBalanceFromChain(
    chain: any,
    address: Address,
    tokenAddress: Address
): Promise<{ balance: string; error: string | null }> {
    if (!address || !tokenAddress || !chain) {
        return { balance: "0", error: "Missing parameters" };
    }

    const key = CHAIN_ID_TO_KEY[chain.id] as keyof typeof NETWORKS;

    const client = createPublicClient({
        chain,
        transport: http(NETWORKS[key].rpcUrl),
    });

    try {
        const raw = await client.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address],
        });

        return { balance: formatUnits(raw, 6), error: null };
    } catch (err: any) {
        console.error(`Error al obtener balance de ${chain.name}:`, err);
        return { balance: "0", error: err.message || "Unknown error" };
    }
}
