import { useState, useEffect } from "react";
import { getNearSimulation } from "@1llet.xyz/erc4337-gasless-sdk";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";

interface SimulationState {
    done: boolean;
    error: string | null;
    loading: boolean;
    estimated: string;
}

export const useTransferSimulation = (
    amount: string,
    sourceChain: ChainKey,
    destChain: ChainKey | number,
    sourceToken: string,
    destToken: string
) => {
    const [simulation, setSimulation] = useState<SimulationState>({ done: true, error: null, loading: false, estimated: "0" });
    const [fee, setFee] = useState("0");
    const [transferTotal, setTransferTotal] = useState("0");

    useEffect(() => {
        const simulate = async () => {
            const amt = parseFloat(amount || "0");

            if (amt <= 0) {
                setSimulation({ done: true, error: null, loading: false, estimated: "0" });
                setFee("0");
                setTransferTotal("0");
                return;
            }

            setSimulation(prev => ({ ...prev, loading: true, done: false }));

            try {
                // Check for CCTP Bypass (USDC)
                const srcConfig = NETWORKS[sourceChain];
                const dstConfig = typeof destChain === 'string' ? NETWORKS[destChain] : undefined;

                const isCCTP =
                    (sourceToken === 'USDC' && destToken === 'USDC') &&
                    srcConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                    dstConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;

                let result;
                if (isCCTP) {
                    // 1:1 for CCTP
                    result = {
                        success: true,
                        estimatedReceived: amount,
                        protocolFee: 0,
                        error: null
                    };
                } else if (destChain === "Stacks" || destChain === 5000) {
                    // Bypass SDK Simulation for Stacks
                    result = {
                        success: true,
                        estimatedReceived: amount,
                        protocolFee: 0,
                        error: null
                    };
                } else {
                    // Call SDK Simulation
                    result = await getNearSimulation(
                        sourceChain as any,
                        destChain as any,
                        amount,
                        destToken,
                        sourceToken
                    );
                }

                if (result.success && result.estimatedReceived) {
                    setFee(result.protocolFee ? result.protocolFee.toString() : "0");
                    setTransferTotal(amount);
                    setSimulation({
                        done: true,
                        error: null,
                        loading: false,
                        estimated: result.estimatedReceived
                    });
                } else {
                    setSimulation({
                        done: true,
                        error: result.error || "Simulation failed",
                        loading: false,
                        estimated: "0"
                    });
                }

            } catch (e: any) {
                console.error("[Simulation] Error:", e);
                setSimulation({
                    done: true,
                    error: e.message,
                    loading: false,
                    estimated: "0"
                });
            }
        };

        const timer = setTimeout(() => {
            simulate();
        }, 500);

        return () => clearTimeout(timer);

    }, [amount, sourceChain, destChain, sourceToken, destToken]);

    return {
        simulation,
        fee,
        transferTotal,
        setSimulation // Exported if manual reset needed
    };
};
