import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import { Game } from "@/app/models/CTF";

export async function GET(req: Request) {
    try {
        await connectDB();

        // Fetch all games with their address and rewardAmount
        const games = await Game.find({}, "address rewardAmount");

        // Create a map for easy lookup
        // address -> { rewardAmount }
        const metadata: Record<string, { rewardAmount: string }> = {};

        games.forEach((g) => {
            if (g.address) {
                metadata[g.address] = {
                    rewardAmount: g.rewardAmount || "0"
                };
            }
        });

        return NextResponse.json({ metadata }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching games metadata:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
