import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import TransactionModel from "@/app/models/Transaction";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Transaction ID is required" },
                { status: 400 }
            );
        }

        const transaction = await TransactionModel.findOne({ id: id }).lean();

        if (!transaction) {
            return NextResponse.json(
                { error: "Transaction not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(transaction);
    } catch (error) {
        console.error("Error fetching transaction by ID:", error);
        return NextResponse.json(
            { error: "Failed to fetch transaction" },
            { status: 500 }
        );
    }
}
