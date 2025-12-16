import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import { Game, Capture, HoldSession } from "@/app/models/CTF";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            address,
            creator,
            captureFee,
            duration,
            txHash,
            rewardAmount // Optional
        } = body;

        // Validate
        if (!address || !creator || !txHash) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        // 1. Create Game Record
        const newGame = await Game.create({
            address: address.toLowerCase(),
            creator: creator.toLowerCase(),
            captureFee,
            duration,
            rewardAmount: rewardAmount || "0"
        });

        // 2. Log Creation Transaction
        await Capture.create({
            gameAddress: address.toLowerCase(),
            type: "CREATE",
            executor: creator.toLowerCase(),
            newHolder: creator.toLowerCase(),
            amount: "0", // Creation usually costs gas but fee is 0 paid to contract
            txHash,
            previousHolder: null
        });

        // 3. Start Initial Hold Session -> REMOVED
        // The game starts with NO holder. The first capture will start the first session.
        /* 
        await HoldSession.create({
          gameAddress: address.toLowerCase(),
          holder: creator.toLowerCase(),
          startTime: new Date(),
        });
        */

        return NextResponse.json({ success: true, game: newGame }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating game log:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
