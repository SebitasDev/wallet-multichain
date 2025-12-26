import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import TransactionModel from "@/app/models/Transaction";
import { startOfDay } from "date-fns";

export async function GET(req: Request) {
    try {
        await connectDB();

        // 1. Total Transactions (Count all documents)
        const totalTransactions = await TransactionModel.countDocuments({});

        // 2. Total Volume (Sum of totalAmount)
        const volumeAggregation = await TransactionModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalVolume: { $sum: "$totalAmount" }
                }
            }
        ]);
        const totalVolume = volumeAggregation.length > 0 ? volumeAggregation[0].totalVolume : 0;

        // 3. Transactions Today (Count documents created since start of day)
        // Note: createdAt is stored as a Number (timestamp in ms)
        const startOfToday = startOfDay(new Date()).getTime();
        const transactionsToday = await TransactionModel.countDocuments({
            createdAt: { $gte: startOfToday }
        });

        return NextResponse.json({
            success: true,
            stats: {
                totalTransactions,
                totalVolume,
                transactionsToday
            }
        });

    } catch (error: any) {
        console.error("Error fetching global stats:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
