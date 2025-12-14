import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { Address } from "abitype";
import {
    getSavingsChainConfig,
    isSavingsChain,
    SavingsChainKey,
} from "@/app/savings/config";
import { erc4626VaultAbi } from "@/app/savings/vaultAbi";
import { WithdrawRequest, WithdrawResponse } from "@/app/savings/types";
import { createAccount } from "@/app/cross-chain-core/clientFactory";
import { createPaymaster } from "@/app/cross-chain-core/paymasterFactory";
import { bundlerClientFactory } from "@/app/cross-chain-core/bundlerClientFactory";
import { createAuthorization } from "@/app/cross-chain-core/autorizationFactory";

/**
 * POST /api/savings/withdraw
 *
 * Withdraws USDC from Spark.fi sUSDC vault using Account Abstraction with paymaster.
 *
 * Flow:
 * 1. Validate inputs
 * 2. Create smart account
 * 3. Setup paymaster (gas sponsored via USDC)
 * 4. Send user operation with withdraw call
 * 5. Return transaction hash and USDC amount received
 */
export async function POST(request: NextRequest) {
    try {
        const body: WithdrawRequest = await request.json();
        const { chain, amount, walletAddress, privateKey } = body;

        // Validate required fields
        if (!chain || !amount || !walletAddress || !privateKey) {
            return NextResponse.json<WithdrawResponse>(
                {
                    success: false,
                    errorReason: "Missing required fields: chain, amount, walletAddress, privateKey",
                },
                { status: 400 }
            );
        }

        // Validate chain
        if (!isSavingsChain(chain)) {
            return NextResponse.json<WithdrawResponse>(
                {
                    success: false,
                    errorReason: `Unsupported chain: ${chain}. Supported: Base, Optimism, Arbitrum, Unichain`,
                },
                { status: 400 }
            );
        }

        // Validate amount
        const amountBigInt = BigInt(amount);
        if (amountBigInt <= BigInt(0)) {
            return NextResponse.json<WithdrawResponse>(
                {
                    success: false,
                    errorReason: "Amount must be greater than 0",
                },
                { status: 400 }
            );
        }

        // Get chain configuration
        const chainConfig = getSavingsChainConfig(chain as SavingsChainKey);

        // Create public client
        const publicClient = createPublicClient({
            chain: chainConfig.chain,
            transport: http(chainConfig.rpcUrl),
        });

        // Create smart account from private key
        const smartAccount = await createAccount(publicClient, privateKey);

        // Verify private key matches wallet address
        if (smartAccount.owner.address.toLowerCase() !== walletAddress.toLowerCase()) {
            return NextResponse.json<WithdrawResponse>(
                {
                    success: false,
                    errorReason: "Private key does not match wallet address",
                },
                { status: 401 }
            );
        }

        console.log("[Savings Withdraw] Smart account created:", smartAccount.owner.address);

        // Check shares balance of user wallet
        const sharesBalance = (await publicClient.readContract({
            address: chainConfig.sUsdcVault,
            abi: erc4626VaultAbi,
            functionName: "balanceOf",
            args: [walletAddress as Address],
        })) as bigint;

        console.log("[Savings Withdraw] Shares balance check:", {
            wallet: walletAddress,
            sharesBalance: sharesBalance.toString(),
            chain,
        });

        if (sharesBalance === BigInt(0)) {
            return NextResponse.json<WithdrawResponse>(
                {
                    success: false,
                    errorReason: "No shares to withdraw",
                },
                { status: 400 }
            );
        }

        // Check max withdrawable (limited by vault liquidity)
        const maxWithdraw = (await publicClient.readContract({
            address: chainConfig.sUsdcVault,
            abi: erc4626VaultAbi,
            functionName: "maxWithdraw",
            args: [walletAddress as Address],
        })) as bigint;

        console.log("[Savings Withdraw] Max withdraw check:", {
            wallet: walletAddress,
            maxWithdraw: maxWithdraw.toString(),
            requested: amountBigInt.toString(),
        });

        if (maxWithdraw < amountBigInt) {
            return NextResponse.json<WithdrawResponse>(
                {
                    success: false,
                    errorReason: `Insufficient liquidity. Max withdrawable: ${maxWithdraw.toString()}`,
                },
                { status: 400 }
            );
        }

        // Preview withdraw to get expected shares to burn
        const sharesToBurn = (await publicClient.readContract({
            address: chainConfig.sUsdcVault,
            abi: erc4626VaultAbi,
            functionName: "previewWithdraw",
            args: [amountBigInt],
        })) as bigint;

        console.log("[Savings Withdraw] Preview:", {
            amount: amountBigInt.toString(),
            sharesToBurn: sharesToBurn.toString(),
        });

        // Setup paymaster (gas sponsored via USDC permit)
        const paymasterData = await createPaymaster.getPaymasterData(
            chainConfig.usdc,
            smartAccount.account,
            publicClient
        );

        console.log("[Savings Withdraw] Paymaster configured");

        // Create bundler client with paymaster
        const bundlerClient = bundlerClientFactory({
            account: smartAccount.account,
            client: publicClient,
            paymaster: {
                getPaymasterData: async () => paymasterData,
            },
        });

        // Create authorization for 7702
        const authorization = await createAuthorization(
            smartAccount.owner,
            publicClient,
            smartAccount.account
        );

        console.log("[Savings Withdraw] Authorization created");

        // Build withdraw call
        // withdraw(assets, receiver, owner)
        const calls = [
            {
                to: chainConfig.sUsdcVault,
                abi: erc4626VaultAbi,
                functionName: "withdraw",
                args: [
                    amountBigInt,
                    walletAddress as Address, // receiver - user gets USDC
                    walletAddress as Address, // owner - user owns shares
                ],
            },
        ];

        console.log("[Savings Withdraw] Sending user operation");

        // Send user operation
        const userOpHash = await bundlerClient.sendUserOperation({
            account: smartAccount.account,
            calls,
            authorization,
        });

        console.log("[Savings Withdraw] UserOp hash:", userOpHash);

        // Wait for receipt
        const receipt = await bundlerClient.waitForUserOperationReceipt({
            hash: userOpHash,
        });

        console.log("[Savings Withdraw] Transaction confirmed:", receipt.receipt.transactionHash);

        if (!receipt.success) {
            return NextResponse.json<WithdrawResponse>(
                {
                    success: false,
                    transactionHash: receipt.receipt.transactionHash,
                    errorReason: "Withdraw transaction failed",
                },
                { status: 500 }
            );
        }

        console.log("[Savings Withdraw] Success:", {
            transactionHash: receipt.receipt.transactionHash,
            usdcAmount: amountBigInt.toString(),
        });

        return NextResponse.json<WithdrawResponse>({
            success: true,
            transactionHash: receipt.receipt.transactionHash,
            usdcAmount: amountBigInt.toString(),
        });
    } catch (error) {
        console.error("[Savings Withdraw] Error:", error);
        return NextResponse.json<WithdrawResponse>(
            {
                success: false,
                errorReason: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
