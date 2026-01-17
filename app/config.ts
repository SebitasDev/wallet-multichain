import { http, createConfig } from "wagmi";
import {
    polygon,
    optimism,
    arbitrum,
    base,
    avalanche,
    bsc,
    gnosis,
    worldchain
} from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
    chains: [
        polygon,
        optimism,
        arbitrum,
        base,
        avalanche,
        bsc,
        gnosis,
        worldchain
    ],
    connectors: [
        injected(),
    ],
    transports: {
        [polygon.id]: http(),
        [optimism.id]: http(),
        [arbitrum.id]: http(),
        [base.id]: http(),
        [avalanche.id]: http(),
        [bsc.id]: http(),
        [gnosis.id]: http(),
        [worldchain.id]: http(),
    },
});
