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
        const limit = parseInt(searchParams.get('limit') || '5'); // Default to 5 per page
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        if (!address) {
            return NextResponse.json(
                { success: false, error: "Address is required" },
                { status: 400 }
            );
        }

        // Normalize address: If it's an EVM address (starts with 0x), take the first 42 chars to handle potential suffixes/dirty data
        const cleanAddress = (address.startsWith('0x') && address.length >= 42)
            ? address.substring(0, 42).toLowerCase()
            : address.toLowerCase();

        const query = {
            $or: [
                { fromAddress: cleanAddress }, // Exact match
                { toAddress: cleanAddress }
            ]
        };

        const total = await TransactionModel.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        const transactions = await TransactionModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            transactions,
            pagination: {
                total,
                totalPages,
                page,
                limit
            }
        });
    } catch (error: any) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const data = await req.json();
        const { id, status, route } = data;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Transaction ID is required" },
                { status: 400 }
            );
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (route) updateData.route = route;

        const updatedTransaction = await TransactionModel.findOneAndUpdate(
            { id: id },
            { $set: updateData },
            { new: true }
        );

        if (!updatedTransaction) {
            return NextResponse.json(
                { success: false, error: "Transaction not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, transaction: updatedTransaction });
    } catch (error: any) {
        console.error("Error updating transaction:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
