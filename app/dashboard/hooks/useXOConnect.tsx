"use client";

import React, {
    ReactNode,
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
} from "react";
import { useEmbedded } from "@/app/dashboard/hooks/embebed";
import { toast } from "react-toastify";
import { Wallet } from "ethers";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import {
    decryptPrivateKey,
    encryptPrivateKey,
    generateSalt,
} from "@/app/utils/cripto";
import { Keypair } from "stellar-sdk";
import { createUSDCTrustline } from "@/app/lib/stellar/createUSDCTrustline";
import { base, polygon } from "viem/chains";
import { useXOPayer } from "@/app/dashboard/hooks/useXOPayer";
import { useXOWalletManager } from "./useXOWalletManager";


// =====================
//  NETWORK CONFIG
// =====================

export const NETWORKS = {
    base: {
        network: "base" as const,
        chain: base,
        chainId: "0x2105",
        rpcUrl: "https://mainnet.base.org",
        usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        usdcName: "USD Coin",
        usdcVersion: "2",
    },
    polygon: {
        network: "polygon" as const,
        chain: polygon,
        chainId: "0x89",
        rpcUrl: "https://polygon-rpc.com",
        usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        usdcName: "USD Coin",
        usdcVersion: "2",
    },
};

export type AvailableChains = keyof typeof NETWORKS;

interface XOContractsContextType {
    connect: () => Promise<void>;
    address: string | null;
    client: any;
    isUsingXO: boolean;
    currentNetwork: (typeof NETWORKS)[AvailableChains];
    payX402: (
        amount: string,
        recipientAddress: string,
        targetChain: AvailableChains
    ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
    loadWallet: (mnemonic: string, password: string) => Promise<void>;
    resetWallet: () => Promise<void>;
    factoryReset: () => void;
}

const XOContractsContext = createContext<XOContractsContextType | null>(null);

export const XOContractsProvider = ({
    children,
    password,
}: {
    children: ReactNode;
    password: string;
}) => {
    const [address, setAddress] = useState<string | null>(null);
    const [selectedChain] = useState<AvailableChains>("base");
    const [isUsingXO, setIsUsingXO] = useState(false);

    const xoProviderRef = useRef<any>(null);
    const initOnce = useRef(false);

    const { isEmbedded } = useEmbedded();
    const mainWallet = useXOWalletStore((s) => s.mainWallet);
    const hydrated = useXOWalletStore((s) => s.hydrated);
    const setMainWallet = useXOWalletStore((s) => s.setMainWallet);
    const setXOWallet = useXOWalletStore((s) => s.setXOWallet);
    const setXOClient = useXOWalletStore((s) => s.setXOClient);

    const canDecrypt =
        hydrated &&
        !!password &&
        !!mainWallet.encryptedPrivateKey &&
        !!mainWallet.salt &&
        !!mainWallet.iv;

    // Sub-hooks
    const { payX402 } = useXOPayer({ isUsingXO, xoProviderRef, address, password });
    const { loadWallet, resetWallet, factoryReset } = useXOWalletManager({
        password,
        isUsingXO,
        setAddress,
        setIsUsingXO
    });

    // ... (existing code for Init, Connect, Generate)

    const currentNetwork = NETWORKS[selectedChain];

    return (
        <XOContractsContext.Provider
            value={{
                connect,
                address,
                client: useXOWalletStore.getState().xoClient,
                isUsingXO,
                currentNetwork,
                payX402,
                loadWallet,
                resetWallet,
                factoryReset,
            }}
        >
            {children}
        </XOContractsContext.Provider >
    );
};

export const useXOContracts = () => {
    const ctx = useContext(XOContractsContext);
    if (!ctx) throw new Error("useXOContracts must be used within XOContractsProvider");
    return ctx;
};
