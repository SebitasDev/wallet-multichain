import {
    createPublicClient,
    createWalletClient,
    http,
    Address,
    encodeFunctionData
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BridgeStrategy, BridgeContext } from "./types";
import { SettleResponse, CrossChainConfig } from "@/app/facilitator/types";
import { FacilitatorChainKey } from "@/app/facilitator/config";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { executeCCTPBridge } from "./cctp";
import { getNearQuote, executeNearBridge } from "./near"; // Added import

const RELAYER_PRIVATE_KEY = (process.env.RELAYER_PRIVATE_KEY || process.env.FACILITATOR_PRIVATE_KEY) as `0x${string}`;


// EntryPoint Address (v0.7? Most 7702 demos use 0.7 or specific one. Let's assume standard V6/V7 or find out).
const ENTRY_POINT_ADDRESS = "0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108";


export class SmartAccountStrategy implements BridgeStrategy {
    name = "SmartAccount";

    canHandle(context: BridgeContext): boolean {
        const { sourceToken, paymentPayload } = context;
        const isUSDC = (sourceToken || "USDC").toUpperCase().includes("USDC");
        const is7702 = (paymentPayload as any)?.type === "7702";

        return !isUSDC || is7702;
    }

    async execute(context: BridgeContext): Promise<SettleResponse> {
        const { sourceChain, destChain, amount, recipient, sourceToken, paymentPayload } = context;

        if (!RELAYER_PRIVATE_KEY) {
            return { success: false, errorReason: "Relayer Private Key missing" };
        }

        const network = NETWORKS[sourceChain];
        if (!network || !network.evm) {
            return { success: false, errorReason: "Unsupported chain" };
        }

        const publicClient = createPublicClient({
            chain: network.evm.chain,
            transport: http()
        });

        const relayerAccount = privateKeyToAccount(RELAYER_PRIVATE_KEY);
        const walletClient = createWalletClient({
            account: relayerAccount,
            chain: network.evm.chain,
            transport: http()
        });

        // Extract Authorization
        const rawAuth = (paymentPayload as any).authorization;
        if (!rawAuth) {
            return { success: false, errorReason: "Missing Authorization for 7702 Relayer" };
        }

        // Extract UserOp
        const rawUserOp = (paymentPayload as any).userOp;
        if (!rawUserOp) {
            return { success: false, errorReason: "Missing UserOp for 7702 Relayer" };
        }

        console.log("[SmartAccountStrategy] Received rawUserOp:", JSON.stringify(rawUserOp, null, 2));

        const authorization = {
            ...rawAuth,
            chainId: BigInt(rawAuth.chainId),
            nonce: BigInt(rawAuth.nonce),
        };

        // Safer explicit deserialization for UserOp
        // We know which fields are BigInts in UserOperation
        // Fallback for defaults if fields are missing (e.g. if they are optional in frontend)
        const userOp = {
            sender: rawUserOp.sender,
            nonce: BigInt(rawUserOp.nonce || 0),
            initCode: rawUserOp.initCode || "0x",
            callData: rawUserOp.callData,
            callGasLimit: BigInt(rawUserOp.callGasLimit || 0),
            verificationGasLimit: BigInt(rawUserOp.verificationGasLimit || 0),
            preVerificationGas: BigInt(rawUserOp.preVerificationGas || 0),
            maxFeePerGas: BigInt(rawUserOp.maxFeePerGas || 0),
            maxPriorityFeePerGas: BigInt(rawUserOp.maxPriorityFeePerGas || 0),
            paymasterAndData: rawUserOp.paymasterAndData || "0x",
            signature: rawUserOp.signature || "0x"
        };


        // 2. Send HandlerOps Transaction
        // We act as the Bundler.
        // EntryPoint v0.7 uses PackedUserOperation

        // Helper to pack values
        const packUint128 = (high: bigint, low: bigint): `0x${string}` => {
            return `0x${((high << BigInt(128)) | low).toString(16).padStart(64, "0")}` as `0x${string}`;
        };

        const accountGasLimits = packUint128(userOp.verificationGasLimit, userOp.callGasLimit);
        const gasFees = packUint128(userOp.maxPriorityFeePerGas, userOp.maxFeePerGas);

        // ABI for EntryPoint v0.7 handleOps
        const handleOpsAbi = [{
            inputs: [
                {
                    components: [
                        { name: "sender", type: "address" },
                        { name: "nonce", type: "uint256" },
                        { name: "initCode", type: "bytes" },
                        { name: "callData", type: "bytes" },
                        { name: "accountGasLimits", type: "bytes32" }, // Packed
                        { name: "preVerificationGas", type: "uint256" },
                        { name: "gasFees", type: "bytes32" }, // Packed
                        { name: "paymasterAndData", type: "bytes" },
                        { name: "signature", type: "bytes" }
                    ],
                    name: "ops",
                    type: "tuple[]"
                },
                { name: "beneficiary", type: "address" }
            ],
            name: "handleOps",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function"
        }] as const;

        // Construct the `handleOps` calldata with PackedUserOp
        const ops = [{
            sender: userOp.sender,
            nonce: userOp.nonce,
            initCode: userOp.initCode || "0x",
            callData: userOp.callData,
            accountGasLimits: accountGasLimits,
            preVerificationGas: userOp.preVerificationGas,
            gasFees: gasFees,
            paymasterAndData: userOp.paymasterAndData || "0x",
            signature: userOp.signature
        }];

        const handleOpsData = encodeFunctionData({
            abi: handleOpsAbi,
            functionName: "handleOps",
            args: [ops, relayerAccount.address]
        });

        try {
            // [Fix] Manually manage nonce to avoid race conditions when skipping receipt wait
            const currentNonce = await publicClient.getTransactionCount({
                address: relayerAccount.address,
                // blockTag: 'pending' // pending tag can be unstable on some RPCs, prefer explicitly tracking if possible.
                // But since we are stateless per request, pending is best effort.
            });
            let nonceTracker = currentNonce;

            const hash = await walletClient.sendTransaction({
                chain: null,
                to: ENTRY_POINT_ADDRESS, // Send to EntryPoint
                data: handleOpsData,
                gas: BigInt(1200000), // [FIX] 1.2M to cover 1M UserOp + Overhead
                value: BigInt(0),
                nonce: nonceTracker++, // Use and Increment
                authorizationList: [authorization] // Attach 7702 Auth!
            });

            console.log(`[Relayer] 7702 UserOp Sent: ${hash}`);

            // [Modified Strategy] Fire & Forget UserOp Validation

            console.log("[SmartAccountStrategy] Waiting for 7702 Hub Receipt...");
            await publicClient.waitForTransactionReceipt({ hash });
            console.log("[SmartAccountStrategy] 7702 UserOp Confirmed.");



            // 4. Same Chain Settlement (Facilitator -> Recipient)
            // [FIX] We MUST settle the funds (Facilitator -> Recipient) for Same Chain transfers.
            // AND we must execute this BEFORE attempting any Cross-Chain logic (NEAR/CCTP) to prevent accidental bridge invocation.
            // [UPDATE] Only short-circuit if it's a SAME TOKEN transfer. If it is a SWAP (USDT -> USDC), we let it fall through to Bridge/Solver.
            if (sourceChain === destChain && sourceToken === context.destToken) {
                console.log("[SmartAccountStrategy] Executing Same-Chain Settlement (Facilitator -> Recipient)...");

                const facilitatorNetworkConfig = NETWORKS[sourceChain]; // Reuse network
                // Reuse network definition
                const tokenInfo = facilitatorNetworkConfig.assets.find(a => a.name === sourceToken);
                if (!tokenInfo) throw new Error("Token info not found for settlement");

                const isDev = process.env.NEXT_PUBLIC_ENVIROMENT === "development" || process.env.NODE_ENV === "development";
                const feeValue = isDev ? 0 : 0.02; // Fee 0 in Dev
                const decimals = tokenInfo.decimals;
                const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));
                const feeBigInt = BigInt(Math.floor(feeValue * 10 ** decimals));
                const netAmount = amountBigInt - feeBigInt;

                if (netAmount <= 0) throw new Error("Amount too small to cover fees");

                let settleHash;
                const isNative = tokenInfo.address === "0x0000000000000000000000000000000000000000";

                if (isNative) {
                    settleHash = await walletClient.sendTransaction({
                        to: recipient as Address,
                        value: netAmount,
                        chain: network.evm.chain,
                        nonce: nonceTracker++ // Increment
                    });
                } else {
                    settleHash = await walletClient.writeContract({
                        address: tokenInfo.address as Address,
                        abi: [
                            {
                                constant: false,
                                inputs: [{ name: "_to", type: "address" }, { name: "_value", type: "uint256" }],
                                name: "transfer",
                                outputs: [{ name: "", type: "bool" }],
                                type: "function"
                            }
                        ], // standard ERC20
                        functionName: 'transfer',
                        args: [recipient as Address, netAmount],
                        chain: network.evm.chain,
                        nonce: nonceTracker++ // Increment
                    });
                }

                console.log(`[SmartAccountStrategy] Same-Chain Settle Hash: ${settleHash}`);

                return {
                    success: true,
                    transactionHash: hash, // Return the UserOp hash as the primary interaction
                    netAmount: (parseFloat(amount) - feeValue).toString(),
                    fee: feeValue.toString()
                };
            }


