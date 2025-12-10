import mongoose, { Schema } from "mongoose";
import { IMatchRequest } from "../types/modeTypes";

const matchRequestSchema = new Schema<IMatchRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    location: { type: String, enum: ["Gosman", "Shapiro", "IBS"], required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    playerCount: { type: Number, enum: [2, 4], default: 2, required: true },
    status: {
      type: String,
      enum: [
        "searching",
        "pending_confirmation",
        "matched",
        "expired",
        "waitlisted",
        "cancelled",
      ],
      default: "searching",
    },
    opponentRequestId: { type: Schema.Types.ObjectId, ref: "MatchRequest" },
  },
  { timestamps: true }
);

export const MatchRequest = mongoose.model<IMatchRequest>("MatchRequest", matchRequestSchema);