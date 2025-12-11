// ABI del TokenMessenger de Circle (CCTP V2)
// https://developers.circle.com/stablecoins/evm-smart-contracts

export const tokenMessengerAbi = [
    {
        inputs: [
            { name: "amount", type: "uint256" },
            { name: "destinationDomain", type: "uint32" },
            { name: "mintRecipient", type: "bytes32" },
            { name: "burnToken", type: "address" }
        ],
        name: "depositForBurn",
        outputs: [{ name: "nonce", type: "uint64" }],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { name: "amount", type: "uint256" },
            { name: "destinationDomain", type: "uint32" },
            { name: "mintRecipient", type: "bytes32" },
            { name: "burnToken", type: "address" },
            { name: "destinationCaller", type: "bytes32" }
        ],
        name: "depositForBurnWithCaller",
        outputs: [{ name: "nonce", type: "uint64" }],
        stateMutability: "nonpayable",
        type: "function"
    },
    // CCTP V2 - depositForBurn con fee y finality
    {
        inputs: [
            { name: "amount", type: "uint256" },
            { name: "destinationDomain", type: "uint32" },
            { name: "mintRecipient", type: "bytes32" },
            { name: "burnToken", type: "address" },
            { name: "destinationCaller", type: "bytes32" },
            { name: "maxFee", type: "uint256" },
            { name: "minFinalityThreshold", type: "uint32" }
        ],
        name: "depositForBurn",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
] as const;

// ABI del MessageTransmitter de Circle (para recibir mensajes)
export const messageTransmitterAbi = [
    {
        inputs: [
            { name: "message", type: "bytes" },
            { name: "attestation", type: "bytes" }
        ],
        name: "receiveMessage",
        outputs: [{ name: "success", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ name: "nonce", type: "bytes32" }],
        name: "usedNonces",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    }
] as const;
