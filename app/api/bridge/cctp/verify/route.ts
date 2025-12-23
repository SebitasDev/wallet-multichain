
import { NextRequest, NextResponse } from "next/server";
import { NETWORKS, ChainKey } from "@/app/constants/chainsInformation";
import { recoverTypedDataAddress, hexToSignature } from "viem";

export async function POST(req: NextRequest) {
    try {
        const { paymentPayload, sourceChain, destinationChain, expectedAmount } = await req.json();

        console.log("🔹 Verifying CCTP Request:", { sourceChain, destinationChain, expectedAmount });

        // 1. Validate Chains
        const sourceConfig = NETWORKS[sourceChain as ChainKey];
        if (!sourceConfig) {
            return NextResponse.json({ isValid: false, invalidReason: "Invalid source chain" }, { status: 400 });
        }

        if (destinationChain) {
            const destConfig = NETWORKS[destinationChain as ChainKey];
            if (!destConfig) {
                return NextResponse.json({ isValid: false, invalidReason: "Invalid destination chain" }, { status: 400 });
            }
        }

        // 2. Format Data for EIP-712 Recovery
        const { authorization, signature, sourceChain: payloadChain, domainName, domainVersion } = paymentPayload;

        // Sanity Check: Payload chain should match requested source chain
        if (payloadChain !== sourceChain) {
            return NextResponse.json({ isValid: false, invalidReason: "Payload chain mismatch" }, { status: 400 });
        }

        const domain = {
            name: domainName || "USD Coin", // Fallback if missing, but should be there
            version: domainVersion || "2",
            chainId: sourceConfig.evm?.chain.id,
            verifyingContract: sourceConfig.assets.find(a => a.name === "USDC")?.address as `0x${string}`
        };

        const types = {
            TransferWithAuthorization: [
                { name: "from", type: "address" },
                { name: "to", type: "address" },
                { name: "value", type: "uint256" },
                { name: "validAfter", type: "uint256" },
                { name: "validBefore", type: "uint256" },
                { name: "nonce", type: "bytes32" },
            ],
        };

        const value = {
            from: authorization.from,
            to: authorization.to,
            value: BigInt(authorization.value),
            validAfter: BigInt(authorization.validAfter),
            validBefore: BigInt(authorization.validBefore),
            nonce: authorization.nonce,
        };

        // 3. Recover Signer
        const recoveredAddress = await recoverTypedDataAddress({
            domain,
            types,
            primaryType: "TransferWithAuthorization",
            message: value,
            signature: signature as `0x${string}`
        });

        const isSignatureValid = recoveredAddress.toLowerCase() === authorization.from.toLowerCase();

        if (!isSignatureValid) {
            console.error("❌ Signature invalid. Recovered:", recoveredAddress, "Expected:", authorization.from);
            return NextResponse.json({ isValid: false, invalidReason: "Invalid Signature" }, { status: 200 });
        }

        // 4. Validate Stats (Optional: Check balance, Check expiry)
        const now = Math.floor(Date.now() / 1000);
        if (Number(authorization.validBefore) < now) {
            return NextResponse.json({ isValid: false, invalidReason: "Signature Expired" }, { status: 200 });
        }

        if (expectedAmount && BigInt(authorization.value) < BigInt(expectedAmount)) {
            return NextResponse.json({ isValid: false, invalidReason: "Insufficient Authorized Amount" }, { status: 200 });
        }

        console.log("✅ Verification Successful");
        return NextResponse.json({ isValid: true });

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json({ isValid: false, invalidReason: "Internal Verification Error" }, { status: 500 });
    }
}
