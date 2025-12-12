"use client";

import React, { ReactNode, createContext, useContext, useState, useEffect, useRef } from "react";
import { useEmbedded } from "@/app/dashboard/hooks/embebed";
import { toast } from "react-toastify";
import { Wallet } from "ethers";
import { useMainWalletStore } from "@/app/store/useMainWalletStore";
import { decryptPrivateKey, encryptPrivateKey, generateSalt } from "@/app/utils/cripto";
import { createPaymentHeader } from "x402/client";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, custom, publicActions } from "viem";
import { arbitrum, base, polygon } from "viem/chains";
import {Address} from "abitype";


// =====================
//  TRUE NETWORK CONFIG
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
    }
};


// TYPE CORRECTO
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
    const [selectedChain, setSelectedChain] = useState<AvailableChains>("polygon");
    const [isUsingXO, setIsUsingXO] = useState<boolean>(false);
    const xoProviderRef = useRef<any>(null);

    const { isEmbedded } = useEmbedded();
    const mainWallet = useMainWalletStore((s) => s.mainWallet);
    const hydrated = useMainWalletStore((s) => s.hydrated);
    const setMainWallet = useMainWalletStore((s) => s.setMainWallet);
    const setXOWallet = useMainWalletStore((s) => s.setXOWallet);
    const setXOClient = useMainWalletStore((s) => s.setXOClient);


    // ======================
    //  CONNECT XO WALLET
    // ======================
    const connect = async () => {
        try {
            toast.info("Conectando a XO...");

            const { XOConnectProvider } = await import("xo-connect");
            const { BrowserProvider } = await import("ethers");
            const { XOConnect } = await import("xo-connect");

            if (!isEmbedded) throw new Error("No XO Embedded");

            // Siempre XO usa BASE MAINNET
            const provider = new XOConnectProvider({
                rpcs: { ["0x2105"]: "https://mainnet.base.org" },
                defaultChainId: "0x2105"
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

        } catch (err) {
            toast.warning("No se pudo conectar a XO. Usando Wallet Local...");
            setIsUsingXO(false);
            await generateLocalOrLoad();
        }
    };


    // ======================
    //   LOCAL WALLET
    // ======================
    const generateLocalOrLoad = async () => {
        if (mainWallet.address && mainWallet.encryptedPrivateKey) {
            try {
                const pk = await decryptPrivateKey(
                    mainWallet.encryptedPrivateKey,
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

        const wallet = Wallet.createRandom();
        const salt = generateSalt();
        const { encrypted, iv } = await encryptPrivateKey(wallet.privateKey, password, salt);

        setMainWallet({
            address: wallet.address,
            encryptedPrivateKey: encrypted,
            salt,
            iv,
        });

        setAddress(wallet.address);
        toast.info(`Wallet local generada: ${wallet.address}`);
    };


    // ======================
    //        PAY X402
    // ======================
    const payX402 = async (
        amount: string,
        recipientAddress: string,
        targetChain: AvailableChains
    ) => {
        try {
            const networkConfig = NETWORKS[targetChain.toLowerCase() as keyof typeof NETWORKS];
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



    useEffect(() => {
        if (!hydrated) return;
        if (isEmbedded === undefined) return;

        connect();
    }, [hydrated, isEmbedded]);


    // 🎯 Aquí ya no rompe porque selectedChain ahora existe
    const currentNetwork = NETWORKS[selectedChain];

    return (
        <XOContractsContext.Provider
            value={{
                connect,
                address,
                client: useMainWalletStore.getState().xoClient,
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