            // 3. Trigger Cross-Chain Logic

            // Priority 1: CCTP (Circle)
            // Conditions: Source & Dest support CCTP, Token is USDC (or unspecified/default)
            const destConfig = NETWORKS[destChain];
            const sourceCCTP = network.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;
            const destCCTP = destConfig?.crossChainInformation?.circleInformation?.cCTPInformation?.supportCCTP;
            const isUSDC = (sourceToken === "USDC" || !sourceToken); // Default to USDC if undefined

            if (sourceCCTP && destCCTP && isUSDC) {
                console.log("[SmartAccountStrategy] Route Selected: CCTP (Circle)");

                const destinationDomain = destConfig.crossChainInformation?.circleInformation?.cCTPInformation?.domain;
                if (destinationDomain === undefined) {
                    return { success: false, errorReason: "Destination chain CCTP domain missing" };
                }

                const crossChainConfig: CrossChainConfig = {
                    destinationChain: destChain as FacilitatorChainKey,
                    destinationDomain: destinationDomain,
                    mintRecipient: recipient as Address
                };

                return await executeCCTPBridge(
                    sourceChain as FacilitatorChainKey,
                    amount,
                    crossChainConfig,
                    recipient as Address,
                    hash,
                    userOp.sender
                );
            }

            // Priority 2: Reference Bridge (NEAR / 1-Click)
            // Conditions: Source & Dest support Near Intents
            const sourceNear = network.crossChainInformation?.nearIntentInformation?.support;
            const destNear = destConfig?.crossChainInformation?.nearIntentInformation?.support;

