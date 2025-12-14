import { Address } from "abitype";
import { NETWORKS, ChainKey } from "@/app/constants/chainsInformation";

/**
 * Supported chains for Spark.fi USDC Savings Vaults
 */
export const SavingsChainKeys = ["Base", "Optimism", "Arbitrum", "Unichain"] as const;
export type SavingsChainKey = (typeof SavingsChainKeys)[number];

/**
 * Spark.fi sUSDC Vault addresses per chain (Mainnet only)
 * These are ERC-4626 compliant vaults that deposit USDC into Sky Savings Rate
 */
export const SUSDC_VAULT_ADDRESSES: Record<SavingsChainKey, Address> = {
    Base: "0x3128a0f7f0ea68e7b7c9b00afa7e41045828e858",
    Optimism: "0xCF9326e24EBfFBEF22ce1050007A43A3c0B6DB55",
    Arbitrum: "0x940098b108fb7d0a7e374f6eded7760787464609",
    Unichain: "0x14d9143BEcC348920b68D123687045db49a016C6",
};

/**
 * USDC token addresses per chain (from existing config)
 */
export const USDC_ADDRESSES: Record<SavingsChainKey, Address> = {
    Base: NETWORKS.Base.usdc,
    Optimism: NETWORKS.Optimism.usdc,
    Arbitrum: NETWORKS.Arbitrum.usdc,
    Unichain: NETWORKS.Unichain.usdc,
};

/**
 * Chain configuration for savings operations
 */
export interface SavingsChainConfig {
    chain: (typeof NETWORKS)[ChainKey]["chain"];
    rpcUrl: string;
    usdc: Address;
    sUsdcVault: Address;
    chainId: number;
    label: string;
    chipColor: string;
}

/**
 * Get complete savings configuration for a chain
 */
export function getSavingsChainConfig(chainKey: SavingsChainKey): SavingsChainConfig {
    const networkConfig = NETWORKS[chainKey];
    return {
        chain: networkConfig.chain,
        rpcUrl: networkConfig.rpcUrl,
        usdc: USDC_ADDRESSES[chainKey],
        sUsdcVault: SUSDC_VAULT_ADDRESSES[chainKey],
        chainId: networkConfig.chain.id,
        label: networkConfig.label,
        chipColor: networkConfig.chipColor,
    };
}

/**
 * Get all savings chain configurations
 */
export function getAllSavingsConfigs(): Record<SavingsChainKey, SavingsChainConfig> {
    return {
        Base: getSavingsChainConfig("Base"),
        Optimism: getSavingsChainConfig("Optimism"),
        Arbitrum: getSavingsChainConfig("Arbitrum"),
        Unichain: getSavingsChainConfig("Unichain"),
    };
}

/**
 * USDC decimals (always 6)
 */
export const USDC_DECIMALS = 6;

/**
 * Convert human-readable USDC amount to BigInt (6 decimals)
 * @param amount - Human readable amount (e.g., "100.50")
 * @returns BigInt representation (e.g., 100500000n)
 */
export function parseUsdcAmount(amount: string | number): bigint {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount < 0) {
        throw new Error("Invalid USDC amount");
    }
    // Multiply by 10^6 and floor to avoid floating point issues
    return BigInt(Math.floor(numAmount * 10 ** USDC_DECIMALS));
}

/**
 * Convert BigInt USDC amount to human-readable string
 * @param amount - BigInt amount (e.g., 100500000n)
 * @returns Human readable string (e.g., "100.50")
 */
export function formatUsdcAmount(amount: bigint): string {
    const divisor = BigInt(10 ** USDC_DECIMALS);
    const integerPart = amount / divisor;
    const fractionalPart = amount % divisor;

    // Pad fractional part to 6 digits, then take first 2 for display
    const fractionalStr = fractionalPart.toString().padStart(USDC_DECIMALS, "0");
    const displayFractional = fractionalStr.slice(0, 2);

    return `${integerPart}.${displayFractional}`;
}

/**
 * Format USDC amount for display with currency symbol
 * @param amount - BigInt amount
 * @returns Formatted string (e.g., "$100.50 USDC")
 */
export function formatUsdcDisplay(amount: bigint): string {
    const formatted = formatUsdcAmount(amount);
    const num = parseFloat(formatted);
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
}

/**
 * Check if a chain key is a valid savings chain
 */
export function isSavingsChain(chainKey: string): chainKey is SavingsChainKey {
    return SavingsChainKeys.includes(chainKey as SavingsChainKey);
}
