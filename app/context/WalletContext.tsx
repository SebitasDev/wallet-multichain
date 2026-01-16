"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { WalletStrategy, StrategyId, WalletConnectionResult } from '../strategies/types';
import { MetaMaskStrategy } from '../strategies/MetaMaskStrategy';
import { XOWalletStrategy } from '../strategies/XOWalletStrategy';
import { LocalWalletStrategy } from '../strategies/LocalWalletStrategy';
import { useXOWalletStore } from '../store/useXOWalletStore'; // To sync with existing store if needed

interface WalletContextType {
    strategies: WalletStrategy[];
    activeStrategyId: StrategyId | null;
    activeStrategy: WalletStrategy | null;
    isConnected: boolean;
    address: string | null;
    chainId: string | null;
    connect: (strategyId: StrategyId, args?: any) => Promise<WalletConnectionResult>;
    disconnect: () => Promise<void>;
    getProvider: () => any;
    getSigner: () => any;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    // 1. Initialize Strategies
    // We memoize them so they don't get recreated on every render
    const strategies = useMemo(() => [
        new LocalWalletStrategy(),
        new MetaMaskStrategy(),
        new XOWalletStrategy(),
        // Add more strategies here in the future
    ], []);

    // 2. State
    const [activeStrategyId, setActiveStrategyId] = useState<StrategyId | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [chainId, setChainId] = useState<string | null>(null);

    // Sync with existing store (optional, but good for backward compatibility)
    const setConnectionMode = useXOWalletStore((s) => s.setConnectionMode);
    const setMetaMaskConnection = useXOWalletStore((s) => s.setMetaMaskConnection);

    // 3. Connect Function
    const connect = async (strategyId: StrategyId, args?: any): Promise<WalletConnectionResult> => {
        const strategy = strategies.find(s => s.id === strategyId);
        if (!strategy) {
            throw new Error(`Strategy ${strategyId} not found`);
        }

        try {
            const result: WalletConnectionResult = await strategy.connect(args);

            // Update State
            setActiveStrategyId(strategyId);
            setAddress(result.address);
            setChainId(result.chainId);

            // Sync with Legacy Store (if needed for other components)
            if (strategyId === 'metamask') {
                setConnectionMode('metamask');
                setMetaMaskConnection(result.address, result.chainId);
            } else if (strategyId === 'xo') {
                setConnectionMode('embedded');
                useXOWalletStore.getState().setXOWallet({ address: result.address });
            } else if (strategyId === 'local') {
                setConnectionMode('local');
            }

            return result; // Return result for immediate use

        } catch (error) {
            console.error(`Failed to connect with ${strategyId}:`, error);
            throw error;
        }
    };

    // 4. Disconnect Function
    const disconnect = async () => {
        if (activeStrategyId) {
            const strategy = strategies.find(s => s.id === activeStrategyId);
            if (strategy) {
                await strategy.disconnect();
            }
        }

        setActiveStrategyId(null);
        setAddress(null);
        setChainId(null);
        setConnectionMode(null);
    };

    // 5. Getters
    const activeStrategy = useMemo(() =>
        strategies.find(s => s.id === activeStrategyId) || null
        , [strategies, activeStrategyId]);

    const getProvider = () => activeStrategy?.getProvider();
    const getSigner = () => (activeStrategy as any)?.getSigner ? (activeStrategy as any).getSigner() : null;

    return (
        <WalletContext.Provider value={{
            strategies,
            activeStrategyId,
            activeStrategy,
            isConnected: !!activeStrategyId,
            address,
            chainId,
            connect,
            disconnect,
            getProvider,
            getSigner
        }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
};
