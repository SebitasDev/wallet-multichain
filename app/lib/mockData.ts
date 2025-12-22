
export const CHAIN_LOGOS: Record<string, string> = {
    // Layer 2s
    "Base": "https://avatars.githubusercontent.com/u/108554348?s=200&v=4",
    "Optimism": "https://assets.coingecko.com/coins/images/25244/small/Optimism.png?1660904599",
    "Arbitrum": "https://avatars.githubusercontent.com/u/89987034?s=200&v=4",
    "Polygon": "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png?1624446912",
    "ZkSync": "https://assets.coingecko.com/coins/images/24683/small/zksync.png?1647414980",
    "Starknet": "https://assets.coingecko.com/coins/images/27989/small/starknet.png?1667823377",

    // Layer 1s
    "Ethereum": "https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880",
    "Bitcoin": "https://assets.coingecko.com/coins/images/1/small/bitcoin.png?1547033579",
    "Solana": "https://assets.coingecko.com/coins/images/4128/small/solana.png?1640133422",
    "BSC": "https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png?1547034615",
    "Avalanche": "https://assets.coingecko.com/coins/images/12559/small/coin-round-red.png?1604021818",
    "Fantom": "https://assets.coingecko.com/coins/images/4001/small/Fantom.png?1558015016",

    // Testnets / Others
    "Sepolia": "https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880",
    "Goerli": "https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880",
};

export const MOCK_TRANSACTIONS = [
    {
        id: "tx-uuid-1234-5678",
        type: "SEND",
        amount: 3,
        rawAmount: 3000000,
        decimals: 6,
        token: "USDC",
        fee: 0.1,
        date: "Hoy, 14:30",
        status: "SUCCESS",
        to: "0xSebas...",
        addressFrom: "0xMe",
        addressTo: "0xSebas",
        chainTo: "Base",
        txHash: "0xBaseHash123456789",
        route: [
            {
                walletAddress: "0xMe",
                chains: [
                    { name: "Base", amount: 1.5, status: "SUCCESS", txHash: "0xSubTxBase1" },
                    { name: "Optimism", amount: 1.5, status: "SUCCESS", txHash: "0xSubTxOpt1" }
                ]
            }
        ]
    },
    {
        id: "tx-uuid-9999",
        type: "RECEIVE",
        amount: 0.5,
        rawAmount: 500000000000000000,
        decimals: 18,
        token: "ETH",
        fee: 0,
        date: "Ayer, 09:15",
        status: "SUCCESS",
        from: "0xExchange...",
        addressFrom: "0xExchange",
        addressTo: "0xMe",
        chainTo: "Ethereum",
        txHash: "0xEthHash9999",
        route: [
            {
                walletAddress: "0xExchange",
                chains: [
                    { name: "Ethereum", amount: 0.5, status: "SUCCESS", txHash: "0xSubTxEth1" }
                ]
            }
        ]
    },
    {
        id: "tx-uuid-8888",
        type: "SEND",
        amount: 100,
        rawAmount: 100000000,
        decimals: 6,
        token: "USDC",
        fee: 0.5,
        date: "20 Dic",
        status: "FAILED",
        to: "0xUnknown...",
        addressFrom: "0xMe",
        addressTo: "0xUnknown",
        chainTo: "Polygon",
        txHash: "0xPolyHash8888",
        route: [
            {
                walletAddress: "0xMe",
                chains: [
                    { name: "Polygon", amount: 100, status: "FAILED", txHash: "0xSubTxPoly1" }
                ]
            }
        ]
    },
    {
        id: "tx-uuid-7777",
        type: "SAVINGS",
        amount: 50,
        rawAmount: 50000000,
        decimals: 6,
        token: "USDC",
        fee: 0.2,
        date: "18 Dic",
        status: "PENDING",
        to: "Yield Protocol",
        addressFrom: "0xMe",
        addressTo: "Yield Protocol",
        chainTo: "Arbitrum",
        txHash: "0xArbHash7777",
        route: [
            {
                walletAddress: "0xMe",
                chains: [
                    { name: "Arbitrum", amount: 50, status: "PENDING", txHash: "0xSubTxArb1" }
                ]
            }
        ]
    },
    {
        id: "tx-uuid-6666",
        type: "SEND",
        amount: 12,
        rawAmount: 12000000,
        decimals: 6,
        token: "USDC",
        fee: 0.1,
        date: "15 Dic",
        status: "SUCCESS",
        to: "0xAlice...",
        addressFrom: "0xMe",
        addressTo: "0xAlice",
        chainTo: "Solana",
        txHash: "0xSolHash6666",
        route: [
            {
                walletAddress: "0xMe",
                chains: [
                    { name: "Solana", amount: 12, status: "SUCCESS", txHash: "0xSubTxSol1" }
                ]
            }
        ]
    },
    {
        id: "tx-uuid-5555",
        type: "RECEIVE",
        amount: 200,
        rawAmount: 200000000000000000000,
        decimals: 18,
        token: "DAI",
        fee: 0,
        date: "12 Dic",
        status: "SUCCESS",
        from: "0xBob...",
        addressFrom: "0xBob",
        addressTo: "0xMe",
        chainTo: "Optimism",
        txHash: "0xOptHash5555",
        route: [
            {
                walletAddress: "0xBob",
                chains: [
                    { name: "Optimism", amount: 200, status: "SUCCESS", txHash: "0xSubTxOpt2" }
                ]
            }
        ]
    }
];
