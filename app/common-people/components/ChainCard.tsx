
import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

export interface Asset {
    symbol: string;
    balance: string;
    value: string;
    formattedValue?: FormattedBalance;
    icon?: ReactNode;
}

export interface FormattedBalance {
    symbol: string;
    integer: string;
    decimal: string;
    code?: string;
}

export interface ChainData {
    id: string;
    networkKey?: string;
    name: string;
    icon?: ReactNode;
    totalValue: string;
    formattedBalance?: FormattedBalance;
    color: string;
    assets: Asset[];
}

interface ChainCardProps {
    chain: ChainData;
    onClick: () => void;
    hideBalance?: boolean;
}

export function ChainCard({ chain, onClick, hideBalance }: ChainCardProps) {
    return (
        <Box
            onClick={onClick}
            sx={{
                width: "100%",
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": {
                    transform: "translateY(-2px)",
                },
                mt: 1.5, // spacing
            }}
        >
            {/* Back Tab Layer */}
            <Box
                sx={{
                    position: "absolute",
                    top: -8,
                    left: 0,
                    right: 0,
                    height: 48,
                    backgroundColor: chain.color,
                    opacity: 0.8,
                    borderRadius: "16px 16px 0 0",
                    zIndex: 0,
                }}
            />

            {/* Icon - TUCKED BEHIND FRONT CARD (z-index 1) */}
            <Box
                sx={{
                    position: "absolute",
                    top: -28,
                    left: 12,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    backgroundColor: chain.color,
                    border: "2px solid rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1, // Behind Front Card
                    color: "white",
                    fontWeight: 900,
                    fontSize: 12,
                    boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                    overflow: "hidden"
                }}
            >
                {chain.icon || chain.name.substring(0, 2).toUpperCase()}
            </Box>

            {/* Front White Card (z-index 2) */}
            <Box
                sx={{
                    position: "relative",
                    marginTop: "20px", // Reduced offset slightly
                    backgroundColor: "white",
                    borderRadius: "16px",
                    zIndex: 2, // Covers bottom of icon
                    p: 2,
                    pb: 1, // Reduced padding
                    boxShadow: "0px 4px 6px rgba(0,0,0,0.05)",
                    overflow: "hidden",
                    minHeight: 64, // Shorter height
                }}
            >
                {/* Diagonal Color Corner */}
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: 0,
                        height: 0,
                        borderStyle: "solid",
                        borderWidth: "0 36px 36px 0", // Smaller corner
                        borderColor: `transparent ${chain.color} transparent transparent`,
                        zIndex: 3,
                    }}
                />

                {/* Content */}
                <Box>
                    <Typography variant="h6" fontWeight={900} sx={{ fontSize: "1.25rem", lineHeight: 1, display: "flex", alignItems: "baseline", letterSpacing: "-0.02em" }}>
                        {hideBalance ? "****" : (
                            chain.formattedBalance ? (
                                <>
                                    <span style={{ fontSize: "0.8em", marginRight: 2 }}>{chain.formattedBalance.symbol}</span>
                                    <span>{chain.formattedBalance.integer}</span>
                                    <span style={{ fontSize: "0.6em", position: "relative", top: -5 }}>.{chain.formattedBalance.decimal}</span>
                                    {chain.formattedBalance.code && (
                                        <span style={{ fontSize: "0.4em", marginLeft: 4, alignSelf: "center", fontWeight: 700 }}>{chain.formattedBalance.code}</span>
                                    )}
                                </>
                            ) : chain.totalValue
                        )}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-end">
                        <Typography
                            variant="body2"
                            fontWeight={700}
                            color="text.secondary"
                            sx={{
                                textTransform: "uppercase",
                                fontSize: "0.65rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "55%", // Prevent overlap with icons
                                mr: 1
                            }}
                        >
                            {chain.name}
                        </Typography>

                        {/* Small Token Icons */}
                        <Box display="flex" gap={0.5}>
                            {chain.assets.map((asset, idx) => (
                                <Box
                                    key={idx}
                                    sx={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        "& svg": { width: "100%", height: "100%" },
                                        "& img": { width: "100%", height: "100%", objectFit: "cover" }
                                    }}
                                >
                                    {asset.icon ?? (
                                        <Box
                                            sx={{
                                                width: "100%",
                                                height: "100%",
                                                backgroundColor: chain.color, // usage of chain color for fallback
                                                color: "white",
                                                fontSize: "8px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            {asset.symbol[0]}
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
