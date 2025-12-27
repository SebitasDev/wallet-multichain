import { Schema, model, models } from 'mongoose';

const RouteSchema = new Schema({
    chainName: { type: String, required: true },
    amount: { type: Number, required: true },
    assetOrigin: { type: String }, // Renamed from tokenSymbol
    status: { type: String, enum: ['SUCCESS', 'PENDING', 'FAILED'], required: true },
    txHash: { type: String }
}, { _id: false });

const TransactionSchema = new Schema({
    id: { type: String, required: true, unique: true }, // Keeping UUID from frontend or generating it
    fromAddress: { type: String, required: true, index: true },
    toAddress: { type: String, required: true, index: true }, // [NEW]
    destinationChain: { type: String, required: true }, // [NEW]
    totalAmount: { type: Number, required: true },
    estimatedReceived: { type: Number }, // [NEW] Estimated amount to reach destination
    status: { type: String, enum: ['SUCCESS', 'PENDING', 'FAILED'], required: true },
    route: [RouteSchema],
    createdAt: { type: Number, required: true, index: true }, // Timestamp
    tokenSymbol: { type: String },
    decimals: { type: Number },
    fee: { type: Number } // [NEW] Fee paid for the transaction
}, {
    timestamps: true // Adds createdAt (Date) and updatedAt (Date) automatically by Mongoose too, but we are using our own numeric createdAt for compatibility
});

// Compound Indexes for efficient sorting and filtering
TransactionSchema.index({ fromAddress: 1, createdAt: -1 });
TransactionSchema.index({ toAddress: 1, createdAt: -1 });

const TransactionModel = models.Transaction || model('Transaction', TransactionSchema);

export default TransactionModel;
