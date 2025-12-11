// ABI de USDC con soporte para ERC-3009 (transferWithAuthorization)
// Este estándar permite transferencias gasless donde el usuario firma off-chain
// y un relayer (facilitador) ejecuta la transacción on-chain

export const usdcErc3009Abi = [
    // ERC-20 estándar
    {
        constant: true,
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ type: "uint256" }],
        type: "function"
    },
    {
        constant: false,
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" }
        ],
        name: "transfer",
        outputs: [{ type: "bool" }],
        type: "function"
    },
    {
        constant: false,
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" }
        ],
        name: "approve",
        outputs: [{ type: "bool" }],
        type: "function"
    },
    {
        constant: true,
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" }
        ],
        name: "allowance",
        outputs: [{ type: "uint256" }],
        type: "function"
    },
    // ERC-3009: Transfer With Authorization
    {
        inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
            { name: "v", type: "uint8" },
            { name: "r", type: "bytes32" },
            { name: "s", type: "bytes32" }
        ],
        name: "transferWithAuthorization",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    // ERC-3009: Receive With Authorization (para recibir)
    {
        inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
            { name: "v", type: "uint8" },
            { name: "r", type: "bytes32" },
            { name: "s", type: "bytes32" }
        ],
        name: "receiveWithAuthorization",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    // Check authorization state
    {
        inputs: [
            { name: "authorizer", type: "address" },
            { name: "nonce", type: "bytes32" }
        ],
        name: "authorizationState",
        outputs: [{ type: "bool" }],
        stateMutability: "view",
        type: "function"
    },
    // EIP-712 domain info
    {
        inputs: [],
        name: "name",
        outputs: [{ type: "string" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "version",
        outputs: [{ type: "string" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "DOMAIN_SEPARATOR",
        outputs: [{ type: "bytes32" }],
        stateMutability: "view",
        type: "function"
    },
    // Decimals
    {
        inputs: [],
        name: "decimals",
        outputs: [{ type: "uint8" }],
        stateMutability: "view",
        type: "function"
    }
] as const;

// Tipos para EIP-712 de TransferWithAuthorization
export const TransferWithAuthorizationTypes = {
    TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
    ],
} as const;

// Tipos para EIP-712 de ReceiveWithAuthorization
export const ReceiveWithAuthorizationTypes = {
    ReceiveWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
    ],
} as const;
