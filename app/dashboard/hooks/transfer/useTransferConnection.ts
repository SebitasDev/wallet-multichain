import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { AccountAbstraction } from "@1llet.xyz/erc4337-gasless-sdk";
import { Address, createWalletClient, custom, parseUnits } from "viem";
import { useWalletClient, useConnect, useSwitchChain, useConnectors, useConnections, usePublicClient } from "wagmi";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { getSmartAccountForChain, ensureTokenApproval } from "../useSmartAccount";
import { useStellarLogic } from "./useStellarLogic";
import { useWallet } from "@/app/context/WalletContext";

export const useTransferConnection = (watchSourceChain: ChainKey) => {
    const { setSmartAccount: storeSetSmartAccount, connectionMode } = useXOWalletStore();
    const { getStellarKeys } = useStellarLogic();
    const { getSigner } = useWallet(); // Access signer from context

    // Store access
    const encryptedPrivateKey = useXOWalletStore(s => s.mainWallet.encryptedPrivateKey);
    const salt = useXOWalletStore(s => s.mainWallet.salt);
    const iv = useXOWalletStore(s => s.mainWallet.iv);
    const currentPassword = useWalletPasswordStore((s) => s.currentPassword);

    // Wagmi Hooks
    const publicClient = usePublicClient();
    const connectors = useConnectors();
    const connections = useConnections();
    const { mutateAsync: connectAsync } = useConnect();
    const isConnected = connections.length > 0;
    const { mutateAsync: switchChainAsync } = useSwitchChain();

    const currentChainConfig = NETWORKS[watchSourceChain];
    const { data: walletClient, refetch: refetchWalletClient } = useWalletClient({
        chainId: currentChainConfig?.evm?.chain?.id
    });

    // Local State
    const [smartAccount, setSmartAccount] = useState<AccountAbstraction | null>(null);
    const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
    const [isDeployed, setIsDeployed] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Helper to update state
    const updateState = (result: any) => {
        const config = NETWORKS[watchSourceChain];
        const { account, smartAccountAddress: saAddress, isDeployed: deployed } = result;
        setSmartAccount(account);
        setSmartAccountAddress(saAddress);
        setIsDeployed(deployed);
        const chainId = config?.evm?.chain.id.toString() || "0";
        if (config?.evm) storeSetSmartAccount(chainId, saAddress, deployed);
        return { account, address: saAddress };
    };

    const connectWallet = useCallback(async () => {
        setIsConnecting(true);
        try {
            // [NEW] Stellar Logic Branch
            if (watchSourceChain === "Stellar") {
                const { publicKey } = await getStellarKeys();

                setSmartAccount(null);
                setSmartAccountAddress(publicKey);
                setIsDeployed(true);

                return { account: null, address: publicKey };
            }

            // [EXISTING] EVM Logic
            const config = NETWORKS[watchSourceChain];
            if (!config || !config.evm) throw new Error("Invalid Chain Config or not EVM");

            // --- MODE 1: MetaMask ---
            if (connectionMode === 'metamask') {
                let activeClient = walletClient;

                // 1. Recover Client if missing
                if (!activeClient) {
                    try {
                        if (!isConnected) {
                            const injected = connectors.find(c => c.id === 'injected') || connectors[0];
                            if (injected) await connectAsync({ connector: injected });
                        }
                        const { data } = await refetchWalletClient();
                        activeClient = data;
                    } catch (e) { /* Silent fail */ }
                }

                // 2. Direct Fallback
                if (!activeClient && typeof window !== 'undefined' && window.ethereum) {
                    try {
                        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as any[];
                        if (accounts[0]) {
                            activeClient = createWalletClient({
                                account: accounts[0],
                                chain: config.evm.chain,
                                transport: custom(window.ethereum as any)
                            }) as any;
                        }
                    } catch (e) { console.error("Direct fallback failed", e); }
                }

                if (!activeClient) throw new Error("MetaMask connection lost. Please reconnect.");

                // 3. Enforce Network Switch
                const targetChainId = config.evm.chain.id;
                const currentChainId = await activeClient.getChainId();

                if (currentChainId !== targetChainId) {
                    try {
                        await switchChainAsync({ chainId: targetChainId });
                        const { data } = await refetchWalletClient();
                        if (data) activeClient = data;
                    } catch (e) {
                        // @ts-ignore
                        throw new Error(`Please switch to ${watchSourceChain} to proceed.`);
                    }
                }

                // 4. Init Smart Account
                const saResult = await getSmartAccountForChain(watchSourceChain, activeClient);
                if (saResult) return updateState(saResult);
                throw new Error("Failed to initialize Smart Account with MetaMask");
            }

            // --- MODE 2: Embedded ---
            if (connectionMode === 'embedded') {
                const signer = getSigner();
                if (!signer) throw new Error("Embedded wallet not connected");

                // Assuming signer is compatible with SDK (Provider or Signer)
                const saResult = await getSmartAccountForChain(watchSourceChain, signer);
                if (saResult) return updateState(saResult);
                throw new Error("Failed to initialize Smart Account with Embedded Wallet");
            }

            // --- MODE 3: Local ---
            if (connectionMode === 'local') {
                if (!encryptedPrivateKey || !currentPassword || !salt || !iv) {
                    throw new Error("Local Wallet locked or missing credentials");
                }
                const privateKey = await decryptPrivateKey(encryptedPrivateKey, currentPassword, salt, iv) as `0x${string}`;
                const saResult = await getSmartAccountForChain(watchSourceChain, privateKey);
                if (saResult) return updateState(saResult);
                throw new Error("Failed to initialize with Local Key");
            }

            // --- MODE 3: Auto/Fallback (Legacy) ---
            if (walletClient) {
                const saResult = await getSmartAccountForChain(watchSourceChain, walletClient);
                if (saResult) return updateState(saResult);
            } else if (isConnected) {
                const { data: refetched } = await refetchWalletClient();
                if (refetched) {
                    const saResult = await getSmartAccountForChain(watchSourceChain, refetched);
                    if (saResult) return updateState(saResult);
                }
            }

            // Fallback: Local
            if (!walletClient && encryptedPrivateKey && currentPassword && salt && iv) {
                const privateKey = await decryptPrivateKey(encryptedPrivateKey, currentPassword, salt, iv) as `0x${string}`;
                const saResult = await getSmartAccountForChain(watchSourceChain, privateKey);
                if (saResult) return updateState(saResult);
            }

            return null;

        } catch (e: any) {
            console.error("Connection Failed:", e);
            toast.error(e.message);
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, [watchSourceChain, encryptedPrivateKey, currentPassword, salt, iv, storeSetSmartAccount, connectionMode, walletClient, isConnected, connectAsync, refetchWalletClient, connectors, switchChainAsync, getStellarKeys]);

    const deploySmartAccount = useCallback(async () => {
        if (!smartAccount) {
            toast.error("Connect wallet first");
            return false;
        }

        if (isDeployed) return true;

        setIsDeploying(true);
        try {
            const receipt = await smartAccount.deployAccount();
            if (receipt.success) {
                setIsDeployed(true);
                const config = NETWORKS[watchSourceChain];
                if (config?.evm && smartAccountAddress) {
                    storeSetSmartAccount(config.evm.chain.id.toString(), smartAccountAddress, true);
                }
                toast.success("Smart Account deployed successfully!");
                return true;
            } else {
                throw new Error("Deployment failed");
            }
        } catch (e: any) {
            console.error("Deploy Failed:", e);
            toast.error("Deploy failed: " + e.message);
            return false;
        } finally {
            setIsDeploying(false);
        }
    }, [smartAccount, isDeployed, watchSourceChain, smartAccountAddress, storeSetSmartAccount]);

    const approveToken = useCallback(async (tokenAddress: Address, amount: bigint) => {
        if (!smartAccount) {
            toast.error("Connect wallet first");
            return false;
        }
        setIsApproving(true);
        try {
            const spender = smartAccountAddress as Address;
            return await ensureTokenApproval(smartAccount, tokenAddress, spender, amount, publicClient);
        } catch (e: any) {
            console.error("Approval helper failed:", e);
            toast.error("Approval failed: " + e.message);
            return false;
        } finally {
            setIsApproving(false);
        }
    }, [smartAccount, watchSourceChain, smartAccountAddress, publicClient]);

    return {
        smartAccount,
        smartAccountAddress,
        setSmartAccount,
        setSmartAccountAddress,
        isDeployed,
        setIsDeployed,
        isDeploying,
        isApproving,
        isConnecting,
        connectWallet,
        deploySmartAccount,
        approveToken,
        walletClient
    };
};
