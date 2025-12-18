import { NextResponse } from 'next/server';

const UPSTREAM_RPC = "https://rpc.ankr.com/stellar_soroban";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Forward the JSON-RPC request to the upstream provider
        // Server-to-server requests allow us to bypass browser CORS and header restrictions
        const response = await fetch(UPSTREAM_RPC, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Soroban Proxy Error:", error);
        return NextResponse.json(
            { error: "Failed to proxy Soroban RPC request" },
            { status: 500 }
        );
    }
}
