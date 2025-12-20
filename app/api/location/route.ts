import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Fetch from ipapi.co server-side to avoid CORS
        const response = await fetch("https://ipapi.co/json/", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
            }
        });

        if (!response.ok) {
            throw new Error(`IP API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Location proxy error:", error);
        // Fallback to simpler service or just return empty to let client default to USD
        return NextResponse.json({ currency: "USD" }, { status: 200 });
    }
}
