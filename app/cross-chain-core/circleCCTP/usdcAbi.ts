export const usdcAbi = [
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
    }
];
