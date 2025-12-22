import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import TransactionModel from '@/app/models/Transaction';
import { Transaction } from '@/app/types/Transaction';

export async function POST(request: Request) {
    try {
        await connectDB();
        const body: Transaction = await request.json();

        // Validate basic fields
        if (!body.id || !body.fromAddress || !body.totalAmount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newTx = await TransactionModel.create(body);
        return NextResponse.json(newTx, { status: 201 });

    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        }

        const transactions = await TransactionModel.find({ fromAddress: address })
            .sort({ createdAt: -1 }) // Newest first
            .lean();

        return NextResponse.json(transactions);

    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const { id, status, route } = body;

        if (!id) {
            return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (route) updateData.route = route;

        const updatedTx = await TransactionModel.findOneAndUpdate(
            { id: id },
            { $set: updateData },
            { new: true }
        );

        if (!updatedTx) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json(updatedTx);

    } catch (error) {
        console.error('Error updating transaction:', error);
        return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }
}
