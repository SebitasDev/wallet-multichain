"use client";

import React, {
    ReactNode,
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
} from "react";
import { useEmbedded } from "@/app/dashboard/hooks/dashboard/embedded";
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

import { useWalletStorage } from "./useWalletStorage";
import { useWallet } from "@/app/context/WalletContext";


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

interface EmbeddedWalletContextType {
    connect: () => Promise<void>;
    address: string | null;
    client: any;
    isUsingXO: boolean;
    currentNetwork: (typeof NETWORKS)[AvailableChains];

    loadWallet: (mnemonic: string, password: string) => Promise<void>;
    resetWallet: () => Promise<void>;
    factoryReset: () => void;
    provider: any; // Exposed for Facilitator usage
}

const EmbeddedWalletContext = createContext<EmbeddedWalletContextType | null>(null);

export const EmbeddedWalletProvider = ({
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

    const walletContext = useWallet();

    const canDecrypt =
        hydrated &&
        !!password &&
        !!mainWallet.encryptedPrivateKey &&
        !!mainWallet.salt &&
        !!mainWallet.iv;

    // Sub-hooks

    const { loadWallet, resetWallet, factoryReset } = useWalletStorage({
        password,
        isUsingXO,
        setAddress,
        setIsUsingXO
    });

    // ======================
    //  INIT (SINGLE RUN)
    // ======================
    useEffect(() => {
        if (!hydrated) return;
        if (isEmbedded === undefined) return;
        if (!password) return;
        if (initOnce.current) return;

        initOnce.current = true;
        connect();
    }, [hydrated, isEmbedded, password]);

    // [FIX] Sync with global WalletContext
    // If WalletContext connects to XO (e.g. via HeroBanner), we must update local state
    // so that 'address' exposed by this context is correct.
    useEffect(() => {
        if (walletContext.activeStrategyId === 'xo' && walletContext.address) {
            setAddress(walletContext.address);
            setIsUsingXO(true);
        }
    }, [walletContext.address, walletContext.activeStrategyId]);

    // ======================
    //  CONNECT XO WALLET
    // ======================
    // ======================
    //  CONNECT XO WALLET (VIA STRATEGY)
    // ======================
    const connect = async () => {
        try {
            if (!isEmbedded) throw new Error("No XO Embedded");

            await walletContext.connect('xo', {
                defaultChainId: "0x89" // Polygon default
            });

            // The Strategy updates the store, but we might need to sync local state if needed
            // But actually WalletContext also syncs store.

            // We still need to get the client explicitly if the strategy exposes it, 
            // or we can rely on the store update that the strategy might have done?
            // The XOWalletStrategy assigns xoClient to itself. We can retrieve it via getProvider() or custom method?
            // The XOWalletStrategy has a `getClient` method but it is not on the generic interface.
            // We can check if activeStrategy is XOWalletStrategy.

            const strategy = walletContext.strategies.find(s => s.id === 'xo') as any;
            if (strategy && strategy.getClient) {
                const client = strategy.getClient();
                // If the client wasn't ready immediately, we might need to wait or it returns a promise?
                // In the strategy implementation, getClient returns `this.xoClient`.
                if (client) setXOClient(client);
            }

            setIsUsingXO(true);
            setAddress(walletContext.address);

            toast.success(`Wallet XO conectada`);
        } catch (e) {
            console.error("XO Connect failed", e);
            setIsUsingXO(false);
            await generateLocalOrLoad(); // Fallback to local
        }
    };

    // ======================
    //  LOCAL WALLET (Init)
    // ======================
    const generateLocalOrLoad = async () => {
        if (!hydrated || !password) return;

        if (canDecrypt) {
            try {
                const pk = await decryptPrivateKey(
                    mainWallet.encryptedPrivateKey!,
                    password,
                    mainWallet.salt!,
                    mainWallet.iv!
                );

                const w = new Wallet(pk);
                setAddress(w.address);
                toast.success(`Wallet local cargada: ${w.address}`);
                return;
            } catch {
                toast.error("Wallet corrupta. Generando nueva...");
            }
        }

        // Create New Wallet
        const wallet = Wallet.createRandom();
        const keypair = Keypair.random();
        const secret = keypair.secret();

        try {
            await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
        } catch {
            toast.error("No se pudo crear la cuenta Stellar");
            return;
        }

        await createUSDCTrustline({
            stellarAddress: keypair.publicKey(),
            secret,
        });

        const salt = generateSalt();
        const { encrypted, iv } = await encryptPrivateKey(
            wallet.privateKey,
            password,
            salt
        );

        const { encrypted: encryptedStellar } = await encryptPrivateKey(
            secret,
            password,
            salt
        );

        setMainWallet({
            address: wallet.address,
            addressStellar: keypair.publicKey(),
            encryptedPrivateKey: encrypted,
            encryptedPrivateKeyStellar: encryptedStellar,
            salt,
            iv,
        });

        setAddress(wallet.address);
        toast.info(`Wallet local generada: ${wallet.address}`);
    };

    const currentNetwork = NETWORKS[selectedChain];

    return (
        <EmbeddedWalletContext.Provider
            value={{
                connect,
                address,
                client: useXOWalletStore.getState().xoClient,
                isUsingXO,
                currentNetwork,

                loadWallet,
                resetWallet,
                factoryReset,
                provider: xoProviderRef.current
            }}
        >
            {children}
        </EmbeddedWalletContext.Provider >
    );
};

export const useEmbeddedWalletContext = () => {
    const ctx = useContext(EmbeddedWalletContext);
    if (!ctx) throw new Error("useEmbeddedWalletContext must be used within EmbeddedWalletProvider");
    return ctx;
};
