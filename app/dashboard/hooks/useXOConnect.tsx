"use client";

import React, { ReactNode, createContext, useContext, useState, useEffect, useRef } from "react";
import { useEmbedded } from "@/app/dashboard/hooks/embebed";
import { toast } from "react-toastify";
import { Wallet } from "ethers";
import { useMainWalletStore } from "@/app/store/useMainWalletStore";
import { decryptPrivateKey, encryptPrivateKey, generateSalt } from "@/app/utils/cripto";
import { createPaymentHeader } from "x402/client";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, custom } from "viem";
import { base, baseSepolia } from "viem/chains";

// Configuración de red y USDC
const NETWORK_CONFIG = {
    xo: {
        network: "base" as const,
        chain: base,
        chainId: "0x2105", // 8453 en hex
        rpcUrl: "https://mainnet.base.org",
        usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        usdcName: "USD Coin",
        usdcVersion: "2"
    },
    local: {
        network: "base-sepolia" as const,
        chain: baseSepolia,
        chainId: "0x14a34", // 84532 en hex
        rpcUrl: "https://sepolia.base.org",
        usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        usdcName: "USDC",
        usdcVersion: "2"
    }
};

interface XOContractsContextType {
    connect: () => Promise<void>;
    address: string | null;
    client: any;
    isUsingXO: boolean;
    currentNetwork: typeof NETWORK_CONFIG.xo | typeof NETWORK_CONFIG.local;
    payX402: (amount: string, recipientAddress: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
}

const XOContractsContext = createContext<XOContractsContextType | null>(null);

export const XOContractsProvider = ({ children, password }: { children: ReactNode, password: string }) => {
    const [address, setAddress] = useState<string | null>(null);
    const [isUsingXO, setIsUsingXO] = useState<boolean>(false);
    const xoProviderRef = useRef<any>(null);
    const { isEmbedded } = useEmbedded();
    const mainWallet = useMainWalletStore((s) => s.mainWallet);
    const hydrated = useMainWalletStore((s) => s.hydrated);
    const setMainWallet = useMainWalletStore((s) => s.setMainWallet);
    const setXOWallet = useMainWalletStore((s) => s.setXOWallet);
    const setXOClient = useMainWalletStore((s) => s.setXOClient);

    const chainId = "0x89";
    const rpcUrl = "https://polygon-rpc.com";

    const generateLocalWallet = async () => {
        const wallet = Wallet.createRandom();
        const salt = generateSalt();
        const { encrypted, iv } = await encryptPrivateKey(wallet.privateKey, password, salt);

        setMainWallet({
            address: wallet.address,
            encryptedPrivateKey: encrypted,
            salt,
            iv,
        });

        setXOWallet({ address: null });
        setXOClient(null);

        setAddress(wallet.address);
        toast.info(`Wallet Local Generada: ${wallet.address}`);
    };

    const connect = async () => {
        try {
            toast.info("Conectando a XO...");
            const { XOConnectProvider } = await import("xo-connect");
            const { BrowserProvider } = await import("ethers");
            const { XOConnect } = await import("xo-connect");

            if (!isEmbedded) throw new Error("No XO Embedded");

            // Usar Base mainnet para XOConnect
            const networkConfig = NETWORK_CONFIG.xo;

            const provider = new XOConnectProvider({
                rpcs: { [networkConfig.chainId]: networkConfig.rpcUrl },
                defaultChainId: networkConfig.chainId
            });

            await provider.request({ method: "eth_requestAccounts" });

            // Guardar el provider para usarlo después
            xoProviderRef.current = provider;

            const ethersProvider = new BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const addr = await signer.getAddress();

            setAddress(addr);
            setXOWallet({ address: addr });
            setIsUsingXO(true);
            toast.success(`Wallet XO Conectada (Base Mainnet): ${addr}`);

            const client = await XOConnect.getClient();
            setXOClient(client);
        } catch (err) {
            console.log("ERROR CONNECT XO:", err);
            toast.warning("No se pudo conectar a XO. Verificando wallet local...");
            setIsUsingXO(false);
            await useLocalOrGenerate();
        }
    };

    const useLocalOrGenerate = async () => {
        if (mainWallet.address && mainWallet.encryptedPrivateKey) {
            try {
                const pk = await decryptPrivateKey(
                    mainWallet.encryptedPrivateKey,
                    "1",
                    mainWallet.salt!,
                    mainWallet.iv!
                );
                const w = new Wallet(pk);
                setAddress(w.address);
                toast.success(`Wallet local cargada: ${w.address}`);
            } catch (err) {
                console.log("Wallet local corrupta:", err);
                toast.error("Wallet local corrupta. Generando nueva...");
                await generateLocalWallet();
            }
        } else {
            await generateLocalWallet();
        }
    };

    const payX402 = async (amount: string, recipientAddress: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
        try {
            // Seleccionar configuración de red según el tipo de wallet
            const networkConfig = isUsingXO ? NETWORK_CONFIG.xo : NETWORK_CONFIG.local;

            // Convertir amount a unidades atómicas de USDC (6 decimales)
            const amountInAtomicUnits = (parseFloat(amount) * 1_000_000).toString();

            let paymentHeader: string;

            if (isUsingXO && xoProviderRef.current) {
                // === CASO XO CONNECT ===
                console.log("Firmando con XOConnect en Base Mainnet...");

                // Crear wallet client de viem usando el provider de XO
                const walletClient = createWalletClient({
                    chain: networkConfig.chain,
                    transport: custom(xoProviderRef.current),
                    account: address as `0x${string}`
                });

                // Crear el payment header con x402 usando el wallet client de XO
                paymentHeader = await createPaymentHeader(
                    walletClient,
                    1, // x402 version
                    {
                        scheme: "exact",
                        network: networkConfig.network,
                        maxAmountRequired: amountInAtomicUnits,
                        resource: "https://x402-payment.local",
                        description: "x402 Payment",
                        mimeType: "application/json",
                        payTo: recipientAddress as `0x${string}`,
                        maxTimeoutSeconds: 300,
                        asset: networkConfig.usdc,
                        extra: {
                            name: networkConfig.usdcName,
                            version: networkConfig.usdcVersion
                        }
                    }
                );
            } else {
                // === CASO WALLET LOCAL ===
                console.log("Firmando con wallet local en Base Sepolia...");

                if (!mainWallet.encryptedPrivateKey || !mainWallet.salt || !mainWallet.iv) {
                    throw new Error("No hay wallet disponible");
                }

                // Desencriptar la private key
                const privateKey = await decryptPrivateKey(
                    mainWallet.encryptedPrivateKey,
                    password,
                    mainWallet.salt,
                    mainWallet.iv
                );

                // Crear account de viem con la private key
                const account = privateKeyToAccount(privateKey as `0x${string}`);
                console.log("Wallet local address:", account.address);

                // Crear el payment header con x402 usando el account local
                paymentHeader = await createPaymentHeader(
                    account,
                    1, // x402 version
                    {
                        scheme: "exact",
                        network: networkConfig.network,
                        maxAmountRequired: amountInAtomicUnits,
                        resource: "https://x402-payment.local",
                        description: "x402 Payment",
                        mimeType: "application/json",
                        payTo: recipientAddress as `0x${string}`,
                        maxTimeoutSeconds: 300,
                        asset: networkConfig.usdc,
                        extra: {
                            name: networkConfig.usdcName,
                            version: networkConfig.usdcVersion
                        }
                    }
                );
            }

            // Enviar al servidor para facilitar el pago
            const response = await fetch("/api/x402-pay", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    paymentHeader,
                    recipientAddress,
                    amount: amountInAtomicUnits,
                    network: networkConfig.network, // Enviar la red al servidor
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al procesar el pago");
            }

            return {
                success: true,
                txHash: result.transaction,
            };
        } catch (error) {
            console.error("Error en payX402:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Error desconocido",
            };
        }
    };

    useEffect(() => {
        if (!hydrated) return;

        if (isEmbedded === undefined || isEmbedded === null) return;

        connect();
    }, [hydrated, isEmbedded]);

    // Obtener la configuración de red actual
    const currentNetwork = isUsingXO ? NETWORK_CONFIG.xo : NETWORK_CONFIG.local;

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
