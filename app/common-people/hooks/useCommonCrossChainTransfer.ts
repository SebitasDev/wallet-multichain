import { useEffect, useRef, useMemo } from "react";
import { useCrossChainTransfer } from "@/app/dashboard/hooks/transfer/useCrossChainTransfer";
import { useSendMoneyStore } from "@/app/dashboard/store/useSendMoneyStore";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { useCommonMaxTransferAmount } from "./useCommonMaxTransferAmount";
import { useXOContracts } from "@/app/dashboard/hooks/wallet/useXOConnect"; // [NEW IMPORT]

export const useCommonCrossChainTransfer = () => {
    // 1. Core Logic (Now fully functional thanks to Providers in Layout)
    const transferLogic = useCrossChainTransfer();
    const { form, watchSourceChain, maxAmount } = transferLogic;

    // 2. Open State from Store
    const { isOpen, initialChain } = useSendMoneyStore();

    // 3. Chain Selection Logic
    // We still need to pick an initial Source Chain because "General" modal needs *some* source.
    // We use the store to find where the money is.
    const chains = useXOWalletStore(s => s.mainWallet.chains);
    // Note: We don't force refresh here anymore, assuming Layout/Dashboard logic handles it, 
    // or if we do, we do it cleanly. Let's keep the refresh for safety but silent.
    const refreshBalances = useXOWalletStore(s => s.refreshMainWalletBalances);
    const hasRefreshed = useRef(false);
    const hasAutoSelected = useRef(false); // [NEW] Prevent repetitive overwrites

    useEffect(() => {
        if (isOpen && !initialChain) {
            // Trigger refresh once
            if (!hasRefreshed.current) {
                refreshBalances().catch(console.error);
                hasRefreshed.current = true;
            }

            // Only auto-select ONCE per session
            if (hasAutoSelected.current) return;
            hasAutoSelected.current = true;

            console.log("[CommonCrossChain] Selecting Best Source Chain based on Total Value...");

            // Strategy: Find EVM chain with Highest Total USD Value
            let bestChain = "Base";
            let maxChainValue = -1;
            let bestToken = "USDC";

            if (chains && chains.length > 0) {
                // 1. Find Best Chain
                chains.forEach(c => {
                    const cfg = Object.values(NETWORKS).find(n => n.evm?.chain.id.toString() === c.chainId);
                    if (cfg && c.amount > maxChainValue) {
                        maxChainValue = c.amount;
                        // Map back to Key
                        const foundKey = Object.keys(NETWORKS).find(k => NETWORKS[k as keyof typeof NETWORKS] === cfg);
                        if (foundKey) bestChain = foundKey;
                    }
                });

                // 2. Find Best Token on that Chain (Highest Balance)
                const selectedChainData = chains.find(c => {
                    const cfg = NETWORKS[bestChain as keyof typeof NETWORKS];
                    return cfg.evm?.chain.id.toString() === c.chainId;
                });

                if (selectedChainData?.tokens) {
                    let maxTokenVal = -1;
                    Object.entries(selectedChainData.tokens).forEach(([symbol, bal]) => {
                        // Heuristic: USDC/USDT priority
                        if (symbol.includes("USD") && bal > 0) {
                            if (bal > maxTokenVal) {
                                maxTokenVal = bal;
                                bestToken = symbol;
                            }
                        } else if (bal > 0 && maxTokenVal <= 0) {
                            bestToken = symbol;
                        }
                    });
                }
            }

            // [DIAGNOSTIC] Log selection
            console.log(`[CommonCrossChain] Auto-Select: Chain=${bestChain}, Token=${bestToken}, Val=${maxChainValue}`);

            // Apply Selection (ONLY IF NOT SET)
            const currentSource = form.getValues("sourceChain");
            if (!currentSource) {
                form.setValue("sourceChain", bestChain as any, { shouldValidate: true });
            }

            // Apply Token Selection (ONLY IF NOT SET)
            const currentToken = form.getValues("sourceToken");
            if (!currentToken) {
                const finalSourceToken = bestToken || "USDC";
                form.setValue("sourceToken", finalSourceToken, { shouldValidate: true });
            }

            // [DIAGNOSTIC] Log current form state
            console.log("[CommonCrossChain] Form Set:", form.getValues());

            // Default Dest: Same as Source (Intra-Chain by default)
            const currentDest = form.getValues("destChain");
            if (!currentDest) {
                form.setValue("destChain", bestChain as any, { shouldValidate: true });
            }
            // Default Dest Token: Match Source (if source was auto-selected or just default)
            // But we should be careful not to overwrite if user already picked.
            // Since we are in the "only run once" block, this is safe for initial open.
            const finalSourceToken = bestToken || "USDC"; // Re-derive for dest default
            if (!form.getValues("destToken")) {
                form.setValue("destToken", finalSourceToken, { shouldValidate: true });
            }

        } else if (!isOpen) {
            hasRefreshed.current = false;
            hasAutoSelected.current = false; // Reset for next open
        }
    }, [isOpen, initialChain, chains, form, refreshBalances]);

    // 4. Overwrite MaxAmount Logic with Custom Hook (For Common People - bypasses 0.01 fee)
    const { address } = useXOContracts(); // Or get from transferLogic if exposed, assuming we need it directly
    // Ideally we grab values from transferLogic logs or we pass them in.
    // useCrossChainTransfer exposes: form, watchSourceChain, etc.
    const { watch } = form;
    const sChain = watch("sourceChain");
    const dChain = watch("destChain");
    const sToken = watch("sourceToken");
    const dToken = watch("destToken");
    const chainsList = useXOWalletStore(s => s.mainWallet.chains);

    // Call our Custom Hook
    const { maxAmount: commonMaxAmount, balance: commonBalance } = useCommonMaxTransferAmount(
        transferLogic.address,
        sChain,
        dChain,
        sToken,
        dToken,
        null, // Stellar private key - maybe not needed or we grab it if we can? 
        // transferLogic doesn't expose it easily? 
        // Actually useCrossChainTransfer exposes almost everything but let's check.
        // If transferLogic doesn't expose keys, we might need to grab them or just pass null.
        // For EVM logic (USDC), keys aren't needed for fetching balance.
        chainsList
    );

    // [DEBUG] Log State
    const currentValues = form.getValues();
    const { simulation, simulateTransfer: originalSimulate, routeError } = transferLogic;

    useEffect(() => {
        const { sourceChain, destChain, sourceToken, destToken, amount, recipient } = currentValues;
        console.log("[CommonCrossChain] State Update:", {
            sourceChain,
            destChain,
            sourceToken,
            destToken,
            amount: amount || "empty",
            recipient: recipient || "empty",
            simulation: simulation,
            routeError: routeError
        });
    }, [
        simulation,
        currentValues.sourceChain,
        currentValues.destChain,
        currentValues.sourceToken,
        currentValues.destToken,
        currentValues.amount,
        currentValues.recipient,
        routeError
    ]);

    const simulateTransferWithLogs = async () => {
        console.log("[CommonCrossChain] simulateTransfer triggered!");
        console.log("[CommonCrossChain] Current Form State:", form.getValues());
        return originalSimulate();
    };

    // [FIX] Override isExceedingMax to use CommonMaxAmount
    const { watchAmount } = transferLogic;
    const isExceedingMax = useMemo(() => {
        const strAmount = watchAmount ? String(watchAmount) : "";
        if (!strAmount || strAmount.trim() === "") return false;
        const amount = parseFloat(strAmount);
        return !isNaN(amount) && amount > commonMaxAmount;
    }, [watchAmount, commonMaxAmount]);

    return {
        ...transferLogic,
        isOpen,
        // OVERRIDE MaxAmount and Balance with our custom ones
        maxAmount: commonMaxAmount,
        balance: commonBalance,
        simulateTransfer: simulateTransferWithLogs,
        isExceedingMax // [FIX] Override
    };
};
