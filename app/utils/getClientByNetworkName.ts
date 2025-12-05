import {Account, createWalletClient, http} from "viem";
import {baseSepolia, optimismSepolia, arbitrumSepolia, unichainSepolia, polygonAmoy} from "viem/chains";

export function getPrivateClientByNetworkName(id: number, account: Account) {
    switch (id) {
        case baseSepolia.id:
            return createWalletClient({
                account,
                chain: baseSepolia,
                transport: http(baseSepolia.rpcUrls.default.http[0]),
            });
        case arbitrumSepolia.id:
            return createWalletClient({
                account,
                chain: arbitrumSepolia,
                transport: http(arbitrumSepolia.rpcUrls.default.http[0]),
            });
        case optimismSepolia.id:
            return createWalletClient({
            account,
            chain: optimismSepolia,
            transport: http(optimismSepolia.rpcUrls.default.http[0]),
        });
        case unichainSepolia.id:
            return createWalletClient({
                account,
                chain: unichainSepolia,
                transport: http(unichainSepolia.rpcUrls.default.http[0]),
            });
        case polygonAmoy.id:
            return createWalletClient({
                account,
                chain: polygonAmoy,
                transport: http(polygonAmoy.rpcUrls.default.http[0]),
            });
        default:
            throw new Error(`Unsupported network: ${id}`);
    }
}
