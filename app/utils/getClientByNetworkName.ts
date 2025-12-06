import { Account, createWalletClient, http } from "viem";
import {
    baseSepolia,
    optimismSepolia,
    arbitrumSepolia,
    unichainSepolia,
    polygonAmoy,
    base,
    optimism,
    arbitrum,
    unichain,
    polygon,
} from "viem/chains";

export function getPrivateClientByNetworkName(id: number, account: Account) {
    const IS_DEV = process.env.NEXT_PUBLIC_ENVIROMENT === "development";

    const chainsMap: Record<number, any> = {
        [IS_DEV ? baseSepolia.id : base.id]: IS_DEV ? baseSepolia : base,
        [IS_DEV ? arbitrumSepolia.id : arbitrum.id]: IS_DEV ? arbitrumSepolia : arbitrum,
        [IS_DEV ? optimismSepolia.id : optimism.id]: IS_DEV ? optimismSepolia : optimism,
        [IS_DEV ? unichainSepolia.id : unichain.id]: IS_DEV ? unichainSepolia : unichain,
        [IS_DEV ? polygonAmoy.id : polygon.id]: IS_DEV ? polygonAmoy : polygon,
    };

    const chain = chainsMap[id];

    if (!chain) throw new Error(`Unsupported network: ${id}`);

    return createWalletClient({
        account,
        chain,
        transport: http(chain.rpcUrls.default.http[0]),
    });
}
