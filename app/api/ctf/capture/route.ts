import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import { Capture, HoldSession } from "@/app/models/CTF";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            gameAddress,
            newHolder,
            previousHolder,
            amount,
            txHash,
            type = "CAPTURE" // Can be JOIN or CAPTURE
        } = body;

        if (!gameAddress || !newHolder || !txHash) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        const now = new Date();

        // 1. Log Transaction
        await Capture.create({
            gameAddress: gameAddress.toLowerCase(),
            type,
            executor: newHolder.toLowerCase(),
            newHolder: newHolder.toLowerCase(),
            previousHolder: previousHolder ? previousHolder.toLowerCase() : null,
            amount,
            txHash,
            timestamp: now
        });

        // 2. Handle Hold Sessions (Only for Capture/Create, not Join)
        if (type !== "JOIN") {
            // Close Previous Hold Session
            if (previousHolder) {
                const prevSession = await HoldSession.findOne({
                    gameAddress: gameAddress.toLowerCase(),
                    holder: previousHolder.toLowerCase(),
                    endTime: null
                });

                if (prevSession) {
                    prevSession.endTime = now;
                    // Calculate duration in seconds
                    const duration = (now.getTime() - new Date(prevSession.startTime).getTime()) / 1000;
                    prevSession.durationSeconds = duration;
                    await prevSession.save();
                }
            }

            // Start New Hold Session
            await HoldSession.create({
                gameAddress: gameAddress.toLowerCase(),
                holder: newHolder.toLowerCase(),
                startTime: now
            });
        }

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating capture log:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
