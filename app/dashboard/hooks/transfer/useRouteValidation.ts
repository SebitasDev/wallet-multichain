import { useMemo } from "react";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { STELLAR } from "@/app/constants/chains/NoEvm/Stellar";

export const STELLAR_CHAIN_KEY = "Stellar";

export const useRouteValidation = (sourceChain: string, destChain: string, sourceToken: string, destToken: string) => {
    return useMemo(() => {
        const getChainConfig = (key: string) => {
            if (key === STELLAR_CHAIN_KEY) return STELLAR;
            return NETWORKS[key as keyof typeof NETWORKS];
        };

        const sourceConfig = getChainConfig(sourceChain);
        const destConfig = getChainConfig(destChain);

        if (!sourceConfig || !destConfig) return null;

        const isSourceNonEvm = !!sourceConfig.nonEvm;
        const isDestNonEvm = !!destConfig.nonEvm;

        // Case 1: Heterogeneous Chains (EVM <-> Non-EVM)
        if (isSourceNonEvm !== isDestNonEvm) {
            const evmConfig = isSourceNonEvm ? destConfig : sourceConfig;
            const nonEvmConfig = isSourceNonEvm ? sourceConfig : destConfig;

            if (!evmConfig.crossChainInformation.nearIntentInformation?.support) {
                return `Ruta no disponible: ${evmConfig.label} no tiene soporte para conectar con ${nonEvmConfig.label}`;
            }
            if (!nonEvmConfig.crossChainInformation.nearIntentInformation?.support) {
                return `Ruta no disponible: ${nonEvmConfig.label} no tiene soporte para puentes`;
            }
        }

        // Case 2: Homogeneous EVM Chains (EVM <-> EVM)
        if (!isSourceNonEvm && !isDestNonEvm) {
            if (sourceToken === 'USDC' && destToken === 'USDC') {
                const sourceCCTP = sourceConfig.crossChainInformation.circleInformation?.cCTPInformation?.supportCCTP;
                const destCCTP = destConfig.crossChainInformation.circleInformation?.cCTPInformation?.supportCCTP;

                if (sourceCCTP && destCCTP) return null;

                const sourceNear = sourceConfig.crossChainInformation.nearIntentInformation?.support;
                const destNear = destConfig.crossChainInformation.nearIntentInformation?.support;

                if (sourceNear && destNear) return null;

                return `Ruta no disponible para USDC: Se requiere soporte CCTP o Near Intents en ambas chains.`;
            }
        }

        return null;
    }, [sourceChain, destChain, sourceToken, destToken]);
};
