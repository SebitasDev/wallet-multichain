
import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import TransactionModel from "@/app/models/Transaction";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');

        // Fetch ALL transactions to see what's going on
        const allTx = await TransactionModel.find({}).sort({ createdAt: -1 }).limit(5).lean();

        return NextResponse.json({
            success: true,
            debug: {
                addressQueried: address,
                allTransactionsSample: allTx
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
