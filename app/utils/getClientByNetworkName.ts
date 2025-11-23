import {Account, createPublicClient, createWalletClient, http} from "viem";
import {polygonAmoy, baseSepolia, optimismSepolia} from "viem/chains";

export function getClientByNetworkName(name: string) {
    switch (name.toLowerCase()) {
        case baseSepolia.id.toString():
            return createPublicClient({ chain: baseSepolia, transport: http() });
        case polygonAmoy.id.toString():
            return createPublicClient({ chain: polygonAmoy, transport: http() });
        case optimismSepolia.id.toString():
            return createPublicClient({ chain: optimismSepolia, transport: http() });
        default:
            throw new Error(`Unsupported network: ${name}`);
    }
}

export function getPrivateClientByNetworkName(name: string, account: Account) {
    switch (name.toLowerCase()) {
        case baseSepolia.id.toString():
            return createWalletClient({
                account,
                chain: baseSepolia,
                transport: http(baseSepolia.rpcUrls.default.http[0]),
            });
        case polygonAmoy.id.toString():
            return createWalletClient({
                account,
                chain: polygonAmoy,
                transport: http(polygonAmoy.rpcUrls.default.http[0]),
            });
        case optimismSepolia.id.toString():
            return createWalletClient({
            account,
            chain: optimismSepolia,
            transport: http(optimismSepolia.rpcUrls.default.http[0]),
        });
        default:
            throw new Error(`Unsupported network: ${name}`);
    }
}
