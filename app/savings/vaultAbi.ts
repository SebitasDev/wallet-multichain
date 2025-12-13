/**
 * ERC-4626 Vault ABI for Spark.fi sUSDC vaults
 * https://eips.ethereum.org/EIPS/eip-4626
 */
export const erc4626VaultAbi = [
    // ============ Read Functions ============

    /**
     * Returns the address of the underlying asset (USDC)
     */
    {
        inputs: [],
        name: "asset",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Returns the total amount of underlying assets held by the vault
     */
    {
        inputs: [],
        name: "totalAssets",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Returns the amount of shares owned by an account
     */
    {
        inputs: [{ name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Returns the total supply of shares
     */
    {
        inputs: [],
        name: "totalSupply",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Converts a given amount of assets to shares
     */
    {
        inputs: [{ name: "assets", type: "uint256" }],
        name: "convertToShares",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Converts a given amount of shares to assets
     */
    {
        inputs: [{ name: "shares", type: "uint256" }],
        name: "convertToAssets",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Returns the maximum amount of assets that can be deposited
     */
    {
        inputs: [{ name: "receiver", type: "address" }],
        name: "maxDeposit",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Returns the maximum amount of shares that can be minted
     */
    {
        inputs: [{ name: "receiver", type: "address" }],
        name: "maxMint",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Returns the maximum amount of assets that can be withdrawn
     */
    {
        inputs: [{ name: "owner", type: "address" }],
        name: "maxWithdraw",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Returns the maximum amount of shares that can be redeemed
     */
    {
        inputs: [{ name: "owner", type: "address" }],
        name: "maxRedeem",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Previews the amount of shares that would be minted for a deposit
     */
    {
        inputs: [{ name: "assets", type: "uint256" }],
        name: "previewDeposit",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Previews the amount of assets needed to mint shares
     */
    {
        inputs: [{ name: "shares", type: "uint256" }],
        name: "previewMint",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Previews the amount of shares that would be burned for a withdrawal
     */
    {
        inputs: [{ name: "assets", type: "uint256" }],
        name: "previewWithdraw",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Previews the amount of assets that would be returned for redeeming shares
     */
    {
        inputs: [{ name: "shares", type: "uint256" }],
        name: "previewRedeem",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Returns the number of decimals for the vault shares
     */
    {
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Returns the name of the vault token
     */
    {
        inputs: [],
        name: "name",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },

    /**
     * Returns the symbol of the vault token
     */
    {
        inputs: [],
        name: "symbol",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },

    // ============ Write Functions ============

    /**
     * Deposits assets and mints shares to receiver
     * @param assets Amount of underlying assets to deposit
     * @param receiver Address to receive the minted shares
     * @returns shares Amount of shares minted
     */
    {
        inputs: [
            { name: "assets", type: "uint256" },
            { name: "receiver", type: "address" },
        ],
        name: "deposit",
        outputs: [{ name: "shares", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },

    /**
     * Mints exact amount of shares to receiver
     * @param shares Amount of shares to mint
     * @param receiver Address to receive the minted shares
     * @returns assets Amount of assets deposited
     */
    {
        inputs: [
            { name: "shares", type: "uint256" },
            { name: "receiver", type: "address" },
        ],
        name: "mint",
        outputs: [{ name: "assets", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },

    /**
     * Withdraws assets from vault burning shares from owner
     * @param assets Amount of underlying assets to withdraw
     * @param receiver Address to receive the withdrawn assets
     * @param owner Address whose shares will be burned
     * @returns shares Amount of shares burned
     */
    {
        inputs: [
            { name: "assets", type: "uint256" },
            { name: "receiver", type: "address" },
            { name: "owner", type: "address" },
        ],
        name: "withdraw",
        outputs: [{ name: "shares", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },

    /**
     * Redeems shares for underlying assets
     * @param shares Amount of shares to redeem
     * @param receiver Address to receive the underlying assets
     * @param owner Address whose shares will be burned
     * @returns assets Amount of assets withdrawn
     */
    {
        inputs: [
            { name: "shares", type: "uint256" },
            { name: "receiver", type: "address" },
            { name: "owner", type: "address" },
        ],
        name: "redeem",
        outputs: [{ name: "assets", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },

    // ============ Events ============

    /**
     * Emitted when assets are deposited
     */
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "sender", type: "address" },
            { indexed: true, name: "owner", type: "address" },
            { indexed: false, name: "assets", type: "uint256" },
            { indexed: false, name: "shares", type: "uint256" },
        ],
        name: "Deposit",
        type: "event",
    },

    /**
     * Emitted when assets are withdrawn
     */
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "sender", type: "address" },
            { indexed: true, name: "receiver", type: "address" },
            { indexed: true, name: "owner", type: "address" },
            { indexed: false, name: "assets", type: "uint256" },
            { indexed: false, name: "shares", type: "uint256" },
        ],
        name: "Withdraw",
        type: "event",
    },
] as const;

/**
 * Standard ERC20 ABI for USDC token interactions
 */
export const erc20Abi = [
    {
        inputs: [{ name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "transferFrom",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
    },
] as const;
