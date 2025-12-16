import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import { Game, Capture, HoldSession } from "@/app/models/CTF";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userAddress = searchParams.get("userAddress");

        if (!userAddress) {
            return NextResponse.json({ error: "Missing userAddress" }, { status: 400 });
        }

        await connectDB();
        const lcUserAddress = userAddress.toLowerCase();
        const now = Date.now();

        // 1. Parallelize Independent Queries
        // We use Promise.all to fetch basic counts concurrently.
        const [gamesCreated, totalTransactions, maxHoldSession, winStats] = await Promise.all([
            // A. Games Created
            Game.countDocuments({ creator: lcUserAddress }),

            // B. Total Transactions
            Capture.countDocuments({ executor: lcUserAddress }),

            // C. Max Hold Time (Single Session)
            HoldSession.find({ holder: lcUserAddress })
                .sort({ durationSeconds: -1 })
                .limit(1)
                .select("durationSeconds")
                .lean(),

            // D. Complex Aggregation for Wins & Total Deposited
            // We combine "Total Deposited" and "Games Won + Total Won" logic here or keep them separate.
            // For clarity and speed, we'll do Deposited separately as it's a simple index scan.
            Game.aggregate([
                { $match: { creator: lcUserAddress } },
                {
                    $group: {
                        _id: null,
                        totalDeposited: { $sum: { $toDouble: "$rewardAmount" } }
                    }
                }
            ])
        ]);

        const totalDeposited = winStats[0]?.totalDeposited || 0;
        const maxHoldTime = maxHoldSession[0]?.durationSeconds || 0;

        // 2. Optimized "Games Won" Aggregation
        // Instead of N+1 Queries (Looping games), we use one pipeline starting from Sessions.
        // Strategy:
        // Group Sessions by Game -> Calculate duration per user -> Sort -> First is Winner.
        // Filter where Winner is Me -> Lookup Game (to get Reward & Status) -> Filter Ended Games -> Sum.
        const winAggregation = await HoldSession.aggregate([
            // Step 1: Calculate Total Duration per User per Game
            {
                $group: {
                    _id: { game: "$gameAddress", holder: "$holder" },
                    totalTime: { $sum: "$durationSeconds" }
                }
            },
            // Step 2: Sort by Duration Descending to prepare for ranking
            { $sort: { "_id.game": 1, totalTime: -1 } },

            // Step 3: Pick the Winner (Rank 1) for each Game
            {
                $group: {
                    _id: "$_id.game",
                    winner: { $first: "$_id.holder" },
                    maxTime: { $first: "$totalTime" }
                }
            },

            // Step 4: Filter relevant winners (Only if I won)
            // This drastically reduces the documents before the Lookup
            { $match: { winner: lcUserAddress } },

            // Step 5: Join Game Details
            // We need game details to know if it's ended and what the reward is
            {
                $lookup: {
                    from: "games", // Collection name (plural of Model)
                    localField: "_id",
                    foreignField: "address",
                    as: "game"
                }
            },
            { $unwind: "$game" },

            // Step 6: Filter Objectively Ended Games
            // Either explicitly inactive OR time expired
            {
                $match: {
                    $or: [
                        { "game.isActive": false },
                        {
                            $expr: {
                                $lt: [
                                    { $add: [{ $toLong: "$game.createdAt" }, { $multiply: ["$game.duration", 1000] }] },
                                    now
                                ]
                            }
                        }
                    ]
                }
            },

            // Step 7: Sum Rewards
            {
                $group: {
                    _id: null,
                    gamesWon: { $sum: 1 },
                    totalWon: { $sum: { $toDouble: "$game.rewardAmount" } }
                }
            }
        ]);


        const gamesWon = winAggregation[0]?.gamesWon || 0;
        const totalWon = winAggregation[0]?.totalWon || 0;

        return NextResponse.json({
            gamesCreated,
            gamesWon,
            totalTransactions,
            totalDeposited,
            totalWon,
            maxHoldTime
        });

    } catch (error: any) {
        console.error("Error fetching profile stats:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
