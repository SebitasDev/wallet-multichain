import { NextRequest, NextResponse } from "next/server";
import { recoverTypedDataAddress, createPublicClient, http, getContract } from "viem";
import {
    FACILITATOR_NETWORKS,
    FacilitatorChainKey,
    calculateFee
} from "@/app/facilitator/config";
import { TransferWithAuthorizationTypes, usdcErc3009Abi } from "@/app/facilitator/usdcErc3009Abi";
import { VerifyRequest, VerifyResponse } from "@/app/facilitator/types";

export async function POST(request: NextRequest) {
    try {
        const body: VerifyRequest = await request.json();
        const { paymentPayload, sourceChain, expectedAmount } = body;

        console.log("=== Facilitator Verify Request ===");
        console.log("sourceChain:", sourceChain);
        console.log("expectedAmount:", expectedAmount);

        // Validar que la chain existe
        const networkConfig = FACILITATOR_NETWORKS[sourceChain as FacilitatorChainKey];
        if (!networkConfig) {
            return NextResponse.json<VerifyResponse>({
                isValid: false,
                invalidReason: `Unsupported chain: ${sourceChain}`
            }, { status: 400 });
        }

        const { authorization, signature } = paymentPayload;

        // Crear cliente público para verificar
        const publicClient = createPublicClient({
            chain: networkConfig.chain,
            transport: http(networkConfig.rpcUrl)
        });

        // Obtener info del contrato USDC para el dominio EIP-712
        const usdcContract = getContract({
            address: networkConfig.usdc,
            abi: usdcErc3009Abi,
            client: publicClient
        });

        const [usdcName, usdcVersion] = await Promise.all([
            usdcContract.read.name(),
            usdcContract.read.version()
        ]);

        // Construir dominio EIP-712
        const domain = {
            name: usdcName as string,
            version: usdcVersion as string,
            chainId: networkConfig.chainId,
            verifyingContract: networkConfig.usdc
        };

        // Recuperar la dirección del firmante
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

        console.log("Recovered address:", recoveredAddress);
        console.log("Expected from:", authorization.from);

        // Validaciones
        const isSignatureValid = recoveredAddress.toLowerCase() === authorization.from.toLowerCase();

        // Verificar que el monto firmado sea suficiente (amount + fee)
        const expectedAmountBigInt = BigInt(expectedAmount);
        const fee = calculateFee();
        const requiredTotal = expectedAmountBigInt + fee;
        const signedAmount = BigInt(authorization.value);

        const isAmountSufficient = signedAmount >= requiredTotal;

        // Verificar tiempos
        const now = BigInt(Math.floor(Date.now() / 1000));
        const isTimeValid =
            BigInt(authorization.validAfter) <= now &&
            BigInt(authorization.validBefore) > now;

        // Verificar que el nonce no haya sido usado
        const isNonceUsed = await usdcContract.read.authorizationState([
            authorization.from,
            authorization.nonce
        ]);

        const isValid = isSignatureValid && isAmountSufficient && isTimeValid && !isNonceUsed;

        let invalidReason: string | undefined;
        if (!isSignatureValid) {
            invalidReason = "Invalid signature - recovered address does not match";
        } else if (!isAmountSufficient) {
            invalidReason = `Insufficient amount. Required: ${requiredTotal.toString()} (${expectedAmount} + ${fee.toString()} fee), Signed: ${signedAmount.toString()}`;
        } else if (!isTimeValid) {
            invalidReason = "Authorization time window invalid";
        } else if (isNonceUsed) {
            invalidReason = "Nonce already used";
        }

        console.log("Verification result:", { isValid, invalidReason });

        return NextResponse.json<VerifyResponse>({
            isValid,
            payer: recoveredAddress,
            invalidReason,
            fee: fee.toString(),
            netAmount: expectedAmount
        });

    } catch (error) {
        console.error("Error in verify:", error);
        return NextResponse.json<VerifyResponse>({
            isValid: false,
            invalidReason: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
