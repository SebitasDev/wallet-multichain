import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import TransactionModel from "@/app/models/Transaction";
import { startOfWeek, endOfWeek } from "date-fns";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json(
                { success: false, error: "Address is required" },
                { status: 400 }
            );
        }

        // Normalize address
        const cleanAddress = (address.startsWith('0x') && address.length >= 42)
            ? address.substring(0, 42).toLowerCase()
            : address.toLowerCase();

        // 1. Total Sent (Count & Volume) & Max Sent
        // "SEND" means fromAddress == cleanAddress
        const sentStats = await TransactionModel.aggregate([
            { $match: { fromAddress: cleanAddress } },
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: 1 },
                    totalVolume: { $sum: { $ifNull: ["$usdValue", "$totalAmount"] } },
                    maxAmount: { $max: { $ifNull: ["$usdValue", "$totalAmount"] } },
                    totalFees: { $sum: "$fee" } // [NEW]
                }
            }
        ]);

        // 2. Total Received (Volume)
        // "RECEIVE" means toAddress == cleanAddress
        const receivedStats = await TransactionModel.aggregate([
            { $match: { toAddress: cleanAddress } },
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: 1 },
                    totalVolume: { $sum: { $ifNull: ["$receivedUsdValue", { $ifNull: ["$usdValue", "$totalAmount"] }] } } // Try receivedUSD, then fallback
                }
            }
        ]);

        // 3. Most Used Token
        // We look at all transactions involving this address
        const tokenStats = await TransactionModel.aggregate([
            {
                $match: {
                    $or: [
                        { fromAddress: cleanAddress },
                        { toAddress: cleanAddress }
                    ]
                }
            },
            {
                $group: {
                    _id: "$tokenSymbol",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        // 4. Weekly Activity (Sends per Day)
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const end = endOfWeek(today, { weekStartsOn: 1 });

        // Ensure createdAt is treated correctly. If it's a number (timestamp), we need to compare numbers.
        // Assuming createdAt IS a number based on schema.
        const startTs = start.getTime();
        const endTs = end.getTime();

        const weeklyActivity = await TransactionModel.aggregate([
            {
                $match: {
                    fromAddress: cleanAddress,
                    createdAt: { $gte: startTs, $lte: endTs }
                }
            },
            {
                $project: {
                    // Manual Timezone Shift (UTC-3)
                    // Subtract 3 hours (10800000 ms) from the timestamp to get local time represented as UTC-shifted date
                    date: { $toDate: { $subtract: ["$createdAt", 10800000] } },
                    amount: { $ifNull: ["$usdValue", "$totalAmount"] } // Use USD Value
                }
            },
            {
                $group: {
                    // Group by day of week (1=Mon, 7=Sun or similar depending on mongo version)
                    // Let's return the simplified date string YYYY-MM-DD to handle in frontend or dayOfWeek
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        return NextResponse.json({
            success: true,
            stats: {
                totalSends: sentStats[0]?.totalCount || 0,
                totalSentAmount: sentStats[0]?.totalVolume || 0,
                maxSent: sentStats[0]?.maxAmount || 0,
                totalFeesPaid: sentStats[0]?.totalFees || 0, // [NEW]
                totalReceives: receivedStats[0]?.totalCount || 0,
                totalReceivedAmount: receivedStats[0]?.totalVolume || 0,
                mostUsedToken: tokenStats[0]?._id || "N/A",
                weeklyActivity
            }
        });

    } catch (error: any) {
        console.error("Error fetching transaction stats:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
