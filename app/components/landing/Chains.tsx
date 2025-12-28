"use client";

import { Box, Container, Typography, keyframes } from "@mui/material";
import { Language, translate, chains, sectionTitles } from "@/app/landing-translations";
import { SectionTitle } from "./SectionTitle";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";

const marquee = keyframes`
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
`;

export function Chains({ lang }: { lang: Language }) {
    const getAssetsForChain = (chainName: string) => {
        // Map display name to NETWORKS key if needed, or assume they match
        // keys in NETWORKS: Optimism, Arbitrum, Base, Unichain, Polygon, Avalanche, WorldChain, Stellar, Monad, BNB
        const key = chainName.split(" ").join("") as ChainKey; // "World Chain" -> "WorldChain"
        // Handle explicit mismatches if any
        const config = NETWORKS[key] || NETWORKS[chainName as ChainKey];
        return config?.assets || [];
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
                        return (
                            <Box
                                key={`${chain.name}-${index}`}
                                sx={{
                                    width: 200,
                                    flexShrink: 0,
                                    p: 2,
                                    background: "#ffffff",
                                    border: "3px solid #000000",
                                    borderRadius: 3,
                                    boxShadow: "4px 4px 0px #000000",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 1,
                                    position: "relative",
                                    transition: "all 0.2s",
                                    "&:hover": {
                                        transform: "translate(-2px, -2px)",
                                        boxShadow: "6px 6px 0px #000000",
                                    },
                                }}
                            >
                                {/* Correct Layout: Icon, Name, Assets. No 0.00 Balance. */}
                                <Box sx={{ "& svg": { fontSize: 48, color: chain.color } }}>{chain.icon}</Box>
                                <Typography fontWeight={800} fontSize={18} sx={{ textTransform: "none" }}>
                                    {chain.name}
                                </Typography>

                                {assets.length > 0 && (
                                    <Box sx={{
                                        display: "flex",
                                        gap: 1,
                                        mt: 0.5,
                                        p: 1,
                                        borderRadius: 2,
                                        background: "#f5f5f5",
                                        "& svg, & img": {
                                            fontSize: 20,
                                            width: 20,
                                            height: 20,
                                            display: "block"
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
