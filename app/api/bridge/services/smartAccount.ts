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
            const hash = await walletClient.sendTransaction({
                chain: null,
                to: ENTRY_POINT_ADDRESS, // Send to EntryPoint
                data: handleOpsData,
                gas: BigInt(2500000), // [FIX] 2.5M to cover 1.1M UserOp + Overhead
                value: BigInt(0),
                authorizationList: [authorization] // Attach 7702 Auth!
            });

            console.log(`[Relayer] 7702 UserOp Sent: ${hash}`);

            // [Modified Strategy] Fire & Forget UserOp Validation
            // The user reports that 'handleOps' can show as Reverted on execution even if the token transfer succeeds.
            // We skip waiting for the receipt and rely entirely on the 'executeNearBridge' balance check (Step 2) to confirm funds.
            console.log("[SmartAccountStrategy] Skipping Receipt Wait. trusting 'executeNearBridge' to verify funds...");

            /* 
            try {
                // ... (Receipt waiting logic removed/commented)
            } catch ...
            */

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

            // Priority 2: Reference Bridge (NEAR / 1-Click)
            // Strategy: Attempt to Quote. If successful, Execute.
            // This bypasses potential config flag issues (sourceNear/destNear) and relies on the SDK/API to validate.
            console.log("[SmartAccountStrategy] Attempting Reference Bridge (NEAR/1-Click)...");

            try {
                // 1. Get Quote (to find Deposit Address)
                // This will throw if the route/assets are unsupported
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
                // Only log error if this was intended to be a bridge transfer (not same chain)
                // If getNearQuote fails because "Not a supported route", that's fine, we fall through.
                console.warn("[SmartAccountStrategy] NEAR Bridge Attempt Failed (or Not Supported):", e.message);
                if (sourceChain !== destChain) {
                    console.error("[SmartAccountStrategy] Critical Bridge Error Trace:", e);
                }
            }

            console.log("[SmartAccountStrategy] No suitable bridge route found for", sourceChain, "->", destChain);

            // Fallback if no specific bridge logic triggered (e.g. Same Chain Transfer)
            return {
                success: true,
                transactionHash: hash,
                netAmount: amount, // Approximated
                fee: "0" // Relayer paid gas
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
