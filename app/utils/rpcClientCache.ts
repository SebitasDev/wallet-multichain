import { createPublicClient, http } from "viem";
import { NETWORKS } from "@/app/constants/chainsInformation";

const clientCache: Record<string, any> = {};

export function getClient(chainId: number) {
    if (clientCache[chainId]) return clientCache[chainId];

    const network = Object.values(NETWORKS).find(n => n.chain.id === chainId);
    if (!network) throw new Error("Network not found");

    clientCache[chainId] = createPublicClient({
        chain: network.chain,
        transport: http(network.rpcUrl),
    });

    return clientCache[chainId];
}
