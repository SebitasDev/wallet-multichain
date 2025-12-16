require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: '../.env.local' });
require("dotenv").config({ path: '../.env' });
console.log("DEBUG: Private Key set?", process.env.PRIVATE_KEY ? "YES" : "NO");
console.log("DEBUG: Target Network URL:", process.env.SCROLL_SEPOLIA_RPC || "Default RPC");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.20",
    networks: {
        scrollSepolia: {
            url: process.env.SCROLL_SEPOLIA_RPC || "https://sepolia-rpc.scroll.io/",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 534351,
        },
    },
};
