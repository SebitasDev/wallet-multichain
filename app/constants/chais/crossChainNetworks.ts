import z from "zod";

export const CrossChainKeyEnum = z.enum([
    "Optimism",
    "Arbitrum",
    "Base",
    "Unichain",
    "Polygon",
    "Avalanche",
    "WorldChain",
    "Stellar"
]);