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
import { createPaymentHeader } from "x402/client";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, custom, publicActions } from "viem";
import { base, polygon } from "viem/chains";
import { Address } from "abitype";
import { Keypair } from "stellar-sdk";
import { createUSDCTrustline } from "@/app/lib/stellar/createUSDCTrustline";

// =====================
//  NETWORK CONFIG
// =====================

const NETWORKS = {
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

type AvailableChains = keyof typeof NETWORKS;

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
    const [selectedChain] = useState<AvailableChains>("polygon");
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

    // ======================
    //  CONNECT XO WALLET
    // ======================
    const connect = async () => {
        try {
            const { XOConnectProvider, XOConnect } = await import("xo-connect");
            const { BrowserProvider } = await import("ethers");

            if (!isEmbedded) throw new Error("No XO Embedded");

            const provider = new XOConnectProvider({
                rpcs: { ["0x2105"]: "https://mainnet.base.org" },
                defaultChainId: "0x2105",
            });

            await provider.request({ method: "eth_requestAccounts" });
            xoProviderRef.current = provider;

            const ethersProvider = new BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const addr = await signer.getAddress();

            setAddress(addr);
            setXOWallet({ address: addr });
            setIsUsingXO(true);

            const client = await XOConnect.getClient();
            setXOClient(client);

            toast.success(`Wallet XO conectada: ${addr}`);
        } catch {
            setIsUsingXO(false);
            await generateLocalOrLoad();
        }
    };

    // ======================
    //  LOCAL WALLET
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

        // === CREATE NEW WALLET ===
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

    // ======================
    //  PAY X402
    // ======================
    const payX402 = async (
        amount: string,
        recipientAddress: string,
        targetChain: AvailableChains
    ) => {
        try {
            const networkConfig = NETWORKS[targetChain];
            const amountAtomic = (parseFloat(amount) * 1_000_000).toString();

            let paymentHeader: string;

            if (isUsingXO && xoProviderRef.current) {
                const walletClient = createWalletClient({
                    chain: networkConfig.chain,
                    transport: custom(xoProviderRef.current),
                    account: address as `0x${string}`,
                }).extend(publicActions);

                paymentHeader = await createPaymentHeader(walletClient as any, 1, {
                    scheme: "exact",
                    network: networkConfig.network,
                    maxAmountRequired: amountAtomic,
                    resource: "https://facilitator.ultravioletadao.xyz",
                    description: "x402 Payment",
                    mimeType: "application/json",
                    payTo: recipientAddress as `0x${string}`,
                    maxTimeoutSeconds: 300,
                    asset: networkConfig.usdc,
                    extra: {
                        name: networkConfig.usdcName,
                        version: networkConfig.usdcVersion,
                    },
                });
            } else {
                const pk = await decryptPrivateKey(
                    mainWallet.encryptedPrivateKey!,
                    password,
                    mainWallet.salt!,
                    mainWallet.iv!
                );

                const account = privateKeyToAccount(pk as Address);

                paymentHeader = await createPaymentHeader(account, 1, {
                    scheme: "exact",
                    network: networkConfig.network,
                    maxAmountRequired: amountAtomic,
                    resource: "https://facilitator.ultravioletadao.xyz",
                    description: "x402 Payment",
                    mimeType: "application/json",
                    payTo: recipientAddress as `0x${string}`,
                    maxTimeoutSeconds: 300,
                    asset: networkConfig.usdc,
                    extra: {
                        name: networkConfig.usdcName,
                        version: networkConfig.usdcVersion,
                    },
                });
            }

            const res = await fetch("/api/x402-pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentHeader,
                    recipientAddress,
                    amount: amountAtomic,
                    network: networkConfig.network,
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error);

            return { success: true, txHash: result.transaction };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

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
            }}
        >
            {children}
        </XOContractsContext.Provider>
    );
};

export const useXOContracts = () => {
    const ctx = useContext(XOContractsContext);
    if (!ctx) throw new Error("useXOContracts must be used within XOContractsProvider");
    return ctx;
};
