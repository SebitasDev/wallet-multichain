import { createPublicClient, http } from "viem";
import { NETWORKS } from "@/app/constants/chainsInformation";

const clientCache: Record<string, any> = {};

export function getClient(chainId: number) {
    if (clientCache[chainId]) return clientCache[chainId];

    const network = Object.values(NETWORKS).find(n => n.evm?.chain.id === chainId);
    if (!network || !network.evm) throw new Error("Network not found");

    clientCache[chainId] = createPublicClient({
        chain: network.evm.chain,
        transport: http(network.evm.rpcUrl as string | undefined),
    });

    return clientCache[chainId];
}
