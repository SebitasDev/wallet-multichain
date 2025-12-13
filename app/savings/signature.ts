import { Address } from "abitype";
import { recoverTypedDataAddress, hashTypedData } from "viem";
import { getSavingsChainConfig, SavingsChainKey } from "./config";

/**
 * EIP-712 type definitions for savings operations
 */
export const SavingsDepositTypes = {
    SavingsDeposit: [
        { name: "wallet", type: "address" },
        { name: "chain", type: "string" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
    ],
} as const;

export const SavingsWithdrawTypes = {
    SavingsWithdraw: [
        { name: "wallet", type: "address" },
        { name: "chain", type: "string" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
    ],
} as const;

/**
 * Get EIP-712 domain for a specific chain
 */
export function getSavingsDomain(chainKey: SavingsChainKey) {
    const config = getSavingsChainConfig(chainKey);
    return {
        name: "SparkSavings",
        version: "1",
        chainId: config.chainId,
        verifyingContract: config.sUsdcVault,
    };
}

/**
 * Create deposit message for signing
 */
export function createDepositMessage(
    wallet: Address,
    chain: SavingsChainKey,
    amount: string,
    nonce: string
) {
    return {
        wallet,
        chain,
        amount,
        nonce,
    };
}

/**
 * Create withdraw message for signing
 */
export function createWithdrawMessage(
    wallet: Address,
    chain: SavingsChainKey,
    amount: string,
    nonce: string
) {
    return {
        wallet,
        chain,
        amount,
        nonce,
    };
}

/**
 * Get typed data for deposit operation (for client-side signing)
 */
export function getDepositTypedData(
    wallet: Address,
    chain: SavingsChainKey,
    amount: string,
    nonce: string
) {
    return {
        domain: getSavingsDomain(chain),
        types: SavingsDepositTypes,
        primaryType: "SavingsDeposit" as const,
        message: createDepositMessage(wallet, chain, amount, nonce),
    };
}

/**
 * Get typed data for withdraw operation (for client-side signing)
 */
export function getWithdrawTypedData(
    wallet: Address,
    chain: SavingsChainKey,
    amount: string,
    nonce: string
) {
    return {
        domain: getSavingsDomain(chain),
        types: SavingsWithdrawTypes,
        primaryType: "SavingsWithdraw" as const,
        message: createWithdrawMessage(wallet, chain, amount, nonce),
    };
}

/**
 * Recover signer address from deposit signature
 */
export async function recoverDepositSigner(
    chainKey: SavingsChainKey,
    message: {
        wallet: Address;
        chain: string;
        amount: string;
        nonce: string;
    },
    signature: `0x${string}`
): Promise<Address> {
    const domain = getSavingsDomain(chainKey);

    const recoveredAddress = await recoverTypedDataAddress({
        domain,
        types: SavingsDepositTypes,
        primaryType: "SavingsDeposit",
        message: {
            wallet: message.wallet,
            chain: message.chain,
            amount: BigInt(message.amount),
            nonce: BigInt(message.nonce),
        },
        signature,
    });

    return recoveredAddress;
}

/**
 * Recover signer address from withdraw signature
 */
export async function recoverWithdrawSigner(
    chainKey: SavingsChainKey,
    message: {
        wallet: Address;
        chain: string;
        amount: string;
        nonce: string;
    },
    signature: `0x${string}`
): Promise<Address> {
    const domain = getSavingsDomain(chainKey);

    const recoveredAddress = await recoverTypedDataAddress({
        domain,
        types: SavingsWithdrawTypes,
        primaryType: "SavingsWithdraw",
        message: {
            wallet: message.wallet,
            chain: message.chain,
            amount: BigInt(message.amount),
            nonce: BigInt(message.nonce),
        },
        signature,
    });

    return recoveredAddress;
}

/**
 * Verify that the signer matches the expected wallet
 */
export async function verifyDepositSignature(
    chainKey: SavingsChainKey,
    walletAddress: Address,
    amount: string,
    nonce: string,
    signature: `0x${string}`
): Promise<boolean> {
    try {
        const message = createDepositMessage(walletAddress, chainKey, amount, nonce);
        const signer = await recoverDepositSigner(chainKey, message, signature);
        return signer.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
        console.error("Deposit signature verification failed:", error);
        return false;
    }
}

/**
 * Verify that the signer matches the expected wallet
 */
export async function verifyWithdrawSignature(
    chainKey: SavingsChainKey,
    walletAddress: Address,
    amount: string,
    nonce: string,
    signature: `0x${string}`
): Promise<boolean> {
    try {
        const message = createWithdrawMessage(walletAddress, chainKey, amount, nonce);
        const signer = await recoverWithdrawSigner(chainKey, message, signature);
        return signer.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
        console.error("Withdraw signature verification failed:", error);
        return false;
    }
}

/**
 * Generate a unique nonce based on timestamp
 */
export function generateNonce(): string {
    return Date.now().toString();
}

/**
 * Hash typed data for deposit (can be used for logging/verification)
 */
export function hashDepositTypedData(
    chainKey: SavingsChainKey,
    wallet: Address,
    amount: string,
    nonce: string
): `0x${string}` {
    const domain = getSavingsDomain(chainKey);
    const message = {
        wallet,
        chain: chainKey,
        amount: BigInt(amount),
        nonce: BigInt(nonce),
    };

    return hashTypedData({
        domain,
        types: SavingsDepositTypes,
        primaryType: "SavingsDeposit",
        message,
    });
}

/**
 * Hash typed data for withdraw (can be used for logging/verification)
 */
export function hashWithdrawTypedData(
    chainKey: SavingsChainKey,
    wallet: Address,
    amount: string,
    nonce: string
): `0x${string}` {
    const domain = getSavingsDomain(chainKey);
    const message = {
        wallet,
        chain: chainKey,
        amount: BigInt(amount),
        nonce: BigInt(nonce),
    };

    return hashTypedData({
        domain,
        types: SavingsWithdrawTypes,
        primaryType: "SavingsWithdraw",
        message,
    });
}
