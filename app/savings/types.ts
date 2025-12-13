import { Address } from "abitype";
import { SavingsChainKey } from "./config";

/**
 * Position in a Spark.fi sUSDC vault
 */
export interface SavingsPosition {
    /** Chain identifier */
    chain: SavingsChainKey;
    /** Number of sUSDC shares held */
    shares: string;
    /** Current value in USDC (from convertToAssets) */
    currentValue: string;
    /** Amount originally deposited in USDC */
    deposited: string;
    /** Earnings in USDC (currentValue - deposited) */
    earned: string;
    /** Current APY percentage */
    apy: string;
}

/**
 * Deposit history entry stored in localStorage
 */
export interface DepositHistoryEntry {
    /** Chain where deposit was made */
    chain: SavingsChainKey;
    /** Amount deposited in USDC (raw BigInt string) */
    amount: string;
    /** Timestamp of deposit */
    timestamp: number;
    /** Transaction hash */
    txHash: string;
    /** Type of operation */
    type: "deposit" | "withdraw";
}

/**
 * Request body for deposit endpoint
 */
export interface DepositRequest {
    /** Target chain */
    chain: SavingsChainKey;
    /** Amount to deposit in USDC (6 decimals, as string) */
    amount: string;
    /** Wallet address performing the deposit */
    walletAddress: Address;
    /** User's private key (hex string with 0x prefix) */
    privateKey: `0x${string}`;
}

/**
 * Request body for withdraw endpoint
 */
export interface WithdrawRequest {
    /** Target chain */
    chain: SavingsChainKey;
    /** Amount to withdraw in USDC (6 decimals, as string) */
    amount: string;
    /** Wallet address performing the withdrawal */
    walletAddress: Address;
    /** User's private key (hex string with 0x prefix) */
    privateKey: `0x${string}`;
}

/**
 * Response from deposit endpoint
 */
export interface DepositResponse {
    /** Whether the operation succeeded */
    success: boolean;
    /** Transaction hash (if successful) */
    transactionHash?: string;
    /** Amount of shares received */
    shares?: string;
    /** Error message (if failed) */
    errorReason?: string;
}

/**
 * Response from withdraw endpoint
 */
export interface WithdrawResponse {
    /** Whether the operation succeeded */
    success: boolean;
    /** Transaction hash (if successful) */
    transactionHash?: string;
    /** Amount of USDC received */
    usdcAmount?: string;
    /** Error message (if failed) */
    errorReason?: string;
}

/**
 * Single position data from API
 */
export interface PositionData {
    /** Chain identifier */
    chain: SavingsChainKey;
    /** Shares held (raw BigInt string) */
    shares: string;
    /** Current value in USDC (raw BigInt string) */
    currentValue: string;
}

/**
 * Response from positions endpoint
 */
export interface PositionsResponse {
    /** Array of positions across chains */
    positions: PositionData[];
    /** Error message (if failed) */
    errorReason?: string;
}

/**
 * Aggregated savings summary
 */
export interface SavingsSummary {
    /** Total deposited across all chains (formatted) */
    totalDeposited: string;
    /** Total current value across all chains (formatted) */
    totalValue: string;
    /** Total earned across all chains (formatted) */
    totalEarned: string;
    /** Average APY weighted by value */
    averageApy: string;
    /** Number of active positions */
    positionCount: number;
}

/**
 * EIP-712 typed data for savings operations
 */
export interface SavingsTypedData {
    domain: {
        name: string;
        version: string;
        chainId: number;
        verifyingContract: Address;
    };
    types: {
        SavingsDeposit: readonly { name: string; type: string }[];
        SavingsWithdraw: readonly { name: string; type: string }[];
    };
    primaryType: "SavingsDeposit" | "SavingsWithdraw";
    message: {
        wallet: Address;
        chain: string;
        amount: string;
        nonce: string;
    };
}

/**
 * Chain APY data
 */
export interface ChainApyData {
    chain: SavingsChainKey;
    apy: number;
    lastUpdated: number;
}

/**
 * Modal state for confirmations
 */
export interface ConfirmationModalState {
    isOpen: boolean;
    type: "deposit" | "withdraw";
    chain: SavingsChainKey | null;
    amount: string;
    estimatedGas: string;
    onConfirm: (() => Promise<void>) | null;
    isLoading: boolean;
}
