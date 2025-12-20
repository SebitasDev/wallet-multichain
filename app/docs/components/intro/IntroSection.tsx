"use client";

import { Box, Typography } from "@mui/material";
import { DocsContentProps } from "../../types";

const CONTENT = {
    en: {
        title: "1LLET API",
        subtitle: "High-Performance Cross-Chain Bridge Infrastructure.",
        desc: "The 1LLET Bridge API empowers developers to integrate fast, secure, and low-cost cross-chain transfers into their applications. Our infrastructure specializes in bridging stablecoins (USDC) between EVM-compatible networks (like Base) and the Stellar network.",
        featuresTitle: "Key Capabilities",
        features: [
            {
                title: "Gasless Transfers",
                desc: "Utilizing EIP-3009, users can move funds without holding native gas tokens (ETH) on the source chain. The facilitator handles the transaction execution."
            },
            {
                title: "Optimized for Stellar",
                desc: "Seamless conversion to XLM or USDC on Stellar, leveraging the network's speed and low transaction costs."
            },
            {
                title: "Simple Integration",
                desc: "A streamlined REST API that abstracts the complexities of cross-chain liquidity and settlement."
            }
        ]
    },
    es: {
        title: "API de 1LLET",
        subtitle: "Infraestructura de Bridge Cross-Chain de Alto Rendimiento.",
        desc: "La API Bridge de 1LLET permite a los desarrolladores integrar transferencias entre cadenas rápidas, seguras y de bajo costo. Nuestra infraestructura se especializa en conectar stablecoins (USDC) entre redes EVM (como Base) y la red Stellar.",
        featuresTitle: "Capacidades Clave",
        features: [
            {
                title: "Transferencias Gasless",
                desc: "Usando EIP-3009, los usuarios pueden mover fondos sin tener gas nativo (ETH) en la cadena de origen. El facilitador maneja la ejecución."
            },
            {
                title: "Optimizado para Stellar",
                desc: "Conversión fluida a XLM o USDC en Stellar, aprovechando la velocidad y bajos costos de la red."
            },
            {
                title: "Integración Simple",
                desc: "Una API REST optimizada que abstrae las complejidades de la liquidez y liquidación cross-chain."
            }
        ]
    }
};

export default function IntroSection({ language }: DocsContentProps) {
    const t = CONTENT[language];

    return (
        <Box>
            <Typography variant="h3" fontWeight={900} gutterBottom sx={{ textTransform: "uppercase" }}>
                {t.title}
            </Typography>
            <Typography variant="h5" color="text.secondary" gutterBottom sx={{ mb: 4, fontWeight: 500 }}>
                {t.subtitle}
            </Typography>

            <Typography variant="body1" sx={{ mb: 6, fontSize: "1.1rem", lineHeight: 1.7, color: "#444" }}>
                {t.desc}
            </Typography>

            <Typography variant="h6" fontWeight={800} gutterBottom sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                {t.featuresTitle}
            </Typography>

            <Box component="ul" sx={{ pl: 2 }}>
                {t.features.map((item, index) => (
                    <Box component="li" key={index} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {item.desc}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
