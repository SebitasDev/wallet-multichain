
import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");
    const vs_currencies = searchParams.get("vs_currencies") || "usd";

    if (!ids) {
        return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
    }

    try {
        const response = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
            params: {
                ids,
                vs_currencies
            }
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Coingecko Proxy Error:", error.message);
        return NextResponse.json(
            { error: "Failed to fetch prices" },
            { status: error.response?.status || 500 }
        );
    }
}
