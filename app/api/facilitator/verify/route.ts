import { NextRequest, NextResponse } from "next/server";
import { recoverTypedDataAddress, createPublicClient, http, getContract } from "viem";
import {
    FACILITATOR_NETWORKS,
    FacilitatorChainKey,
    calculateFee
} from "@/app/facilitator/config";
import { TransferWithAuthorizationTypes, usdcErc3009Abi } from "@/app/facilitator/usdcErc3009Abi";
import { VerifyRequest, VerifyResponse } from "@/app/facilitator/types";

/**
 * POST /api/facilitator/verify
 *
 * Verifies an ERC-3009 authorization signature before settlement.
 * Checks signature validity, amount sufficiency, time window, and nonce status.
 */
export async function POST(request: NextRequest) {
    try {
        const body: VerifyRequest = await request.json();
        const { paymentPayload, sourceChain, expectedAmount } = body;

        // Validate chain support
        const networkConfig = FACILITATOR_NETWORKS[sourceChain as FacilitatorChainKey];
        if (!networkConfig) {
            return NextResponse.json<VerifyResponse>({
                isValid: false,
                invalidReason: `Unsupported chain: ${sourceChain}`
            }, { status: 400 });
        }

        const { authorization, signature } = paymentPayload;

        // Create public client for on-chain verification
        const publicClient = createPublicClient({
            chain: networkConfig.chain,
            transport: http(networkConfig.rpcUrl)
        });

        // Get USDC contract info for EIP-712 domain
        const usdcContract = getContract({
            address: networkConfig.usdc,
            abi: usdcErc3009Abi,
            client: publicClient
        });

        const [usdcName, usdcVersion] = await Promise.all([
            usdcContract.read.name(),
            usdcContract.read.version()
        ]);

        // Build EIP-712 domain
        const domain = {
            name: usdcName as string,
            version: usdcVersion as string,
            chainId: networkConfig.chainId,
            verifyingContract: networkConfig.usdc
        };

        // Recover signer address from signature
        const recoveredAddress = await recoverTypedDataAddress({
            domain,
            types: TransferWithAuthorizationTypes,
            primaryType: "TransferWithAuthorization",
            message: {
                from: authorization.from,
                to: authorization.to,
                value: BigInt(authorization.value),
                validAfter: BigInt(authorization.validAfter),
                validBefore: BigInt(authorization.validBefore),
                nonce: authorization.nonce
            },
            signature
        });

        // Validate signature matches claimed sender
        const isSignatureValid = recoveredAddress.toLowerCase() === authorization.from.toLowerCase();

        // Validate amount covers expected + fee
        const expectedAmountBigInt = BigInt(expectedAmount);
        const fee = calculateFee();
        const requiredTotal = expectedAmountBigInt + fee;
        const signedAmount = BigInt(authorization.value);
        const isAmountSufficient = signedAmount >= requiredTotal;

        // Validate time window
        const now = BigInt(Math.floor(Date.now() / 1000));
        const isTimeValid =
            BigInt(authorization.validAfter) <= now &&
            BigInt(authorization.validBefore) > now;

        // Check nonce hasn't been used
        const isNonceUsed = await usdcContract.read.authorizationState([
            authorization.from,
            authorization.nonce
        ]);

        const isValid = isSignatureValid && isAmountSufficient && isTimeValid && !isNonceUsed;

        // Determine failure reason if invalid
        let invalidReason: string | undefined;
        if (!isSignatureValid) {
            invalidReason = "Invalid signature - recovered address does not match";
        } else if (!isAmountSufficient) {
            invalidReason = `Insufficient amount. Required: ${requiredTotal.toString()}, Signed: ${signedAmount.toString()}`;
        } else if (!isTimeValid) {
            invalidReason = "Authorization time window invalid";
        } else if (isNonceUsed) {
            invalidReason = "Nonce already used";
        }

        return NextResponse.json<VerifyResponse>({
            isValid,
            payer: recoveredAddress,
            invalidReason,
            fee: fee.toString(),
            netAmount: expectedAmount
        });

    } catch (error) {
        console.error("Verify error:", error);
        return NextResponse.json<VerifyResponse>({
            isValid: false,
            invalidReason: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
