import "dotenv/config";
import { BridgeKit, TransferSpeed } from "@circle-fin/bridge-kit";
import { createAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import { Address } from "abitype";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, optimismSepolia, polygonAmoy } from "viem/chains";
import { getPrivateClientByNetworkName } from "@/app/utils/getClientByNetworkName";

const kit = new BridgeKit();

// --------------------------------------
// FIX TYPES
// --------------------------------------
type ChainKey = "Optimism_Sepolia" | "Polygon_Amoy_Testnet" | "Base_Sepolia";

// USDC ADDRESSES
const USDC_ADDRESSES: Record<ChainKey, Address> = {
    Optimism_Sepolia: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    Polygon_Amoy_Testnet: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    Base_Sepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

// INTERNAL CHAIN MAP
const CHAIN_MAP: Record<ChainKey, any> = {
    Optimism_Sepolia: optimismSepolia,
    Polygon_Amoy_Testnet: polygonAmoy,
    Base_Sepolia: baseSepolia,
};

// ARC SPENDER
const ARC_SPENDER = "0xC5567a5E3370d4DBfB0540025078e283e36A363d";

// ABI
const ERC20_APPROVE_ABI = [
    {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
];

export const bridgeUSDC = async (
    privateKey: string,
    fromChain: ChainKey,
    toChain: ChainKey,
    recipient: Address,
    amount: string
) => {
    try {
        console.log("---------------Starting Bridging---------------");

        const account = privateKeyToAccount(privateKey as `0x${string}`);

        // chain dinámico
        const chainObj = CHAIN_MAP[fromChain];
        const usdcAddress = USDC_ADDRESSES[fromChain];

        const client = getPrivateClientByNetworkName(
            chainObj.id.toString(),
            account
        );

        console.log("Executing approve...");

        // APROVE INLINE
        const approveTx = await client.writeContract({
            address: usdcAddress,
            abi: ERC20_APPROVE_ABI,
            functionName: "approve",
            args: [ARC_SPENDER, BigInt(52000000000)],
            chain: chainObj,
        });

        console.log("Approve TX:", approveTx);

        const adapter = createAdapterFromPrivateKey({ privateKey });

        // ARC requiere string decimal exacto
        const fixedAmount = Number(amount).toFixed(6);

        console.log("Starting ARC bridge...");

        const result = await kit.bridge({
            from: { adapter, chain: fromChain },
            to: {
                adapter,
                chain: toChain,
                recipientAddress: recipient,
            },
            amount: fixedAmount,
            config: { transferSpeed: TransferSpeed.FAST },
        });

        console.log(result.steps.find((s) => s.name === "mint"));

        return result;
    } catch (err) {
        console.error("ERROR", JSON.stringify(err, null, 2));
        return null;
    }
};