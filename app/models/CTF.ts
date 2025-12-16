import mongoose, { Schema, model, models } from "mongoose";

// --- Game Model ---
const GameSchema = new Schema({
    address: { type: String, required: true, unique: true, index: true },
    creator: { type: String, required: true },
    captureFee: { type: String, required: true },
    duration: { type: Number, required: true }, // in seconds
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

export const Game = models.Game || model("Game", GameSchema);

// --- Capture/Transaction Model ---
// Stores every interaction: Create, Join, Capture
const CaptureSchema = new Schema({
    gameAddress: { type: String, required: true, index: true },
    type: { type: String, enum: ["CREATE", "JOIN", "CAPTURE"], required: true },
    executor: { type: String, required: true }, // Who did the tx
    previousHolder: { type: String, default: null }, // Who held it before (for Capture)
    newHolder: { type: String, required: true }, // Usually same as executor, but explicit
    amount: { type: String, default: "0" }, // ETH value sent
    timestamp: { type: Date, default: Date.now },
    txHash: { type: String, required: true }
});

export const Capture = models.Capture || model("Capture", CaptureSchema);

// --- Hold Session Model ---
// Easier for leaderboard calculating: Intervals of holding
const HoldSessionSchema = new Schema({
    gameAddress: { type: String, required: true, index: true },
    holder: { type: String, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null }, // Null means currently holding
    durationSeconds: { type: Number, default: 0 } // Updates when session closes or via aggregation
});

export const HoldSession = models.HoldSession || model("HoldSession", HoldSessionSchema);
