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

        // Normalize address: If it's an EVM address (starts with 0x), take the first 42 chars to handle potential suffixes/dirty data
        const cleanAddress = (address.startsWith('0x') && address.length >= 42)
            ? address.substring(0, 42)
            : address;

        const transactions = await TransactionModel.find({
            $or: [
                { fromAddress: { $regex: new RegExp(`^\\s*${cleanAddress}`, 'i') } }, // Match if it STARTS with the clean address (ignoring whitespace)
                { toAddress: { $regex: new RegExp(`^\\s*${cleanAddress}`, 'i') } }
            ]
        })
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
