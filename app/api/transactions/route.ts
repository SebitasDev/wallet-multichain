import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import TransactionModel from "@/app/models/Transaction";

export async function POST(req: Request) {
    try {
        await connectDB();
        const data = await req.json();

        // Validate required fields (basic check, schema validation handles stricter rules)
        if (!data.id || !data.fromAddress || !data.totalAmount || !data.destinationChain || !data.toAddress) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        const newTransaction = await TransactionModel.create(data);

        return NextResponse.json({ success: true, transaction: newTransaction });
    } catch (error: any) {
        console.error("Error creating transaction:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!address) {
            return NextResponse.json(
                { success: false, error: "Address is required" },
                { status: 400 }
            );
        }

        const transactions = await TransactionModel.find({ fromAddress: address })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return NextResponse.json({ success: true, transactions });
    } catch (error: any) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
