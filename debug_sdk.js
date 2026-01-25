const { CHAIN_CONFIGS } = require("@1llet.xyz/erc4337-gasless-sdk");
console.log("SDK Chain Configs Keys:", Object.keys(CHAIN_CONFIGS));
console.log("Gnosis Mainnet (100):", CHAIN_CONFIGS[100]);
console.log("Gnosis Chiado (10200):", CHAIN_CONFIGS[10200]);
console.log("Env:", process.env.NEXT_PUBLIC_ENVIROMENT);
