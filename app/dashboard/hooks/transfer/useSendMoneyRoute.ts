import { useState, useEffect } from "react";
import { UseFormWatch } from "react-hook-form";
import { SendForm } from "@/app/lib/zod/sendSchema";
import { AllocationSummary } from "@/app/dashboard/types";
import { ChainConfig, ChainKey } from "@/app/types/chain";
import { RouteDetail } from "@/app/dashboard/hooks/transfer/useSendMoneyModal";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { bridgeApi } from "@/app/services/api";

type UseSendMoneyRouteProps = {
    routeSummary: AllocationSummary | null;
    setRouteSummary: (summary: AllocationSummary | null) => void;
    selected: ChainConfig;
    wallets: { name: string; address: string; chains: any[] }[];
    isEditing: boolean;
    watch: UseFormWatch<SendForm>;
    setSimulationError: (id: string, hasError: boolean) => void;
};

export const useSendMoneyRoute = ({
    routeSummary,
    setRouteSummary,
    selected,
    wallets,
    isEditing,
    watch,
    setSimulationError
}: UseSendMoneyRouteProps) => {
    // Simulation State
    const [simulating, setSimulating] = useState<Record<string, boolean>>({});
    const [simulationResults, setSimulationResults] = useState<Record<string, string | null>>({});
    const [simulationErrorMessages, setSimulationErrorMessages] = useState<Record<string, string | null>>({});

    // Menu State
    const [anchorElWallet, setAnchorElWallet] = useState<null | HTMLElement>(null);
    const [anchorElChain, setAnchorElChain] = useState<null | HTMLElement>(null);
    const [activeWalletForChainAdd, setActiveWalletForChainAdd] = useState<string | null>(null);

    const handleSimulate = async (chainId: string, amount: number, token: string, sourceChainKey: string) => {
        if (!amount || amount <= 0) return;

        setSimulating(prev => ({ ...prev, [chainId]: true }));
        setSimulationResults(prev => ({ ...prev, [chainId]: null }));
        setSimulationErrorMessages(prev => ({ ...prev, [chainId]: null }));
        setSimulationError(chainId, true);

        try {
            const destChainKey = watch("sendChain");

            const isDev = process.env.NODE_ENV === 'development';
            const baseFee = (sourceChainKey === destChainKey) ? 0.01 : 0.02;
            const fee = isDev ? 0 : baseFee;

            const totalAmountToSimulate = (amount + fee).toFixed(6);

            const data = await bridgeApi.getQuote({
                sourceChain: sourceChainKey,
                targetChain: destChainKey,
                amount: totalAmountToSimulate,
                token: watch("sourceToken") || "USDC",
                sourceToken: token
            });

            if (data.success && data.estimatedReceived) {
                setSimulationResults(prev => ({ ...prev, [chainId]: data.estimatedReceived }));
                setSimulationError(chainId, false);
            } else {
                const errorMsg = data.error || "Simulation failed";
                setSimulationErrorMessages(prev => ({ ...prev, [chainId]: errorMsg }));
                setSimulationError(chainId, true);
            }
        } catch (error) {
            console.error("Simulation error:", error);
            const errorMessage = (error as any)?.response?.data?.error || (error as any)?.message || "Failed to simulate";
            setSimulationErrorMessages(prev => ({ ...prev, [chainId]: errorMessage }));
            setSimulationError(chainId, true);
        } finally {
            setSimulating(prev => ({ ...prev, [chainId]: false }));
        }
    };

    // Auto-Simulate Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!routeSummary) return;
            const destChainKey = watch("sendChain");

            routeSummary.allocations.forEach(alloc => {
                alloc.chains.forEach(chain => {
                    const sourceChainKey = CHAIN_ID_TO_KEY[chain.chainId];
                    const sourceConfig = NETWORKS[sourceChainKey as keyof typeof NETWORKS];
                    const destConfig = NETWORKS[destChainKey as keyof typeof NETWORKS];

                    const isNearSupported =
                        sourceConfig?.crossChainInformation?.nearIntentInformation?.support &&
                        destConfig?.crossChainInformation?.nearIntentInformation?.support;

                    const isCCTP =
                        sourceConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                        destConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                        (chain.token || "USDC").toUpperCase() === "USDC" &&
                        (watch("sourceToken") || "USDC").toUpperCase() === "USDC";

                    if (isCCTP) {
                        // Manual Simulation for CCTP (1:1)
                        if (chain.amount > 0) {
                            setSimulationResults(prev => ({ ...prev, [chain.chainId]: chain.amount.toFixed(6) }));
                            setSimulationError(chain.chainId, false);
                            setSimulationErrorMessages(prev => ({ ...prev, [chain.chainId]: null }));
                        }
                        return;
                    }

                    if (isNearSupported && chain.amount > 0 && !simulationResults[chain.chainId] && !simulating[chain.chainId]) {
                        handleSimulate(chain.chainId, chain.amount, chain.token || "USDC", sourceChainKey);
                    }
                });
            });
        }, 800);

        return () => clearTimeout(timer);
    }, [routeSummary, watch("sendChain"), watch("sourceToken")]);

    const updateSummary = (newAllocations: AllocationSummary["allocations"]) => {
        if (!routeSummary) return;
        setRouteSummary({
            ...routeSummary,
            allocations: newAllocations,
            totalAmountTaken: newAllocations.reduce((sum, a) => sum + a.chains.reduce((s, c) => s + c.amount, 0), 0)
        });
    }

    const handleRemoveWallet = (walletAddress: string) => {
        if (!routeSummary) return;

        // [FIX] Clear errors for all chains in this wallet
        const walletAlloc = routeSummary.allocations.find(a => a.from.toLowerCase() === walletAddress.toLowerCase());
        walletAlloc?.chains.forEach(c => {
            setSimulationError(c.chainId, false);
            setSimulationErrorMessages(prev => ({ ...prev, [c.chainId]: null }));
        });

        const newAllocations = routeSummary.allocations.filter(
            alloc => alloc.from.toLowerCase() !== walletAddress.toLowerCase()
        );

        updateSummary(newAllocations);
    };

    const handleRemoveChain = (walletAddress: string, chainId: string) => {
        if (!routeSummary) return;

        // [FIX] Clear error for this chain
        setSimulationError(chainId, false);
        setSimulationErrorMessages(prev => ({ ...prev, [chainId]: null }));

        const newAllocations = routeSummary.allocations.map(alloc => {
            if (alloc.from.toLowerCase() !== walletAddress.toLowerCase()) return alloc;
            return {
                ...alloc,
                chains: alloc.chains.filter(c => c.chainId !== chainId)
            };
        }).filter(alloc => alloc.chains.length > 0);

        updateSummary(newAllocations);
    };

    const handleTokenChange = (walletAddress: string, chainId: string, newToken: string) => {
        if (!routeSummary) return;

        const newAllocations = routeSummary.allocations.map(alloc => {
            if (alloc.from.toLowerCase() !== walletAddress.toLowerCase()) return alloc;
            return {
                ...alloc,
                chains: alloc.chains.map(c => c.chainId === chainId ? { ...c, token: newToken } : c)
            };
        });

        setSimulationResults(prev => ({ ...prev, [chainId]: null }));
        setSimulationErrorMessages(prev => ({ ...prev, [chainId]: null }));
        setSimulationError(chainId, true);
        updateSummary(newAllocations);
    };

    const handleAmountChange = (walletAddress: string, chainId: string, newAmount: string) => {
        if (!routeSummary) return;

        const amount = parseFloat(newAmount) || 0;

        const newAllocations = routeSummary.allocations.map(alloc => {
            if (alloc.from.toLowerCase() !== walletAddress.toLowerCase()) return alloc;
            return {
                ...alloc,
                chains: alloc.chains.map(c => c.chainId === chainId ? { ...c, amount: amount } : c)
            };
        });

        setSimulationResults(prev => ({ ...prev, [chainId]: null }));
        setSimulationErrorMessages(prev => ({ ...prev, [chainId]: null }));
        setSimulationError(chainId, true);
        updateSummary(newAllocations);
    };

    const handleAddWallet = (wallet: { name: string; address: string; chains: any[] }) => {
        if (!routeSummary) return;

        if (routeSummary.allocations.some(a => a.from.toLowerCase() === wallet.address.toLowerCase())) {
            handleCloseWalletMenu();
            return;
        }

        const newAllocations = [
            ...routeSummary.allocations,
            {
                from: wallet.address,
                chains: []
            }
        ];

        updateSummary(newAllocations);
        handleCloseWalletMenu();
    };

    const handleAddChain = (walletAddress: string, chain: any) => {
        if (!routeSummary) return;

        const chainId = (chain.evm?.chain?.id || chain.value || chain.chainId || chain.id).toString();

        const newAllocations = routeSummary.allocations.map(alloc => {
            if (alloc.from.toLowerCase() !== walletAddress.toLowerCase()) return alloc;

            if (alloc.chains.some(c => c.chainId === chainId)) return alloc;

            return {
                ...alloc,
                chains: [
                    ...alloc.chains,
                    {
                        chainId: chainId,
                        amount: 0,
                        token: "USDC"
                    }
                ]
            };
        });

        updateSummary(newAllocations);
        handleCloseChainMenu();
    };

    const handleCloseWalletMenu = () => {
        setAnchorElWallet(null);
    };

    const handleCloseChainMenu = () => {
        setAnchorElChain(null);
        setActiveWalletForChainAdd(null);
    };

    const handleOpenChainMenu = (event: React.MouseEvent<HTMLElement>, walletAddress: string) => {
        setAnchorElChain(event.currentTarget);
        setActiveWalletForChainAdd(walletAddress);
    };

    const handleOpenWalletMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElWallet(event.currentTarget);
    };

    // Validation Check to Disable Save
    const hasErrors = (routeSummary?.allocations || []).some(walletAlloc => {
        return walletAlloc.chains.some(r => {
            const currentWallet = wallets.find(w => w.address.toLowerCase() === walletAlloc.from.toLowerCase());
            const currentChainDetail = currentWallet?.chains.find(c => {
                const cId = (c.value || c.chainId || c.id || "").toString();
                return cId === r.chainId;
            });
            const chainBalance = currentChainDetail?.amount || 0;
            const destChainId = selected.evm?.chain?.id?.toString() || "";
            const isSameChain = destChainId === r.chainId;
            const isUSDC = (r.token || "USDC").toUpperCase() === "USDC";

            const isDev = process.env.NODE_ENV === 'development';
            const baseFee = (isSameChain && isUSDC) ? 0.01 : 0.02;
            const fee = isDev ? 0 : baseFee;
            const maxUsable = Math.max(0, chainBalance - fee);

            if (r.amount <= 0 || r.amount > maxUsable + 1e-9) return true;

            const sourceChainKey = CHAIN_ID_TO_KEY[r.chainId];
            const destChainKey = watch("sendChain");
            const sourceConfig = NETWORKS[sourceChainKey as keyof typeof NETWORKS];
            const destConfig = NETWORKS[destChainKey as keyof typeof NETWORKS];

            const isNearSupported =
                sourceConfig?.crossChainInformation?.nearIntentInformation?.support &&
                destConfig?.crossChainInformation?.nearIntentInformation?.support;

            const isCCTP =
                sourceConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                destConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                (r.token || "USDC").toUpperCase() === "USDC";

            if (isCCTP) return false;

            if (isNearSupported && !isEditing) {
                if (!simulationResults[r.chainId]) return true;
            }

            return false;
        });
    });

    return {
        simulating,
        simulationResults,
        simulationErrorMessages,
        anchorElWallet,
        anchorElChain,
        activeWalletForChainAdd,
        hasErrors,
        handleSimulate,
        handleRemoveWallet,
        handleRemoveChain,
        handleTokenChange,
        handleAmountChange,
        handleAddWallet,
        handleAddChain,
        handleCloseWalletMenu,
        handleCloseChainMenu,
        handleOpenChainMenu,
        handleOpenWalletMenu
    };
};