            // Strategy: Attempt to Quote. If successful, Execute.
            console.log("[SmartAccountStrategy] Attempting Reference Bridge (NEAR/1-Click)...");

            try {
                // 1. Get Quote (to find Deposit Address)
                const { quote, depositAddress, amountAtomicTotal, amountAtomicNet } = await getNearQuote(
                    sourceChain,
                    destChain,
                    amount,
                    context.destToken,
                    context.sourceToken,
                    recipient,
                    userOp.sender
                );

                console.log("[SmartAccountStrategy] Quote Received. Executing Bridge...");

                // 2. Execute Bridge Transfer
                return await executeNearBridge(
                    sourceChain,
                    destChain,
                    amount,
                    recipient as string,
                    hash, // Using UserOp hash as the "Pull Hash" reference
                    quote,
                    depositAddress,
                    amountAtomicTotal,
                    amountAtomicNet,
                    context.sourceToken
                );

            } catch (e: any) {
                console.warn("[SmartAccountStrategy] NEAR Bridge Attempt Failed (or Not Supported):", e.message);
                if (sourceChain !== destChain) {
                    console.error("[SmartAccountStrategy] Critical Bridge Error Trace:", e);
                }
            }

            console.log("[SmartAccountStrategy] No suitable bridge route found for", sourceChain, "->", destChain);

            // [FIX] If Cross-Chain and no bridge executed, this is a FAILURE, not success.
            // Since we handled Same-Chain above, reaching here implies no strategy matched.
            return {
                success: false,
                errorReason: `No bridge strategy found for ${sourceChain} -> ${destChain} (${sourceToken} -> ${context.destToken})`
            };

        } catch (e: any) {
            console.error("[Relayer] 7702 Error:", e);
            return {
                success: false,
                errorReason: e.message || "Relayer Execution Failed"
            };
        }
    }
}
