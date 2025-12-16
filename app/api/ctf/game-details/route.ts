import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import { Game, HoldSession, Capture } from "@/app/models/CTF";

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

        // 1. Fetch Game Info
        const game = await Game.findOne({ address: lcGameAddress });

        // If game not found in DB, it might be unindexed. Return empty valid structure.
        if (!game) {
            return NextResponse.json({
                totalTransactions: 0,
                allPlayers: [],
                userStats: { rank: null, address: lcUserAddress, totalDuration: 0 },
                totalPlayers: 0,
                unindexed: true // Flag for frontend
            });
        }

        const gameEndTime = new Date(game.createdAt.getTime() + game.duration * 1000);
        const now = new Date();
        const effectiveEndTime = now > gameEndTime ? gameEndTime : now; // Cap at game end

        // 2. Get Transaction Count
        // Count only CAPTURE events (excluding Joins/Creates) per user request
        const totalTransactions = await Capture.countDocuments({
            gameAddress: lcGameAddress,
            type: "CAPTURE"
        });

        // 3. Aggregate Total Duration per User (Full Leaderboard)
        const leaderboard = await HoldSession.aggregate([
            { $match: { gameAddress: lcGameAddress } },
            {
                $project: {
                    holder: 1,
                    startTime: 1,
                    endTime: 1,
                    durationSeconds: 1,
                }
            },
            {
                $project: {
                    holder: 1,
                    duration: {
                        $cond: {
                            if: { $eq: ["$endTime", null] }, // If currently holding
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

        // 4. Format Full Leaderboard
        const allPlayers = leaderboard.map((entry, index) => ({
            rank: index + 1,
            address: entry._id,
            totalDuration: Math.floor(Math.max(0, entry.totalDuration))
        }));

        // 5. Find User Specific Details
        let userStats = null;
        if (lcUserAddress) {
            const index = allPlayers.findIndex(p => p.address === lcUserAddress);
            if (index !== -1) {
                userStats = allPlayers[index];
            } else {
                userStats = {
                    rank: null,
                    address: lcUserAddress,
                    totalDuration: 0
                };
            }
        }

        return NextResponse.json({
            totalTransactions,
            allPlayers,
            userStats,
            totalPlayers: allPlayers.length,
            rewardAmount: game.rewardAmount || "0"
        });

    } catch (error: any) {
        console.error("Error fetching game details:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
