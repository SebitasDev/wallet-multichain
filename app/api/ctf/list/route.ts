import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import { Game } from "@/app/models/CTF";

// Efficiently aggregate games with their top holders in a single query (Batched Leaderboards)
// Efficiently aggregate games with their top holders in a single query (Batched Leaderboards)
export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "6"); // 6 cards per page fits well in 3-col grid
        const skip = (page - 1) * limit;

        const now = new Date();

        // 1. Get total count for pagination metadata
        const totalGames = await Game.countDocuments();
        const totalPages = Math.ceil(totalGames / limit);

        // 2. Fetch Paginated Games with optimized pipeline
        const games = await Game.aggregate([
            // Sort by newest first
            { $sort: { createdAt: -1 } },
            // Pagination Stages (Apply BEFORE lookup to optimize performance)
            { $skip: skip },
            { $limit: limit },
            // Lookup Hold Sessions to calculate leaderboard per game
            {
                $lookup: {
                    from: "holdsessions",
                    let: { gameId: "$address", gameStart: "$createdAt", gameDur: "$duration" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$gameAddress", "$$gameId"] } } },
                        {
                            $addFields: {
                                effectiveDuration: {
                                    $cond: {
                                        if: { $eq: ["$endTime", null] }, // Active session (open)
                                        then: {
                                            $divide: [
                                                {
                                                    $subtract: [
                                                        // Cap end time at Game Duration expiry or Now
                                                        { $min: [now, { $add: ["$$gameStart", { $multiply: ["$$gameDur", 1000] }] }] },
                                                        "$startTime"
                                                    ]
                                                },
                                                1000
                                            ]
                                        },
                                        else: "$durationSeconds" // Closed session
                                    }
                                }
                            }
                        },
                        // Group by holder to sum sessions
                        {
                            $group: {
                                _id: "$holder",
                                totalDuration: { $sum: "$effectiveDuration" }
                            }
                        },
                        { $sort: { totalDuration: -1 } },
                        { $limit: 5 },
                        {
                            $project: {
                                _id: 0,
                                rank: { $literal: 0 }, // Rank assigned in frontend or via index
                                address: "$_id",
                                totalDuration: { $floor: "$totalDuration" }
                            }
                        }
                    ],
                    as: "leaderboard"
                }
            },
            // Project final shape
            {
                $project: {
                    address: 1,
                    rewardAmount: 1,
                    isActive: 1,
                    createdAt: 1,
                    duration: 1,
                    top5: "$leaderboard" // Rename to match expectation
                }
            }
        ]);

        // Post-process to add Rank numbers
        const gamesWithRank = games.map(g => ({
            ...g,
            top5: g.top5.map((entry: any, i: number) => ({ ...entry, rank: i + 1 }))
        }));

        return NextResponse.json({
            games: gamesWithRank,
            metadata: {
                total: totalGames,
                page,
                totalPages,
                hasMore: page < totalPages
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching game list:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
