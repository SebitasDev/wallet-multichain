import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, hexToSignature } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { usdcErc3009Abi } from "@/app/facilitator/evm/usdcErc3009Abi";
import { FacilitatorPaymentPayload } from "@/app/facilitator/types";

// Prefer RELAYER_PRIVATE_KEY for backend operations
const RELAYER_KEY = (process.env.RELAYER_PRIVATE_KEY || process.env.NEXT_PUBLIC_FACILITATOR_PRIVATE_KEY || "0x1de32b06cfc2235dbb8655edae07681f051d6eedb38640dcc898af50ebef4bb8") as `0x${string}`;

export async function POST(request: NextRequest) {
    try {
        if (!RELAYER_KEY) {
            return NextResponse.json({
                success: false,
                errorReason: "Server Config Error: RELAYER_PRIVATE_KEY missing"
            }, { status: 500 });
        }

        const body = await request.json();
        const { paymentPayload, sourceChain, amount, recipient } = body;

        if (!paymentPayload || !sourceChain) {
            return NextResponse.json({ success: false, errorReason: "Missing payload" }, { status: 400 });
        }

        const { authorization, signature } = paymentPayload as FacilitatorPaymentPayload;

        const network = NETWORKS[sourceChain as ChainKey];
        if (!network || !network.evm) {
            return NextResponse.json({ success: false, errorReason: "Invalid Chain" }, { status: 400 });
        }

        console.log(`[Gasless API] Processing Transfer on ${sourceChain}`);

        // 1. Setup Client
        const account = privateKeyToAccount(RELAYER_KEY);
        const client = createWalletClient({
            account,
            chain: network.evm.chain,
            transport: http(network.evm.rpcUrl)
        });
        const publicClient = createPublicClient({
            chain: network.evm.chain,
            transport: http(network.evm.rpcUrl)
        });

        // 2. Decompose Signature (r, s, v)
        const sig = hexToSignature(signature);

        // 3. Execute transferWithAuthorization
        // usdc.transferWithAuthorization(from, to, value, validAfter, validBefore, nonce, v, r, s)

        console.log(`[Gasless API] Submitting Tx (Payer: ${account.address})...`);

        // Find USDC address robustly
        const usdcAsset = network.assets.find(a => a.name === "USDC");
        const usdcAddress = usdcAsset?.address;

        if (!usdcAddress) {
            throw new Error(`USDC not found on chain ${sourceChain}`);
        }

        // Optimizing/Manually setting gas to fit in small balance
        const gasPrice = await publicClient.getGasPrice();
        // Base is very cheap, often < 0.1 gwei. 
        // We'll use the fetched gas price + small tip to be precise.

        const hash = await client.writeContract({
            address: usdcAddress as `0x${string}`,
            abi: usdcErc3009Abi,
            functionName: "transferWithAuthorization",
            args: [
                authorization.from,
                authorization.to,
                BigInt(authorization.value),
                BigInt(authorization.validAfter),
                BigInt(authorization.validBefore),
                authorization.nonce,
                Number(sig.v),
                sig.r,
                sig.s
            ],
            // Force efficient gas usage
            // standard estimation might be too aggressive on 'value' or buffer
            // We rely on standard estimation for 'gas limit' but constrain the 'price'
            maxFeePerGas: gasPrice + BigInt(100), // minimal buffer
            maxPriorityFeePerGas: BigInt(100), // minimal tip
            gas: BigInt(130000) // Force gas limit to bypass simulation failure (revert) which causes "Insufficient Funds" due to high estimate
        });

        console.log(`[Gasless API] Tx Hash: ${hash}`);

        return NextResponse.json({
            success: true,
            transactionHash: hash
        });

    } catch (e: any) {
        console.error("[Gasless API] Error:", e);
        // Return JSON error to prevent "Unexpected token <" on client
        return NextResponse.json({
            success: false,
            errorReason: e.message || "Gasless Execution Failed"
        }, { status: 500 });
    }
}
