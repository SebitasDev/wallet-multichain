import { useState, useEffect } from "react";
import { UseFormWatch } from "react-hook-form";
import { SendForm } from "@/app/lib/zod/sendSchema";
import { AllocationSummary } from "@/app/dashboard/types";
import { ChainConfig, ChainKey } from "@/app/types/chain";
import { CHAIN_ID_TO_KEY, NETWORKS } from "@/app/constants/chainsInformation";
import { getNearSimulation } from "@1llet.xyz/erc4337-gasless-sdk";
import { createPublicClient, http, formatEther } from "viem";

type UseSendMoneyRouteProps = {
    routeSummary: AllocationSummary | null;
    setRouteSummary: (summary: AllocationSummary | null) => void;
    selected: ChainConfig;
    wallets: { name: string; address: string; chains: any[] }[];
    isEditing: boolean;
    watch: UseFormWatch<SendForm>;
    setSimulationError: (id: string, hasError: boolean) => void;
    priceMap?: Record<string, number>; // [NEW]
};

export const useSendMoneyRoute = ({
    routeSummary,
    setRouteSummary,
    selected,
    wallets,
    isEditing,
    watch,
    setSimulationError,
    priceMap
}: UseSendMoneyRouteProps) => {
    // Simulation State
    const [simulating, setSimulating] = useState<Record<string, boolean>>({});
    const [simulationResults, setSimulationResults] = useState<Record<string, string | null>>({});
    const [simulationErrorMessages, setSimulationErrorMessages] = useState<Record<string, string | null>>({});

    // Menu State
    const [anchorElWallet, setAnchorElWallet] = useState<null | HTMLElement>(null);
    const [anchorElChain, setAnchorElChain] = useState<null | HTMLElement>(null);
    const [activeWalletForChainAdd, setActiveWalletForChainAdd] = useState<string | null>(null);

    const handleSimulate = async (id: string, chainId: string, amount: number, token: string, sourceChainKey: string) => {
        if (!amount || amount <= 0 || !id) return;

        setSimulating(prev => ({ ...prev, [id]: true }));
        setSimulationResults(prev => ({ ...prev, [id]: null }));
        setSimulationErrorMessages(prev => ({ ...prev, [id]: null }));
        setSimulationError(id, true);

        try {
            const destChainKey = watch("sendChain");

            const isDev = process.env.NODE_ENV === 'development';
            const baseFee = (sourceChainKey === destChainKey) ? 0.01 : 0.02;
            const fee = isDev ? 0 : baseFee;

            // [FIX] Gas Deduction Logic for Native Tokens
            const sourceConfig = NETWORKS[sourceChainKey as keyof typeof NETWORKS];
            const asset = sourceConfig?.assets?.find(a => a.name === token);
            const isNative = asset?.address === "0x0000000000000000000000000000000000000000" || (!!asset?.address && asset.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");

            let netAmount = amount;

            if (isNative && sourceConfig?.evm) {
                try {
                    const publicClient = createPublicClient({
                        chain: sourceConfig.evm.chain,
                        transport: http()
                    });
                    const gasPrice = await publicClient.getGasPrice();
                    const gasCostWei = (BigInt(21000) * gasPrice * BigInt(150)) / BigInt(100); // 21k Gas + 50% Buffer
                    const gasCostEth = parseFloat(formatEther(gasCostWei));

                    console.log(`[Simulate] Gas Deduction (${token}): ${gasCostEth.toFixed(6)}`);
                    netAmount = Math.max(0, amount - gasCostEth);

                    if (netAmount <= 0) {
                        throw new Error(`Insufficient funds for gas (Need ${gasCostEth.toFixed(6)} ${token})`);
                    }

                } catch (e: any) {
                    console.warn("[Simulate] Gas Estimation Failed:", e);
                    // Don't block simulation if gas check fails, but maybe user has insufficient funds.
                    // Fallback to original amount logic or throw? 
                    // Throwing helps user know why it might fail.
                    if (e.message.includes("Insufficient")) throw e;
                }
            }

            const totalAmountToSimulate = (netAmount + fee).toFixed(6);

            // Use SDK's getNearSimulation
            const data = await getNearSimulation(
                sourceChainKey as ChainKey,
                destChainKey as ChainKey,
                totalAmountToSimulate,
                watch("sourceToken") || "USDC",
                token
            );

            if (data.success && data.estimatedReceived) {
                setSimulationResults(prev => ({ ...prev, [id]: data.estimatedReceived }));
                setSimulationError(id, false);
            } else {
                const errorMsg = data.error || "Simulation failed";
                setSimulationErrorMessages(prev => ({ ...prev, [id]: errorMsg }));
                setSimulationError(id, true);
            }
        } catch (error) {
            console.error("Simulation error:", error);
            const errorMessage = (error as any)?.response?.data?.error || (error as any)?.message || "Failed to simulate";
            setSimulationErrorMessages(prev => ({ ...prev, [id]: errorMessage }));
            setSimulationError(id, true);
        } finally {
            setSimulating(prev => ({ ...prev, [id]: false }));
        }
    };

    // Auto-Simulate Effect (Sequential to prevent Rate Limiting / Collisions)
    useEffect(() => {
        let isActive = true;
        const triggerSimulations = async () => {
            if (!routeSummary) return;
            const destChainKey = watch("sendChain");

            for (const alloc of routeSummary.allocations) {
                for (const chain of alloc.chains) {
                    if (!isActive) return;

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
                        if (chain.amount > 0 && chain.id) {
                            setSimulationResults(prev => ({ ...prev, [chain.id!]: chain.amount.toFixed(6) }));
                            setSimulationError(chain.id!, false);
                            setSimulationErrorMessages(prev => ({ ...prev, [chain.id!]: null }));
                        }
                        continue;
                    }

                    if (isNearSupported && chain.amount > 0 && chain.id && !simulationResults[chain.id] && !simulating[chain.id]) {
                        console.log(`[Simulate] Sequential Trigger for ${chain.id}...`);
                        await handleSimulate(chain.id, chain.chainId, chain.amount, chain.token || "USDC", sourceChainKey);
                        // [FIX] Wait 1s between simulations to prevent parallel failures
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }
            }
        };

        const timer = setTimeout(triggerSimulations, 800);
        return () => {
            isActive = false;
            clearTimeout(timer);
        };
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
            if (c.id) {
                setSimulationError(c.id, false);
                setSimulationErrorMessages(prev => ({ ...prev, [c.id!]: null }));
            }
        });

        const newAllocations = routeSummary.allocations.filter(
            alloc => alloc.from.toLowerCase() !== walletAddress.toLowerCase()
        );

        updateSummary(newAllocations);
    };

    const handleRemoveChain = (walletAddress: string, chainId: string, id?: string) => {
        if (!routeSummary) return;

        // [FIX] Clear error for this chain (and ID if exists)
        setSimulationError(chainId, false);
        if (id) {
            setSimulationError(id, false);
            setSimulationErrorMessages(prev => ({ ...prev, [chainId]: null, [id]: null }));
        } else {
            setSimulationErrorMessages(prev => ({ ...prev, [chainId]: null }));
        }

        const newAllocations = routeSummary.allocations.map(alloc => {
            if (alloc.from.toLowerCase() !== walletAddress.toLowerCase()) return alloc;
            return {
                ...alloc,
                chains: alloc.chains.filter(c => {
                    // Match by ID if available, otherwise ChainID (legacy/fallback)
                    if (id && c.id) return c.id !== id;
                    return c.chainId !== chainId;
                })
            };
        }).filter(alloc => alloc.chains.length > 0);

        updateSummary(newAllocations);
    };

    const handleTokenChange = (walletAddress: string, chainId: string, newToken: string, id?: string) => {
        if (!routeSummary) return;

        const newAllocations = routeSummary.allocations.map(alloc => {
            if (alloc.from.toLowerCase() !== walletAddress.toLowerCase()) return alloc;
            return {
                ...alloc,
                chains: alloc.chains.map(c => {
                    const isMatch = (id && c.id) ? c.id === id : c.chainId === chainId;
                    // [FIX] Update Price for new Token
                    let newPrice = c.price;
                    if (isMatch) {
                        const tokenAsset = NETWORKS[CHAIN_ID_TO_KEY[c.chainId] as ChainKey]?.assets.find(a => a.name === newToken);
                        if (tokenAsset && priceMap) {
                            newPrice = priceMap[tokenAsset.coingeckoId || ""] || 1;
                        } else {
                            newPrice = 1; // Fallback
                        }
                    }
                    return isMatch ? { ...c, token: newToken, price: newPrice } : c;
                })
            };
        });

        if (id) {
            setSimulationResults(prev => ({ ...prev, [id]: null }));
            setSimulationErrorMessages(prev => ({ ...prev, [id]: null }));
            setSimulationError(id, false); // [FIX] Reset error on change
        } else {
            // Fallback for logic where id might be missing (shouldn't happen with new logic)
            setSimulationResults(prev => ({ ...prev, [chainId]: null })); // Legacy
            setSimulationError(chainId, false); // [FIX] Reset error on change
        }
        updateSummary(newAllocations);
    };

    const handleAmountChange = (walletAddress: string, chainId: string, newAmount: string, id?: string) => {
        if (!routeSummary) return;

        const amount = parseFloat(newAmount) || 0;

        const newAllocations = routeSummary.allocations.map(alloc => {
            if (alloc.from.toLowerCase() !== walletAddress.toLowerCase()) return alloc;
            return {
                ...alloc,
                chains: alloc.chains.map(c => {
                    const isMatch = (id && c.id) ? c.id === id : c.chainId === chainId;
                    return isMatch ? { ...c, amount: amount } : c;
                })
            };
        });

        if (id) {
            setSimulationResults(prev => ({ ...prev, [id]: null }));
            setSimulationErrorMessages(prev => ({ ...prev, [id]: null }));
            setSimulationError(id, false); // [FIX] Reset error on change
        } else {
            setSimulationResults(prev => ({ ...prev, [chainId]: null }));
            setSimulationError(chainId, false); // [FIX] Reset error on change
        }
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

            return {
                ...alloc,
                chains: [
                    ...alloc.chains,
                    {
                        chainId: chainId,
                        amount: 0,
                        token: "USDC", // Default Token
                        id: crypto.randomUUID(),
                        price: (priceMap && priceMap["usd-coin"]) || 1 // Default USDC Price
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
            // [FIX] Correct Balance Lookup (Tokens vs Native)
            const tokenSymbol = r.token || "USDC";
            const chainBalance = currentChainDetail?.tokens?.[tokenSymbol] || 0;

            const destChainId = selected.evm?.chain?.id?.toString() || "";
            const isSameChain = destChainId === r.chainId;
            const isUSDC = tokenSymbol.toUpperCase() === "USDC";

            const isDev = process.env.NODE_ENV === 'development';
            const baseFee = (isSameChain && isUSDC) ? 0.01 : 0.02;
            const feeUSD = isDev ? 0 : baseFee;

            // [FIX] Move Config/Key definitions UP for Price Lookup
            const sourceChainKey = CHAIN_ID_TO_KEY[r.chainId];
            const destChainKey = watch("sendChain");
            const sourceConfig = NETWORKS[sourceChainKey as keyof typeof NETWORKS];
            const destConfig = NETWORKS[destChainKey as keyof typeof NETWORKS];

            // [FIX] Validation using Price (Correct ID Lookup)
            let tokenPrice = r.price;
            if (!tokenPrice && priceMap) {
                const asset = sourceConfig?.assets?.find(a => a.name === tokenSymbol);
                const geckoId = asset?.coingeckoId || (isUSDC ? "usd-coin" : "");
                tokenPrice = priceMap[geckoId] || 1;
            }
            const safePrice = tokenPrice || 1;

            const feeTokens = feeUSD / safePrice;
            const maxUsable = Math.max(0, chainBalance - feeTokens);

            // [FIX] Add Tolerance to match UI (1.0001)
            const validationMax = maxUsable * 1.0001;

            if (r.amount <= 0 || r.amount > validationMax) return true;

            const isNearSupported =
                sourceConfig?.crossChainInformation?.nearIntentInformation?.support &&
                destConfig?.crossChainInformation?.nearIntentInformation?.support;

            const isCCTP =
                sourceConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                destConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
                (r.token || "USDC").toUpperCase() === "USDC";

            if (isCCTP) return false;

            if (isNearSupported && !isEditing) {
                if (!simulationResults[r.id || r.chainId]) return true;
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
