import { http, createConfig } from "wagmi";
import { scrollSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
    chains: [scrollSepolia],
    connectors: [
        injected(),
    ],
    transports: {
        [scrollSepolia.id]: http(),
    },
});
