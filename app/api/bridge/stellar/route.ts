import { NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import * as StellarSdk from "stellar-sdk";

const FACILITATOR_PRIVATE_KEY = process.env.FACILITATOR_PRIVATE_KEY as `0x${string}`;
const FACILITATOR_STELLAR_PRIVATE_KEY = process.env.FACILITATOR_STELLAR_PRIVATE_KEY;

export async function GET() {
    try {
        const response: any = {};

        // 1. Stellar Address
        if (FACILITATOR_STELLAR_PRIVATE_KEY) {
            try {
                const keypair = StellarSdk.Keypair.fromSecret(FACILITATOR_STELLAR_PRIVATE_KEY);
                response.stellarAddress = keypair.publicKey();
            } catch (e) {
                console.error("Invalid Stellar Key", e);
                response.stellarError = "Invalid Configuration";
            }
        }

        // 2. EVM Address
        if (FACILITATOR_PRIVATE_KEY) {
            try {
                const account = privateKeyToAccount(FACILITATOR_PRIVATE_KEY);
                response.evmAddress = account.address;
            } catch (e) {
                console.error("Invalid EVM Key", e);
                response.evmError = "Invalid Configuration";
            }
        }

        if (!response.evmAddress && !response.stellarAddress) {
            return NextResponse.json({ error: "Facilitator keys not configured" }, { status: 500 });
        }

        return NextResponse.json(response);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
