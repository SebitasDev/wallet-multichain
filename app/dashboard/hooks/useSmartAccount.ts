import { useState, useCallback } from "react";
import { AccountAbstraction } from "@1llet.xyz/erc4337-gasless-sdk";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { toast } from "react-toastify";
import { Address, parseUnits } from "viem";

interface UseSmartAccountResult {
    account: AccountAbstraction | null;
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
    const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
    const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
    const [isDeployed, setIsDeployed] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentChainId, setCurrentChainId] = useState<string | null>(null);

    // ... (rest of hook body) ...
    // Note: ensure ensureDeployed, ensureApproval, getBalance are preserved as in previous steps

    // ... 

    // We only need to update the return statement in this replacement if we target the whole file or the return block.
    // I will use a targeted replacement for the interface and the return.

    // Using a broader range to ensure context.

    // Store access
    const {
        mainWallet,
        setSmartAccount: storeSetSmartAccount,
        updateSmartAccountDeployStatus,
        setMetaMaskConnection,
        disconnectMetaMask
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

            const chainId = config.evm.chain.id.toString();

            // Check if we already have this SA cached (with fallback for old persisted data)
            const cachedSA = mainWallet.smartAccounts?.[chainId];

            // Create AccountAbstraction instance
            const accountInstance = new AccountAbstraction(config.evm as any);

            let result: { owner: `0x${string}`; smartAccount: `0x${string}` };

            if (useMetaMask) {
                // Connect with MetaMask (no private key)
                result = await accountInstance.connect();
                setMetaMaskConnection(result.owner, chainId);
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
            }

            setAccount(accountInstance);
            setSmartAccountAddress(result.smartAccount);
            setOwnerAddress(result.owner);
            setCurrentChainId(chainId);

            // Check deployment status
            const deployed = await accountInstance.isAccountDeployed();
            setIsDeployed(deployed);

            // Update store
            storeSetSmartAccount(chainId, result.smartAccount, deployed);

            console.log(`[useSmartAccount] Connected to ${chainKey}. SA: ${result.smartAccount}, Owner: ${result.owner}, Deployed: ${deployed}, MetaMask: ${useMetaMask}`);

            return accountInstance;
        } catch (e: any) {
            const errorMsg = e.message || "Failed to connect Smart Account";
            setError(errorMsg);
            console.error("[useSmartAccount] Connection error:", e);
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, [mainWallet, currentPassword, storeSetSmartAccount]);

    const ensureDeployed = useCallback(async (): Promise<boolean> => {
        if (!account) {
            setError("Account not connected");
            return false;
        }

        if (isDeployed) {
            return true;
        }

        setIsDeploying(true);
        setError(null);

        try {
            console.log("[useSmartAccount] Deploying Smart Account...");
            const receipt = await account.deployAccount();

            if (receipt.success) {
                setIsDeployed(true);
                if (currentChainId) {
                    updateSmartAccountDeployStatus(currentChainId, true);
                }
                console.log("[useSmartAccount] Deploy successful:", receipt.receipt.transactionHash);
                toast.success("Smart Account deployed successfully!");
                return true;
            } else {
                throw new Error("Deployment failed");
            }
        } catch (e: any) {
            const errorMsg = e.message || "Failed to deploy Smart Account";
            setError(errorMsg);
            console.error("[useSmartAccount] Deploy error:", e);
            toast.error(`Deploy failed: ${errorMsg}`);
            return false;
        } finally {
            setIsDeploying(false);
        }
    }, [account, isDeployed, currentChainId, updateSmartAccountDeployStatus]);

    const ensureApproval = useCallback(async (
        tokenAddress: Address,
        spender: Address,
        amount: bigint
    ): Promise<boolean> => {
        if (!account) {
            setError("Account not connected");
            return false;
        }

        setIsApproving(true);
        setError(null);

        try {
            // Check current allowance
            const currentAllowance = await account.getAllowance(tokenAddress);

            if (currentAllowance >= amount) {
                console.log("[useSmartAccount] Sufficient allowance exists:", currentAllowance.toString());
                return true;
            }

            console.log("[useSmartAccount] Approving token...", {
                token: tokenAddress,
                spender,
                amount: amount.toString(),
                currentAllowance: currentAllowance.toString()
            });

            // Approve token
            const result = await account.approveToken(tokenAddress, spender, amount);

            if (result === "NOT_NEEDED") {
                console.log("[useSmartAccount] Approval not needed");
                return true;
            }

            console.log("[useSmartAccount] Approval successful:", result);
            toast.success("Token approved successfully!");
            return true;
        } catch (e: any) {
            const errorMsg = e.message || "Failed to approve token";
            setError(errorMsg);
            console.error("[useSmartAccount] Approval error:", e);
            toast.error(`Approval failed: ${errorMsg}`);
            return false;
        } finally {
            setIsApproving(false);
        }
    }, [account]);

    const getBalance = useCallback(async (token: string | Address): Promise<bigint> => {
        if (!account) {
            return BigInt(0);
        }

        try {
            return await account.getBalance(token);
        } catch (e) {
            console.error("[useSmartAccount] Balance fetch error:", e);
            return BigInt(0);
        }
    }, [account]);

    const disconnect = useCallback(() => {
        setAccount(null);
        setSmartAccountAddress(null);
        setOwnerAddress(null);
        setIsDeployed(false);
        setCurrentChainId(null);
        setError(null);
        disconnectMetaMask();
    }, [disconnectMetaMask]);

    return {
        account,
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
export const getSmartAccountForChain = async (
    chainKey: ChainKey,
    privateKey: `0x${string}`
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

        const accountInstance = new AccountAbstraction(config.evm as any);
        const result = await accountInstance.connect(privateKey);
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
