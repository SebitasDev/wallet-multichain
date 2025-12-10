import { NextRequest, NextResponse } from "next/server";

const FACILITATOR_URL = "https://x402.org/facilitator";
const USDC_BASE = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paymentHeader, recipientAddress, amount } = body;

        console.log("=== x402 Payment Request ===");
        console.log("paymentHeader:", paymentHeader);
        console.log("recipientAddress:", recipientAddress);
        console.log("amount:", amount);

        if (!paymentHeader || !recipientAddress || !amount) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Decodificar el payment header para obtener el paymentPayload
        let paymentPayload;
        try {
            paymentPayload = JSON.parse(atob(paymentHeader));
            console.log("Decoded payment payload:", JSON.stringify(paymentPayload, null, 2));
        } catch (e) {
            console.log("Could not decode payment header:", e);
            return NextResponse.json(
                { error: "Invalid payment header format" },
                { status: 400 }
            );
        }

        // Payment requirements que coinciden con lo que el cliente firmó
        const paymentRequirements = {
            scheme: "exact",
            network: "base-sepolia",
            maxAmountRequired: amount,
            resource: "https://x402-payment.local",
            description: "x402 Payment",
            mimeType: "application/json",
            payTo: recipientAddress,
            maxTimeoutSeconds: 300,
            asset: USDC_BASE,
            extra: {
                name: "USDC",
                version: "2"
            }
        };

        console.log("Payment requirements:", JSON.stringify(paymentRequirements, null, 2));

        // Primero verificar el pago con el facilitator
        // El facilitator espera paymentPayload (objeto), no paymentHeader (base64 string)
        const verifyResponse = await fetch(`${FACILITATOR_URL}/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                x402Version: paymentPayload.x402Version,
                paymentPayload,
                paymentRequirements,
            }),
        });

        const verifyResult = await verifyResponse.json();
        console.log("Verify response status:", verifyResponse.status);
        console.log("Verify result:", JSON.stringify(verifyResult, null, 2));

        if (!verifyResponse.ok || !verifyResult.isValid) {
            return NextResponse.json(
                {
                    error: "Payment verification failed",
                    reason: verifyResult.invalidReason || "Unknown error",
                    details: verifyResult
                },
                { status: 400 }
            );
        }

        // Si la verificación es exitosa, liquidar el pago
        const settleResponse = await fetch(`${FACILITATOR_URL}/settle`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                x402Version: paymentPayload.x402Version,
                paymentPayload,
                paymentRequirements,
            }),
        });

        const settleResult = await settleResponse.json();
        console.log("Settle response status:", settleResponse.status);
        console.log("Settle result:", JSON.stringify(settleResult, null, 2));

        if (!settleResponse.ok || !settleResult.success) {
            return NextResponse.json(
                {
                    error: "Payment settlement failed",
                    reason: settleResult.errorReason || "Unknown error",
                    details: settleResult
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            transaction: settleResult.transaction,
            network: settleResult.network,
            payer: settleResult.payer,
        });

    } catch (error) {
        console.error("Error processing x402 payment:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
