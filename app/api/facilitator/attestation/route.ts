import { NextRequest, NextResponse } from "next/server";
import { createRetrieveAttestation } from "@/app/cross-chain-core/retrieveAttestationFactory";
import { FACILITATOR_NETWORKS, FacilitatorChainKey } from "@/app/facilitator/config";

interface AttestationRequest {
    transactionHash: `0x${string}`;
    sourceChain: FacilitatorChainKey;
}

interface AttestationResponse {
    status: "pending" | "complete" | "error";
    message?: `0x${string}`;
    attestation?: `0x${string}`;
    error?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: AttestationRequest = await request.json();
        const { transactionHash, sourceChain } = body;

        const networkConfig = FACILITATOR_NETWORKS[sourceChain];
        if (!networkConfig) {
            return NextResponse.json<AttestationResponse>({
                status: "error",
                error: `Unsupported chain: ${sourceChain}`
            }, { status: 400 });
        }

        console.log("Fetching attestation for:", transactionHash, "on domain:", networkConfig.domain);

        try {
            const result = await createRetrieveAttestation(
                transactionHash,
                networkConfig.domain.toString(),
                30000 // 30 segundos timeout para polling
            );

            return NextResponse.json<AttestationResponse>({
                status: "complete",
                message: result.message,
                attestation: result.attestation
            });

        } catch (timeoutError) {
            // Si hace timeout, significa que aún no está listo
            return NextResponse.json<AttestationResponse>({
                status: "pending"
            });
        }

    } catch (error) {
        console.error("Error fetching attestation:", error);
        return NextResponse.json<AttestationResponse>({
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
