import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { Address } from "abitype";
import {
    getSavingsChainConfig,
    SavingsChainKeys,
    SavingsChainKey,
} from "@/app/savings/config";
import { erc4626VaultAbi } from "@/app/savings/vaultAbi";
import { PositionsResponse, PositionData } from "@/app/savings/types";

/**
 * GET /api/savings/positions/:walletAddress
 *
 * Returns savings positions for a wallet across all supported chains.
 *
 * Flow:
 * 1. For each chain (Base, Optimism, Arbitrum, Unichain):
 *    - Read vault.balanceOf(wallet) -> shares
 *    - If shares > 0, read vault.convertToAssets(shares) -> currentValue
 * 2. Return positions array
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ walletAddress: string }> }
) {
    try {
        const { walletAddress } = await params;

        // Validate wallet address
        if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return NextResponse.json<PositionsResponse>(
                {
                    positions: [],
                    errorReason: "Invalid wallet address",
                },
                { status: 400 }
            );
        }

        const positions: PositionData[] = [];

        // Fetch positions from all chains in parallel
        const positionPromises = SavingsChainKeys.map(async (chainKey) => {
            try {
                const chainConfig = getSavingsChainConfig(chainKey);

                const publicClient = createPublicClient({
                    chain: chainConfig.chain,
                    transport: http(chainConfig.rpcUrl),
                });

                // Get shares balance
                const shares = (await publicClient.readContract({
                    address: chainConfig.sUsdcVault,
                    abi: erc4626VaultAbi,
                    functionName: "balanceOf",
                    args: [walletAddress as Address],
                })) as bigint;

                // Skip if no shares
                if (shares === BigInt(0)) {
                    return null;
                }

                // Convert shares to USDC value
                const currentValue = (await publicClient.readContract({
                    address: chainConfig.sUsdcVault,
                    abi: erc4626VaultAbi,
                    functionName: "convertToAssets",
                    args: [shares],
                })) as bigint;

                return {
                    chain: chainKey as SavingsChainKey,
                    shares: shares.toString(),
                    currentValue: currentValue.toString(),
                };
            } catch (error) {
                console.error(`[Savings Positions] Error fetching ${chainKey}:`, error);
                return null;
            }
        });

        const results = await Promise.all(positionPromises);

        // Filter out null results (chains with no position or errors)
        for (const result of results) {
            if (result !== null) {
                positions.push(result);
            }
        }

        console.log("[Savings Positions] Fetched:", {
            wallet: walletAddress,
            positionCount: positions.length,
        });

        return NextResponse.json<PositionsResponse>({
            positions,
        });
    } catch (error) {
        console.error("[Savings Positions] Error:", error);
        return NextResponse.json<PositionsResponse>(
            {
                positions: [],
                errorReason: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
