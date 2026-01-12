import { useState, useCallback } from "react";
import { AccountAbstraction, erc20Abi } from "@1llet.xyz/erc4337-gasless-sdk";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { Address, WalletClient, Hex, maxUint256, PublicClient } from "viem";

/**
 * Interface for the hook return value
 */
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

/**
 * Primary Guard: useSmartAccount Hook
 */
export const useSmartAccount = (): UseSmartAccountResult => {
    // Local State
    const [account, setAccount] = useState<AccountAbstraction | null>(null);
    const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
    const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
    const [isDeployed, setIsDeployed] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentChainId, setCurrentChainId] = useState<string | null>(null);

    // Store Access
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

    /**
     * Connect to Smart Account via Local Key or MetaMask
     */
    const connect = useCallback(async (chainKey: ChainKey, useMetaMask: boolean = false): Promise<AccountAbstraction | null> => {
        setIsConnecting(true);
        setError(null);

        try {
            const config = NETWORKS[chainKey];
            if (!config || !config.evm) {
                throw new Error(`Chain ${chainKey} is not configured for EVM operations`);
            }

            const targetChainId = config.evm.chain.id.toString();
            // Hex chainId for MetaMask (e.g. 0x64)
            const targetChainIdHex = `0x${config.evm.chain.id.toString(16)}`;

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
                        // Error 4902: Chain not added
                        if (switchError.code === 4902) {
                            throw new Error("This network is not available in your MetaMask, please add it manually.");
                        }
                        console.warn("Failed to switch chain, proceeding anyway:", switchError);
                    }
                }

                // Connect with MetaMask (Signer)
                result = await accountInstance.connect();
                setMetaMaskConnection(result.owner, targetChainId);
                setConnectionMode('metamask');
            } else {
                // Connect with Local Private Key
                if (!mainWallet.encryptedPrivateKey || !currentPassword || !mainWallet.salt || !mainWallet.iv) {
                    throw new Error("Wallet credentials not available. Please unlock your wallet.");
                }

                const privateKey = await decryptPrivateKey(
                    mainWallet.encryptedPrivateKey,
                    currentPassword,
                    mainWallet.salt,
                    mainWallet.iv
                ) as `0x${string}`;

                result = await accountInstance.connect(privateKey);
                setConnectionMode('local');
            }

            // Sync State
            setAccount(accountInstance);
            setSmartAccountAddress(result.smartAccount);
            setOwnerAddress(result.owner);
            setCurrentChainId(targetChainId);

            // Check Deployment Status
            const isDeployedStatus = await safeCheckDeployment(accountInstance);
            setIsDeployed(isDeployedStatus);

            // Sync Store
            storeSetSmartAccount(targetChainId, result.smartAccount, isDeployedStatus);

            return accountInstance;

        } catch (e: any) {
            console.error("Error connecting Smart Account:", e);
            setError(e.message || "Failed to connect");
            setAccount(null);
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, [mainWallet, currentPassword, storeSetSmartAccount, updateSmartAccountDeployStatus, setMetaMaskConnection, setConnectionMode]);

    /**
     * Ensure Smart Account is deployed
     */
    const ensureDeployed = useCallback(async () => {
        if (!account || !currentChainId) {
            console.warn("ensureDeployed called but no account is connected.");
            return false;
        }

        if (isDeployed) return true;

        setIsDeploying(true);
        try {
            const receipt = await account.deployAccount();
            const success = receipt && (receipt.success || ((receipt as any).transactionHash && !(receipt as any).error));

            if (success) {
                setIsDeployed(true);
                updateSmartAccountDeployStatus(currentChainId, true);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Deploy error:", e);
            return false;
        } finally {
            setIsDeploying(false);
        }
    }, [account, currentChainId, isDeployed, updateSmartAccountDeployStatus]);

    /**
     * Ensure Token Approval (Wrapper around static helper)
     */
    const ensureApproval = useCallback(async (tokenAddress: Address, spender: Address, amount: bigint) => {
        if (!account) return false;
        setIsApproving(true);
        try {
            return await ensureTokenApproval(account, tokenAddress, spender, amount);
        } catch (e) {
            console.error("Error approving token:", e);
            return false;
        } finally {
            setIsApproving(false);
        }
    }, [account]);

    /**
     * Get Token Balance
     */
    const getBalance = useCallback(async (token: string | Address) => {
        if (!account) return BigInt(0);
        return await account.getBalance(token as Address);
    }, [account]);

    /**
     * Disconnect and Reset State
     */
    const disconnect = useCallback(() => {
        setAccount(null);
        setSmartAccountAddress(null);
        setOwnerAddress(null);
        setIsDeployed(false);
        setCurrentChainId(null);
        setError(null);
        setConnectionMode(null);
        disconnectMetaMask();
    }, [disconnectMetaMask, setConnectionMode]);

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
 * --- STATIC HELPERS ---
 */

/**
 * Safely check if account is deployed, handling potential SDK inconsistencies
 */
async function safeCheckDeployment(account: AccountAbstraction): Promise<boolean> {
    try {
        // @ts-ignore - Handle SDK method variations if necessary
        return await account.isAccountDeployed();
    } catch {
        try {
            // @ts-ignore
            return await account.isDeployed();
        } catch {
            return false;
        }
    }
}

/**
 * Helper to get or create AccountAbstraction for a specific chain
 * (Stateless version for usage in other hooks like useCrossChainTransfer)
 */
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

        const accountInstance = new AccountAbstraction(config.evm as any);
        const result = await accountInstance.connect(signer);
        const deployed = await safeCheckDeployment(accountInstance);

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
    amount: bigint,
    publicClient?: PublicClient
): Promise<boolean> => {
    try {
        const ownerAddr = await account.getOwner();
        let currentAllowance = BigInt(0);

        // Check allowance robustly using PublicClient if available (for specific spender)
        if (publicClient && ownerAddr) {
            try {
                currentAllowance = await publicClient.readContract({
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: 'allowance',
                    args: [ownerAddr, spender]
                }) as bigint;
            } catch (err) {
                console.warn("[ensureTokenApproval] Failed to read allowance via publicClient", err);
                // Fallback to SDK (might check wrong spender)
                currentAllowance = await account.getAllowance(tokenAddress);
            }
        } else {
            currentAllowance = await account.getAllowance(tokenAddress);
        }

        if (currentAllowance >= amount) {
            return true;
        }

        // 1. Check & Request Gas Fund / Approval Support via SDK
        try {
            console.log("[ensureTokenApproval] Requesting Approval Support...");
            await account.requestApprovalSupport(tokenAddress, spender, amount);
        } catch (supportErr) {
            console.warn("[ensureTokenApproval] Support request warning:", supportErr);
        }

        const result = await account.approveToken(tokenAddress, spender, maxUint256);

        // Wait for mining by polling Allowance (Robust & Faster than waiting for receipt)
        if (result && result !== "NOT_NEEDED" && typeof result === 'string') {
            const pollStart = Date.now();
            const POLL_TIMEOUT = 30000; // 30s timeout
            console.log("[ensureTokenApproval] Polling for allowance update...");

            while (Date.now() - pollStart < POLL_TIMEOUT) {
                await new Promise(r => setTimeout(r, 7000)); // 7s
                try {
                    let updatedAllowance = BigInt(0);
                    if (publicClient && ownerAddr) {
                        updatedAllowance = await publicClient.readContract({
                            address: tokenAddress,
                            abi: erc20Abi,
                            functionName: 'allowance',
                            args: [ownerAddr, spender]
                        }) as bigint;
                    }

                    if (updatedAllowance >= amount) {
                        console.log("[ensureTokenApproval] Allowance verified on-chain!");
                        break;
                    }
                } catch (e) {
                    // ignore read errors during poll
                }
            }
        }

        return result === "NOT_NEEDED" || !!result;
    } catch (e) {
        console.error("[ensureTokenApproval] Error:", e);
        return false;
    }
};
