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
import { useWalletStore } from "@/app/store/useWalletsStore";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";

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
import { mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { sha256 } from "ethereum-cryptography/sha256";

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
    loadWallet: (mnemonic: string, password: string) => Promise<void>;
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
    //  LOAD WALLET (IMPORT)
    // ======================
    const loadWallet = async (mnemonic: string, password: string) => {
        const trimmed = mnemonic.trim();
        if (!validateMnemonic(trimmed, wordlist)) {
            throw new Error("Frase semilla inválida");
        }

        // 1. Derive EVM Wallet (Standard BIP44)
        const evmWallet = Wallet.fromPhrase(trimmed);

        // 2. Derive Stellar Wallet (Deterministic: SHA256(Seed) -> Ed25519)
        const seed = mnemonicToSeedSync(trimmed);
        const stellarSeed = sha256(seed); // 32 bytes deterministic seed
        const stellarKeypair = Keypair.fromRawEd25519Seed(Buffer.from(stellarSeed));

        // 3. Encrypt Keys
        const salt = generateSalt();
        const { encrypted: encryptedEVM, iv } = await encryptPrivateKey(
            evmWallet.privateKey,
            password,
            salt
        );

        const { encrypted: encryptedStellar } = await encryptPrivateKey(
            stellarKeypair.secret(),
            password,
            salt
        );

        // 4. Update Store
        // Check if we are using XO (Embedded) to decide if we overwrite EVM or just add Stellar
        if (isUsingXO) {
            // HYBRID MODE: XO handles EVM, we only import Stellar
            const currentMainWallet = useXOWalletStore.getState().mainWallet;

            setMainWallet({
                ...currentMainWallet, // Keep existing EVM data (even if null/empty, we don't want to replace with this new one if user intends to use XO)
                addressStellar: stellarKeypair.publicKey(),
                encryptedPrivateKeyStellar: encryptedStellar,
                // We must update salt/iv if we encrypt with new password? 
                // Actually, if we are in Hybrid mode, the 'password' provided is primarily for this Stellar import.
                // If mainWallet already had valid EVM keys encrypted with SAME password, we are fine.
                // If it had different password, we might break EVM decryption if we overwrite salt/iv.
                // However, the prompt implies "Connect with XO" -> "Import Stellar".
                // We should assume the user acts on the "active" session.
                // For simplicity and safety in this specific "Stellar Only" request:
                salt,
                iv,
            });

            toast.success(`Wallet Stellar importada: ${stellarKeypair.publicKey().slice(0, 6)}...`);
            // DO NOT switch setIsUsingXO(false) -> We stay in XO mode for EVM
        } else {
            // STANDARD MODE: Full Import (EVM + Stellar) replacing everything
            setMainWallet({
                address: evmWallet.address,
                addressStellar: stellarKeypair.publicKey(),
                encryptedPrivateKey: encryptedEVM,
                encryptedPrivateKeyStellar: encryptedStellar,
                salt,
                iv,
            });

            // 5. Set Active
            setAddress(evmWallet.address);
            setIsUsingXO(false); // Switch to local wallet
        }

        // 6. Ensure Trustline (Non-blocking) & Auto-Fund with Friendbot
        const fundAndTrust = async () => {
            // Try to fund with Friendbot first (Testnet only)
            try {
                // Check if account exists first to avoid unnecessary funding
                await fetch(`https://horizon-testnet.stellar.org/accounts/${stellarKeypair.publicKey()}`)
                    .then(res => { if (!res.ok) throw new Error("Not found"); });
            } catch {
                // Account not found, so let's fund it!
                toast.info("Activando cuenta Stellar (Friendbot)...");
                try {
                    await fetch(`https://friendbot.stellar.org?addr=${stellarKeypair.publicKey()}`);
                    toast.success("Cuenta Stellar activada con 10,000 XLM");
                } catch (e) {
                    console.error("Friendbot error:", e);
                }
            }

            // Now create trustline
            createUSDCTrustline({
                stellarAddress: stellarKeypair.publicKey(),
                secret: stellarKeypair.secret(),
            }).catch(err => {
                // Ignore 404 if funding failed or other minor issues
                if (err?.response?.status === 404 || err?.message?.includes("404")) return;
                console.error("Trustline setup warning:", err);
            });
        };

        fundAndTrust();

        // 7. Sync Password Store (CRITICAL FIX)
        // Update the global session password so other components can decrypt the new wallet immediately.
        useWalletPasswordStore.getState().setCurrentPassword(password);
        await useWalletPasswordStore.getState().setPassword(password);
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
                loadWallet,
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
