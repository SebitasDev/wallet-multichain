import { Box, Avatar, Typography } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import React from "react";

// Atom Icons imports
import { BaseIcon } from "../../components/atoms/BaseIcon";
import { OPIcon } from "../../components/atoms/OPIcon";
import { EthIcon } from "../../components/atoms/EthIcon";
import ArbIcon from "../../components/atoms/ArbIcon";
import PolygonIcon from "../../components/atoms/PolygonIcon";
import { AvalancheIcon } from "../../components/atoms/AvalancheIcon";
import { BnbIcon } from "../../components/atoms/BnbIcon";
import { StellarIcon } from "../../components/atoms/StellarIcon";
import { MonadIcon } from "../../components/atoms/MonadIcon";
import { UnichainIcon } from "../../components/atoms/UnichainIcon";
import { WorldChainIcon } from "../../components/atoms/WorldChainIcon";
import { UsdcIcon } from "../../components/atoms/UsdcIcon";
import { UsdtIcon } from "../../components/atoms/UsdtIcon";
import GnosisIcon from "../../components/atoms/GnosisIcon";
import { EureIcon } from "../../components/atoms/EureIcon";
import { XdaiIcon } from "../../components/atoms/XdaiIcon";

export const CHAIN_COMPONENTS: Record<string, React.ElementType> = {
    "Base": BaseIcon,
    "Optimism": OPIcon,
    "Ethereum": EthIcon,
    "Arbitrum": ArbIcon,
    "Polygon": PolygonIcon,
    "Avalanche": AvalancheIcon,
    "BNB": BnbIcon,
    "Binance": BnbIcon,
    "Binance Smart Chain": BnbIcon,
    "BSC": BnbIcon,
    "Stellar": StellarIcon,
    "Monad": MonadIcon,
    "Unichain": UnichainIcon,
    "World Chain": WorldChainIcon,
    "Gnosis": GnosisIcon,
};

export const TOKEN_COMPONENTS: Record<string, React.ElementType> = {
    "USDC": UsdcIcon,
    "USDT": UsdtIcon,
    "BNB": BnbIcon,
    "ETH": EthIcon,
    "WETH": EthIcon,
    "MATIC": PolygonIcon,
    "POL": PolygonIcon,
    "AVAX": AvalancheIcon,
    "XLM": StellarIcon,
    "OP": OPIcon,
    "ARB": ArbIcon,
    "MON": MonadIcon,
    "GNO": GnosisIcon,
    "EURe": EureIcon,
    "EURE": EureIcon,
    "EUR": EureIcon,
    "XDAI": XdaiIcon,
};

export const ChainLogo = ({ chain }: { chain: string }) => {
    const IconComponent = CHAIN_COMPONENTS[chain];
    if (IconComponent) return <IconComponent />;
    return (
        <Avatar sx={{ width: 16, height: 16, bgcolor: "#333" }}>
            <LinkIcon sx={{ fontSize: 10, color: "#fff" }} />
        </Avatar>
    );
};

export const TokenLogo = ({ token, size = 16 }: { token: string, size?: number }) => {
    const IconComponent = TOKEN_COMPONENTS[token] || TOKEN_COMPONENTS[token.toUpperCase()];

    if (!IconComponent) {
        console.log("Missing icon for token:", token);
    }

    if (IconComponent) {
        return (
            <Box sx={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', '& > *': { width: '100%', height: '100%' } }}>
                <IconComponent />
            </Box>
        );
    }

    return (
        <Avatar sx={{ width: size, height: size, bgcolor: "#000", fontSize: size * 0.5, fontWeight: 900 }}>
            {token.charAt(0)}
        </Avatar>
    );
};

export const getExplorerUrl = (chain: string, hash: string) => {
    const baselines: Record<string, string> = {
        "Ethereum": "https://etherscan.io/tx/",
        "Polygon": "https://polygonscan.com/tx/",
        "BNB": "https://bscscan.com/tx/",
        "Arbitrum": "https://arbiscan.io/tx/",
        "Optimism": "https://optimistic.etherscan.io/tx/",
        "Avalanche": "https://snowtrace.io/tx/",
        "Base": "https://basescan.org/tx/",
        "Stellar": "https://stellar.expert/explorer/public/tx/",
        "Monad": "https://explorer.monad.xyz/tx/",
        "Unichain": "https://unichain-explorer.com/tx/",
        "World Chain": "https://worldchain-explorer.com/tx/",
        "Gnosis": "https://gnosisscan.io/tx/",
        "Unknown": "#"
    };
    const base = baselines[chain] || baselines[Object.keys(baselines).find(k => chain.toLowerCase().includes(k.toLowerCase())) || "Unknown"];
    if (base === "#" || !hash) return "#";
    return `${base}${hash}`;
};

export const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <Box sx={{
                bgcolor: '#fff',
                border: '2px solid #000',
                boxShadow: '4px 4px 0px #000',
                p: 1.5,
                borderRadius: 2
            }}>
                <Typography fontWeight={900} fontSize={12} textTransform="uppercase" color="#666" mb={0.5}>
                    {label}
                </Typography>
                <Typography fontWeight={900} fontSize={16} color="#000">
                    ${payload[0].value.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                </Typography>
                <Typography variant="caption" fontWeight={700} color="#00DC8C">
                    En envíos
                </Typography>
            </Box>
        );
    }
    return null;
};
