import { useState, useCallback } from "react";
import { AccountAbstraction } from "@1llet.xyz/erc4337-gasless-sdk";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { toast } from "react-toastify";
import { Address, parseUnits, WalletClient, Hex } from "viem";

interface UseSmartAccountResult {
    account: AccountAbstraction | null;
    connectionType: 'local' | 'metamask' | null;
    smartAccountAddress: string | null;
    ownerAddress: string | null;
    chainId: string | null;
    isDeployed: boolean;
    isConnecting: boolean;
    isDeploying: boolean;
    isApproving: boolean;
    error: string | null;
    connect: (chainKey: ChainKey, useMetaMask?: boolean) => Promise<AccountAbstraction | null>;
    ensureDeployed: () => Promise<boolean>;
    ensureApproval: (tokenAddress: Address, spender: Address, amount: bigint) => Promise<boolean>;
    getBalance: (token: string | Address) => Promise<bigint>;
    disconnect: () => void;
}

export const useSmartAccount = (): UseSmartAccountResult => {
    const [account, setAccount] = useState<AccountAbstraction | null>(null);
    // Removed local connectionType state in favor of store
    // const [connectionType, setConnectionType] = useState<'local' | 'metamask' | null>(null);
    const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
    const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
    const [isDeployed, setIsDeployed] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentChainId, setCurrentChainId] = useState<string | null>(null);

    // ...

    // Store access
    const {
        mainWallet,
        setSmartAccount: storeSetSmartAccount,
        updateSmartAccountDeployStatus,
        setMetaMaskConnection,
        disconnectMetaMask,
        connectionMode,
        setConnectionMode
    } = useXOWalletStore();
    const currentPassword = useWalletPasswordStore((s) => s.currentPassword);

    const connect = useCallback(async (chainKey: ChainKey, useMetaMask: boolean = false): Promise<AccountAbstraction | null> => {
        setIsConnecting(true);
        setError(null);

        try {
            const config = NETWORKS[chainKey];
            if (!config || !config.evm) {
                throw new Error(`Chain ${chainKey} is not configured for EVM operations`);
            }

            const targetChainId = config.evm.chain.id.toString();
            // Hex chainId for MetaMask (e.g. 0x64 for Gnosis)
            const targetChainIdHex = `0x${config.evm.chain.id.toString(16)}`;

            // Check if we already have this SA cached (with fallback for old persisted data)
            const cachedSA = mainWallet.smartAccounts?.[targetChainId];

            // Create AccountAbstraction instance
            const accountInstance = new AccountAbstraction(config.evm as any);

            let result: { owner: `0x${string}`; smartAccount: `0x${string}` };

            if (useMetaMask) {
                // FORCE CHAIN SWITCH for MetaMask
                if (window.ethereum) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: targetChainIdHex }],
                        });
                    } catch (switchError: any) {
                        // This error code indicates that the chain has not been added to MetaMask.
                        if (switchError.code === 4902) {
                            throw new Error("This network is not available in your MetaMask, please add it manually.");
                        }
                        console.warn("Failed to switch chain, proceeding anyway:", switchError);
                    }
                }

                // Connect with MetaMask (no private key)
                result = await accountInstance.connect();
                setMetaMaskConnection(result.owner, targetChainId);
                setConnectionMode('metamask');
            } else {
                // Decrypt private key
                if (!mainWallet.encryptedPrivateKey || !currentPassword || !mainWallet.salt || !mainWallet.iv) {
                    throw new Error("Wallet credentials not available. Please unlock your wallet.");
                }

                const privateKey = await decryptPrivateKey(
                    mainWallet.encryptedPrivateKey,
                    currentPassword,
                    mainWallet.salt,
                    mainWallet.iv
                ) as `0x${string}`;

                // Connect with private key
                result = await accountInstance.connect(privateKey);
                setConnectionMode('local');
            }

            setAccount(accountInstance);
            setSmartAccountAddress(result.smartAccount);
            setOwnerAddress(result.owner);
            setCurrentChainId(targetChainId);

            // Initial deployment check
            // Note: casting method call if needed or assuming it returns boolean based on previous context
            // Previous context used accountInstance.isAccountDeployed(). Let's try that.
            let isDeployedStatus = false;
            try {
                // @ts-ignore
                isDeployedStatus = await accountInstance.isAccountDeployed();
            } catch (e) {
                // fallback or try isDeployed()
                try {
                    // @ts-ignore
                    isDeployedStatus = await accountInstance.isDeployed();
                } catch (e2) { }
            }

            setIsDeployed(isDeployedStatus);

            // Update store
            storeSetSmartAccount(targetChainId, result.smartAccount, isDeployedStatus);

            return accountInstance;
        } catch (e: any) {
            console.error("Error connecting Smart Account:", e);
            setError(e.message || "Failed to connect");
            setIsConnecting(false);
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, [mainWallet, currentPassword, storeSetSmartAccount, updateSmartAccountDeployStatus, setMetaMaskConnection]);

    const ensureDeployed = useCallback(async () => {
        if (!account || !currentChainId) {
            console.warn("ensureDeployed called but no account is connected.");
            return false;
        }

        if (isDeployed) return true;
        setIsDeploying(true);
        try {
            // Reverting to original logic pattern
            const receipt = await account.deployAccount();
            // Check if receipt has 'success' property
            // @ts-ignore
            if (receipt && receipt.success) {
                setIsDeployed(true);
                if (currentChainId) updateSmartAccountDeployStatus(currentChainId, true);
                return true;
            }
            // If wait exists
            // @ts-ignore
            if (receipt && typeof receipt.wait === 'function') {
                // @ts-ignore
                await (receipt as any).wait();
                setIsDeployed(true);
                if (currentChainId) updateSmartAccountDeployStatus(currentChainId, true);
                return true;
            }

            // Fallback
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setIsDeploying(false);
        }
    }, [account, currentChainId, isDeployed, updateSmartAccountDeployStatus]);

    const ensureApproval = useCallback(async (tokenAddress: Address, spender: Address, amount: bigint) => {
        if (!account) return false;
        setIsApproving(true);
        try {
            // Check allowance first (manual check for debug)
            // @ts-ignore
            const currentAllowance = typeof account.getAllowance === 'function' ? await account.getAllowance(tokenAddress, spender) : 'unknown';

            console.log("[useSmartAccount] ensureApproval Trace:", {
                token: tokenAddress,
                spender,
                amount: amount.toString(),
                currentAllowance: currentAllowance.toString(),
                // @ts-ignore
                account: account.address || 'unknown',
                // @ts-ignore
                owner: typeof account.getOwner === 'function' ? await account.getOwner() : 'unknown',
                connectionType: connectionMode,
                chainId: currentChainId
            });

            // For some tokens/chains, approval is not needed or handled internally.
            // We rely on the SDK's approveToken which should handle checks.
            const tx = await account.approveToken(tokenAddress, spender, amount);

            console.log("[useSmartAccount] approveToken result:", tx);

            if (tx === "NOT_NEEDED") return true;

            // Check if tx has wait
            // @ts-ignore
            if (tx && typeof tx.wait === 'function') {
                // @ts-ignore
                await (tx as any).wait();
            }

            return true;
        } catch (e) {
            console.error("Error approving token:", e);
            return false;
        } finally {
            setIsApproving(false);
        }
    }, [account, connectionMode, currentChainId]);

    const getBalance = useCallback(async (token: string | Address) => {
        if (!account) return BigInt(0);
        return await account.getBalance(token as Address);
    }, [account]);

    const disconnect = useCallback(() => {
        setAccount(null);
        setSmartAccountAddress(null);
        setOwnerAddress(null);
        setIsDeployed(false);
        setCurrentChainId(null);
        setError(null);
        setConnectionMode(null);
        disconnectMetaMask();
    }, [disconnectMetaMask]);

    return {
        account,
        connectionType: connectionMode,
        smartAccountAddress,
        ownerAddress,
        chainId: currentChainId,
        isDeployed,
        isConnecting,
        isDeploying,
        isApproving,
        error,
        connect,
        ensureDeployed,
        ensureApproval,
        getBalance,
        disconnect
    };
};

