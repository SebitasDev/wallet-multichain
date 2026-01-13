import { NETWORKS } from "@/app/constants/chainsInformation";
import { getNearSimulation } from "@1llet.xyz/erc4337-gasless-sdk";
import { createPublicClient, http, formatEther } from "viem";
import { ChainKey } from "@/app/types/chain";

interface SimulationResult {
    success: boolean;
    estimatedReceived: string;
    protocolFee?: number;
    error?: string;
    description?: string;
}

export const checkCCTPSupport = (
    sourceChain: string,
    destChain: string,
    sourceToken: string,
    destToken: string
): boolean => {
    const srcConfig = NETWORKS[sourceChain as ChainKey];
    const dstConfig = NETWORKS[destChain as ChainKey];

    return !!(
        (sourceToken.toUpperCase() === 'USDC' && destToken.toUpperCase() === 'USDC') &&
        srcConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP &&
        dstConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP
    );
};

export const calculateGasDeduction = async (
    sourceChainKey: string,
    token: string,
    amount: number
): Promise<{ netAmount: number; error?: string }> => {
    const sourceConfig = NETWORKS[sourceChainKey as ChainKey];
    const asset = sourceConfig?.assets?.find(a => a.name === token);
    const isNative = asset?.address === "0x0000000000000000000000000000000000000000" ||
        (!!asset?.address && asset.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");

    let netAmount = amount;

    if (isNative && sourceConfig?.evm) {
        try {
            const publicClient = createPublicClient({
                chain: sourceConfig.evm.chain,
                transport: http()
            });
            const gasPrice = await publicClient.getGasPrice();
            const gasCostWei = (BigInt(21000) * gasPrice * BigInt(150)) / BigInt(100); // 21k Gas + 50% Buffer
            const gasCostEth = parseFloat(formatEther(gasCostWei));

            console.log(`[Simulate] Gas Deduction (${token}): ${gasCostEth.toFixed(6)}`);
            netAmount = Math.max(0, amount - gasCostEth);

            if (netAmount <= 0) {
                return {
                    netAmount: 0,
                    error: `Insufficient funds for gas (Need ${gasCostEth.toFixed(6)} ${token})`
                };
            }
        } catch (e: any) {
            console.warn("[Simulate] Gas Estimation Failed:", e);
            if (e.message?.includes("Insufficient")) {
                return { netAmount: 0, error: e.message };
            }
        }
    }

    return { netAmount };
};

export const runTransferSimulation = async (
    sourceChainKey: string,
    destChainKey: string,
    amount: number,
    sourceToken: string,
    destToken: string,
    shouldDeductGas: boolean = false
): Promise<SimulationResult> => {
    // 1. CCTP Check
    const isCCTP = checkCCTPSupport(sourceChainKey, destChainKey, sourceToken, destToken);

    if (isCCTP) {
        return {
            success: true,
            estimatedReceived: amount.toString(), // 1:1 for CCTP
            protocolFee: 0
        };
    }

    // 2. Gas Deduction (Optional)
    let amountToSimulate = amount;
    if (shouldDeductGas) {
        const { netAmount, error } = await calculateGasDeduction(sourceChainKey, sourceToken, amount);
        if (error) {
            return {
                success: false,
                estimatedReceived: "0",
                error: error
            };
        }
        amountToSimulate = netAmount;
    }

    // 3. Fee Calculation (Frontend Simulation Logic)
    const isDev = process.env.NODE_ENV === 'development';
    const isSameChain = sourceChainKey === destChainKey;
    const baseFee = isSameChain ? 0.01 : 0.02;
    const fee = isDev ? 0 : baseFee;

    // Ensure we don't simulate negative amounts after fee
    // Note: The original logic in useSendMoneyRoute added the fee to get "totalAmountToSimulate" 
    // but the SDK expects the amount *user wants to send*. 
    // Wait, useSendMoneyRoute lines 89-98:
    // const totalAmountToSimulate = (netAmount + fee).toFixed(6);
    // getNearSimulation(..., totalAmountToSimulate, ...)
    // This implies the SDK simulation takes the TOTAL amount (including fee).

    const totalAmountToSimulate = (amountToSimulate + fee).toFixed(6);

    try {
        const data = await getNearSimulation(
            sourceChainKey as any,
            destChainKey as any,
            totalAmountToSimulate, // Passing total amount
            sourceToken || "USDC",
            destToken
        );

        return {
            success: data.success,
            estimatedReceived: data.estimatedReceived || "0",
            protocolFee: data.protocolFee,
            error: data.error
        };

    } catch (error: any) {
        const errorMessage = error?.response?.data?.error || error?.message || "Failed to simulate";
        return {
            success: false,
            estimatedReceived: "0",
            error: errorMessage
        };
    }
};
