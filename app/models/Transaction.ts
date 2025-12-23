import { Schema, model, models } from 'mongoose';

const RouteSchema = new Schema({
    chainName: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['SUCCESS', 'PENDING', 'FAILED'], required: true },
    txHash: { type: String }
}, { _id: false });

const TransactionSchema = new Schema({
    id: { type: String, required: true, unique: true }, // Keeping UUID from frontend or generating it
    fromAddress: { type: String, required: true, index: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['SUCCESS', 'PENDING', 'FAILED'], required: true },
    route: [RouteSchema],
    createdAt: { type: Number, required: true }, // Timestamp
    tokenSymbol: { type: String },
    decimals: { type: Number }
}, {
    timestamps: true // Adds createdAt (Date) and updatedAt (Date) automatically by Mongoose too, but we are using our own numeric createdAt for compatibility
});

const TransactionModel = models.Transaction || model('Transaction', TransactionSchema);

export default TransactionModel;