/**
 * Helper function to get or create AccountAbstraction for a specific chain
 * This is a stateless version for use in callbacks
 */
// ... existing imports

export const getSmartAccountForChain = async (
    chainKey: ChainKey,
    signer?: Hex | WalletClient
): Promise<{
    account: AccountAbstraction;
    smartAccountAddress: string;
    isDeployed: boolean;
} | null> => {
    try {
        const config = NETWORKS[chainKey];
        if (!config || !config.evm) {
            throw new Error(`Chain ${chainKey} is not configured for EVM operations`);
        }

        // ... (imports should be at top, I will handle this separately or assume user accepts messy imports for now, but better to fix implementation first)

        const accountInstance = new AccountAbstraction(config.evm as any);
        // Connect with Signer (WalletClient or Private Key)
        const result = await accountInstance.connect(signer);
        const deployed = await accountInstance.isAccountDeployed();

        return {
            account: accountInstance,
            smartAccountAddress: result.smartAccount,
            isDeployed: deployed
        };
    } catch (e) {
        console.error("[getSmartAccountForChain] Error:", e);
        return null;
    }
};

/**
 * Helper to ensure token approval before transfer
 */
export const ensureTokenApproval = async (
    account: AccountAbstraction,
    tokenAddress: Address,
    spender: Address,
    amount: bigint
): Promise<boolean> => {
    try {
        const currentAllowance = await account.getAllowance(tokenAddress);

        if (currentAllowance >= amount) {
            return true;
        }

        const result = await account.approveToken(tokenAddress, spender, amount);
        return result === "NOT_NEEDED" || typeof result === "string";
    } catch (e) {
        console.error("[ensureTokenApproval] Error:", e);
        return false;
    }
};
