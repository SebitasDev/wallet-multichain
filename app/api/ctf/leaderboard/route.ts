import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import { Game, HoldSession } from "@/app/models/CTF"; // Ensure Game is imported

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const gameAddress = searchParams.get("gameAddress");
        const userAddress = searchParams.get("userAddress");

        if (!gameAddress) {
            return NextResponse.json({ error: "Missing gameAddress" }, { status: 400 });
        }

        await connectDB();
        const lcGameAddress = gameAddress.toLowerCase();
        const lcUserAddress = userAddress ? userAddress.toLowerCase() : null;

        // 1. Fetch Game Calculation Info
        const game = await Game.findOne({ address: lcGameAddress });
        if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

        const gameEndTime = new Date(game.createdAt.getTime() + game.duration * 1000);
        const now = new Date();
        const effectiveEndTime = now > gameEndTime ? gameEndTime : now; // Cap at game end

        // 2. Aggregate Total Duration per User
        const leaderboard = await HoldSession.aggregate([
            { $match: { gameAddress: lcGameAddress } },
            {
                $project: {
                    holder: 1,
                    startTime: 1, // Need this for calculation
                    endTime: 1,
                    durationSeconds: 1,
                }
            },
            {
                $project: {
                    holder: 1,
                    duration: {
                        $cond: {
                            if: { $eq: ["$endTime", null] }, // If currently holding (session open)
                            then: {
                                // Calculate duration until Effective End Time
                                $divide: [
                                    { $subtract: [effectiveEndTime, "$startTime"] },
                                    1000
                                ]
                            },
                            else: "$durationSeconds" // Use stored duration
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$holder",
                    totalDuration: { $sum: "$duration" }
                }
            },
            { $sort: { totalDuration: -1 } }
        ]);

        // 3. Format Response
        const top5 = leaderboard.slice(0, 5).map((entry, index) => ({
            rank: index + 1,
            address: entry._id,
            totalDuration: Math.floor(Math.max(0, entry.totalDuration)) // Ensure no negative values
        }));

        // 4. Find User Rank if requested
        let userRank = null;
        if (lcUserAddress) {
            const index = leaderboard.findIndex(entry => entry._id === lcUserAddress);
            if (index !== -1) {
                userRank = {
                    rank: index + 1,
                    address: lcUserAddress,
                    totalDuration: Math.floor(Math.max(0, leaderboard[index].totalDuration))
                };
            } else {
                // User hasn't held the flag yet
                userRank = {
                    rank: null,
                    address: lcUserAddress,
                    totalDuration: 0
                }
            }
        }

        return NextResponse.json({ top5, userRank });

    } catch (error: any) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
