"use client";

import { Box, Container, Typography, keyframes } from "@mui/material";
import { Language, translate, chains, sectionTitles } from "@/app/landing-translations";
import { SectionTitle } from "./SectionTitle";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { formatCurrency } from "@/app/utils/formatCurrency";

const marquee = keyframes`
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
`;

export function Chains({ lang }: { lang: Language }) {
    const mainWallet = useXOWalletStore(state => state.mainWallet);

    const getAssetsForChain = (chainName: string) => {
        // Map display name to NETWORKS key if needed, or assume they match
        // keys in NETWORKS: Optimism, Arbitrum, Base, Unichain, Polygon, Avalanche, WorldChain, Stellar, Monad, BNB
        const key = chainName.split(" ").join("") as ChainKey; // "World Chain" -> "WorldChain"
        // Handle explicit mismatches if any
        const config = NETWORKS[key] || NETWORKS[chainName as ChainKey];
        return config?.assets || [];
    };

    const getBalanceForChain = (chainName: string) => {
        const key = chainName.split(" ").join("") as ChainKey;
        const config = NETWORKS[key] || NETWORKS[chainName as ChainKey];
        if (!config) return 0;

        // Handle Stellar special case or standard EVM
        const chainId = config.evm?.chain.id.toString() || (chainName === "Stellar" ? "stellar" : "unknown");

        // Find chain in mainWallet.chains
        const chainInfo = (mainWallet.chains || []).find(c => c.chainId === chainId);
        return chainInfo ? chainInfo.amount : 0;
    };

    return (
        <Box sx={{ py: { xs: 6, md: 8 }, overflow: "hidden" }}>
            <Container maxWidth="lg">
                <SectionTitle label={sectionTitles.chains.label} title={sectionTitles.chains.title} lang={lang} compact />
                <Box
                    sx={{
                        display: "flex",
                        width: "max-content",
                        gap: 3,
                        animation: `${marquee} 40s linear infinite`,
                        "&:hover": {
                            animationPlayState: "paused",
                        },
                    }}
                >
                    {[...chains, ...chains].map((chain, index) => {
                        const assets = getAssetsForChain(chain.name);
                        const balance = getBalanceForChain(chain.name);

                        return (
                            <Box
                                key={`${chain.name}-${index}`}
                                sx={{
                                    width: 280, // Increased width for better balance display
                                    flexShrink: 0,
                                    p: 2,
                                    background: "#ffffff",
                                    border: "3px solid #000000",
                                    borderRadius: 3,
                                    boxShadow: "4px 4px 0px #000000",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start", // Left align as per screenshot
                                    gap: 1,
                                    position: "relative",
                                    transition: "all 0.2s",
                                    overflow: "hidden", // Clip decorative elements
                                    "&:hover": {
                                        transform: "translate(-2px, -2px)",
                                        boxShadow: "6px 6px 0px #000000",
                                    },
                                }}
                            >
                                {/* Decorative Icon Background */}
                                <Box sx={{
                                    position: "absolute",
                                    top: -10,
                                    left: -10,
                                    opacity: 0.1,
                                    "& svg": { fontSize: 100, color: chain.color },
                                    transform: "rotate(-10deg)"
                                }}>
                                    {chain.icon}
                                </Box>

                                {/* Top Row: Balance and Icon */}
                                <Box width="100%" display="flex" justifyContent="space-between" alignItems="center" zIndex={1}>
                                    <Box>
                                        <Typography fontWeight={900} fontSize={28} lineHeight={1}>
                                            {balance.toFixed(2)}
                                        </Typography>
                                        <Typography fontWeight={800} fontSize={12} color="#666666" textTransform="uppercase">
                                            {chain.name}
                                        </Typography>
                                    </Box>

                                    <Box sx={{
                                        "& svg": { fontSize: 32, color: chain.color },
                                        filter: "drop-shadow(2px 2px 0px rgba(0,0,0,0.2))"
                                    }}>
                                        {chain.icon}
                                    </Box>
                                </Box>

                                {assets.length > 0 && (
                                    <Box sx={{
                                        display: "flex",
                                        gap: 1,
                                        mt: 0.5, // Reduced top margin slightly
                                        p: 1,
                                        borderRadius: 2,
                                        background: "#f5f5f5",
                                        "& svg, & img": { // Added & img selector
                                            fontSize: 20,
                                            width: 20,
                                            height: 20,
                                            display: "block" // Enhance layout behavior
                                        }
                                    }}>
                                        {assets.map((asset) => (
                                            <Box key={asset.name} title={asset.name}>
                                                {asset.icon}
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </Container>
        </Box>
    );
}
