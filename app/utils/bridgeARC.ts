import "dotenv/config";
import { BridgeKit, TransferSpeed } from "@circle-fin/bridge-kit";
import { ChainIdentifier, createAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import { inspect } from "util";
import { Address } from "abitype";
import { privateKeyToAccount } from "viem/accounts";
import {baseSepolia, optimismSepolia, polygonAmoy} from "viem/chains";
import {getPrivateClientByNetworkName} from "@/app/utils/getClientByNetworkName";

const kit = new BridgeKit();

export const bridgeUSDC = async (
    privateKey: string,
    fromChain: ChainIdentifier,
    toChain: ChainIdentifier,
    recipient: Address,
    amount: string
) => {
    try {
        console.log("---------------Starting Bridging---------------");

        const account = privateKeyToAccount(privateKey as `0x${string}`);

        console.log("Executing approve...");


        if(fromChain === "Optimism_Sepolia") {
            const usdc = "0x5fd84259d66Cd46123540766Be93DFE6D43130D7";
            const client = getPrivateClientByNetworkName(optimismSepolia.id.toString(), account)
            const approveTx = await client.writeContract({
                address: usdc,
                abi: [
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
                ],
                functionName: "approve",
                args: ["0xC5567a5E3370d4DBfB0540025078e283e36A363d", "52000000000"],
                chain: optimismSepolia,
            });

            console.log("Approve TX in polygon:", approveTx);
        } else if (fromChain === "Polygon_Amoy_Testnet") {
            const usdc = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
            const client = getPrivateClientByNetworkName(polygonAmoy.id.toString(), account)
            const approveTx = await client.writeContract({
                address: usdc,
                abi: [
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
                ],
                functionName: "approve",
                args: ["0xC5567a5E3370d4DBfB0540025078e283e36A363d", "52000000000"],
                chain: polygonAmoy,
            });
            console.log("Approve TX in op:", approveTx);
        } else {
            const usdc = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
            const client = getPrivateClientByNetworkName(baseSepolia.id.toString(), account)
            const approveTx = await client.writeContract({
                address: usdc,
                abi: [
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
                ],
                functionName: "approve",
                args: ["0xC5567a5E3370d4DBfB0540025078e283e36A363d", "52000000000"],
                chain: baseSepolia,
            });
            console.log("Approve TX in base:", approveTx);
        }

        const adapter = createAdapterFromPrivateKey({ privateKey });

        const fixedAmount = Number(amount).toFixed(6);

        console.log("Starting ARC bridge...");

        const result = await kit.bridge({
            from: { adapter, chain: fromChain },
            to: {
                adapter,
                chain: toChain,
                recipientAddress: recipient
            },
            amount: fixedAmount,
            config: { transferSpeed: TransferSpeed.FAST }
        });

        const getStep = (stepName: string) => result.steps.find((step) => step.name === stepName);

        console.log(getStep("mint"));

        //console.log("RESULT", inspect(result, false, null, true));
        return result;

    } catch (err) {
        console.log("ERROR", inspect(err, false, null, true));
        return null;
    }
};
