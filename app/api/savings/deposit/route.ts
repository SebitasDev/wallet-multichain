import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, maxUint256 } from "viem";
import { Address } from "abitype";
import {
    getSavingsChainConfig,
    isSavingsChain,
    SavingsChainKey,
} from "@/app/savings/config";
import { erc4626VaultAbi, erc20Abi } from "@/app/savings/vaultAbi";
import { DepositRequest, DepositResponse } from "@/app/savings/types";
import { createAccount } from "@/app/cross-chain-core/clientFactory";
import { createPaymaster } from "@/app/cross-chain-core/paymasterFactory";
import { bundlerClientFactory } from "@/app/cross-chain-core/bundlerClientFactory";
import { createAuthorization } from "@/app/cross-chain-core/autorizationFactory";

/**
 * POST /api/savings/deposit
 *
 * Deposits USDC into Spark.fi sUSDC vault using Account Abstraction with paymaster.
 *
 * Flow:
 * 1. Validate inputs
 * 2. Create smart account
 * 3. Setup paymaster (gas sponsored via USDC)
 * 4. Send user operation with approve + deposit calls
 * 5. Return transaction hash and shares received
 */
export async function POST(request: NextRequest) {
    try {
        const body: DepositRequest = await request.json();
        const { chain, amount, walletAddress, privateKey } = body;

        // Validate required fields
        if (!chain || !amount || !walletAddress || !privateKey) {
            return NextResponse.json<DepositResponse>(
                {
                    success: false,
                    errorReason: "Missing required fields: chain, amount, walletAddress, privateKey",
                },
                { status: 400 }
            );
        }

        // Validate chain
        if (!isSavingsChain(chain)) {
            return NextResponse.json<DepositResponse>(
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
            return NextResponse.json<DepositResponse>(
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
            return NextResponse.json<DepositResponse>(
                {
                    success: false,
                    errorReason: "Private key does not match wallet address",
                },
                { status: 401 }
            );
        }

        console.log("[Savings Deposit] Smart account created:", smartAccount.owner.address);

        // Check USDC balance of user wallet
        const usdcBalance = (await publicClient.readContract({
            address: chainConfig.usdc,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [walletAddress as Address],
        })) as bigint;

        console.log("[Savings Deposit] USDC balance check:", {
            wallet: walletAddress,
            balance: usdcBalance.toString(),
            required: amountBigInt.toString(),
            chain,
        });

        if (usdcBalance < amountBigInt) {
            return NextResponse.json<DepositResponse>(
                {
                    success: false,
                    errorReason: `Insufficient USDC balance. Has: ${usdcBalance.toString()}, needs: ${amountBigInt.toString()}`,
                },
                { status: 400 }
            );
        }

        // Check current USDC allowance to vault
        const currentAllowance = (await publicClient.readContract({
            address: chainConfig.usdc,
            abi: erc20Abi,
            functionName: "allowance",
            args: [walletAddress as Address, chainConfig.sUsdcVault],
        })) as bigint;

        console.log("[Savings Deposit] Allowance check:", {
            wallet: walletAddress,
            vault: chainConfig.sUsdcVault,
            currentAllowance: currentAllowance.toString(),
            required: amountBigInt.toString(),
        });

        // Check max deposit
        const maxDeposit = (await publicClient.readContract({
            address: chainConfig.sUsdcVault,
            abi: erc4626VaultAbi,
            functionName: "maxDeposit",
            args: [walletAddress as Address],
        })) as bigint;

        if (maxDeposit < amountBigInt) {
            return NextResponse.json<DepositResponse>(
                {
                    success: false,
                    errorReason: `Deposit exceeds vault limit. Max: ${maxDeposit.toString()}`,
                },
                { status: 400 }
            );
        }

        // Preview deposit to get expected shares
        const expectedShares = (await publicClient.readContract({
            address: chainConfig.sUsdcVault,
            abi: erc4626VaultAbi,
            functionName: "previewDeposit",
            args: [amountBigInt],
        })) as bigint;

        console.log("[Savings Deposit] Preview:", {
            amount: amountBigInt.toString(),
            expectedShares: expectedShares.toString(),
        });

        // Setup paymaster (gas sponsored via USDC permit)
        const paymasterData = await createPaymaster.getPaymasterData(
            chainConfig.usdc,
            smartAccount.account,
            publicClient
        );

        console.log("[Savings Deposit] Paymaster configured");

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

        console.log("[Savings Deposit] Authorization created");

        // Build calls array
        const calls: any[] = [];

        // Add approve call if needed
        if (currentAllowance < amountBigInt) {
            console.log("[Savings Deposit] Adding approve call");
            calls.push({
                to: chainConfig.usdc,
                abi: erc20Abi,
                functionName: "approve",
                args: [chainConfig.sUsdcVault, maxUint256],
            });
        }

        // Add deposit call
        calls.push({
            to: chainConfig.sUsdcVault,
            abi: erc4626VaultAbi,
            functionName: "deposit",
            args: [amountBigInt, walletAddress as Address],
        });

        console.log("[Savings Deposit] Sending user operation with", calls.length, "calls");

        // Send user operation
        const userOpHash = await bundlerClient.sendUserOperation({
            account: smartAccount.account,
            calls,
            authorization,
        });

        console.log("[Savings Deposit] UserOp hash:", userOpHash);

        // Wait for receipt
        const receipt = await bundlerClient.waitForUserOperationReceipt({
            hash: userOpHash,
        });

        console.log("[Savings Deposit] Transaction confirmed:", receipt.receipt.transactionHash);

        if (!receipt.success) {
            return NextResponse.json<DepositResponse>(
                {
                    success: false,
                    transactionHash: receipt.receipt.transactionHash,
                    errorReason: "Deposit transaction failed",
                },
                { status: 500 }
            );
        }

        // Get actual shares received
        const sharesBalance = (await publicClient.readContract({
            address: chainConfig.sUsdcVault,
            abi: erc4626VaultAbi,
            functionName: "balanceOf",
            args: [walletAddress as Address],
        })) as bigint;

        console.log("[Savings Deposit] Success:", {
            transactionHash: receipt.receipt.transactionHash,
            shares: sharesBalance.toString(),
        });

        return NextResponse.json<DepositResponse>({
            success: true,
            transactionHash: receipt.receipt.transactionHash,
            shares: expectedShares.toString(),
        });
    } catch (error) {
        console.error("[Savings Deposit] Error:", error);
        return NextResponse.json<DepositResponse>(
            {
                success: false,
                errorReason: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
