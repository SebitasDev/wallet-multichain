import { useState, useCallback } from "react";
import { AccountAbstraction, erc20Abi } from "@1llet.xyz/erc4337-gasless-sdk";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { Address, WalletClient, Hex, maxUint256, PublicClient, createWalletClient, custom } from "viem";

/**
 * Interface for the hook return value
 */
interface UseSmartAccountResult {
    account: AccountAbstraction | null;
    connectionType: 'local' | 'metamask' | 'embedded' | null;
    smartAccountAddress: string | null;
    ownerAddress: string | null;
    chainId: string | null;
    isDeployed: boolean;
    isConnecting: boolean;
    isDeploying: boolean;
    isApproving: boolean;
    error: string | null;
    connect: (chainKey: ChainKey, signerOrProvider: any) => Promise<AccountAbstraction | null>;
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
    /**
     * Connect to Smart Account via Signer/Provider
     */
    const connect = useCallback(async (chainKey: ChainKey, signerOrProvider: any): Promise<AccountAbstraction | null> => {
        setIsConnecting(true);
        setError(null);

        try {
            const config = NETWORKS[chainKey];
            if (!config || !config.evm) {
                throw new Error(`Chain ${chainKey} is not configured for EVM operations`);
            }

            const targetChainId = config.evm.chain.id.toString();

            // Create AccountAbstraction instance
            const accountInstance = new AccountAbstraction(config.evm as any);
            let result: { owner: `0x${string}`; smartAccount: `0x${string}` };

            console.log("[useSmartAccount] connect called with:", signerOrProvider);

            // Determine if signerOrProvider is a WalletClient (viem) or Signer (ethers) or Provider
            // The SDK's `.connect()` can take:
            // - nothing (reads from window.ethereum basically if not passed? or fails?)
            // - WalletClient (viem)
            // - JsonRpcSigner (ethers)
            // - Private Key string

            // We need to normalize what we pass to it.
            // If it's a private key string (Local Strategy might return it if we want, or it returns a Wallet object)
            // If it's an Ethers Wallet (Local Strategy), it works as a Signer.

            // If it's a Provider (from XO / Embedded), we might need to wrap it in a WalletClient or pass it if SDK supports it.

            // Let's assume signerOrProvider is compatible with SDK connect.
            // If External (Connector/Provider from wagmi or XO - EIP-1193):
            if (signerOrProvider && signerOrProvider.request) {
                console.log("[useSmartAccount] Detected EIP-1193 Provider");

                // Fetch account to ensure WalletClient has an account for signing
                const accounts = await signerOrProvider.request({ method: 'eth_accounts' });
                const accountAddress = accounts[0];
                console.log("[useSmartAccount] Using account for WalletClient:", accountAddress);

                const walletClient = createWalletClient({
                    account: accountAddress as `0x${string}`,
                    chain: config.evm.chain,
                    transport: custom(signerOrProvider)
                });
                result = await accountInstance.connect(walletClient);
            }
            // If it's an Ethers Wallet (Local Strategy), extract private key
            else if (signerOrProvider && (signerOrProvider.privateKey || (signerOrProvider as any)._signingKey)) {
                console.log("[useSmartAccount] Detected Ethers Wallet / Private Key Source");
                const pk = signerOrProvider.privateKey || (signerOrProvider as any)._signingKey().privateKey;
                result = await accountInstance.connect(pk);
            }
            // Fallback (e.g. WalletClient or Signer if SDK supports it directly)
            else {
                console.log("[useSmartAccount] Using Fallback Connection");
                result = await accountInstance.connect(signerOrProvider);
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
    }, [mainWallet, storeSetSmartAccount, updateSmartAccountDeployStatus]);

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
 * (Stateless version for usage in other hooks like usePrimaryTransfer)
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

        const accountInstance = new AccountAbstraction({
            ...(config.evm as any),
            paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL || config.evm.paymasterUrl || "https://api.stackup.sh/v1/node/..." // Fallback or Env 
        });
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
    publicClient?: PublicClient,
    ownerOverride?: Address
): Promise<boolean> => {
    try {
        const ownerAddr = ownerOverride || await account.getOwner();
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
