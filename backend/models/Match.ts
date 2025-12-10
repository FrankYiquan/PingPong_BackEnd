import mongoose, { Schema } from "mongoose";
import {IMatch } from "../types/modeTypes";


const matchSchema = new Schema<IMatch>(
  {
    player1Id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    player2Id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    location: { type: String, enum: ["Gosman", "Shapiro", "IBS"], required: true },
    scheduledStartTime: { type: Date, required: true },

    // Represents the final set count (e.g., P1: 4, P2: 2)
    player1Score: { type: Number, default: null }, 
    player2Score: { type: Number, default: null },

    // Reference to the winner
    winnerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    
    // Track status explicitly
    status: { 
      type: String, 
      enum: ["scheduled", "completed", "cancelled"], 
      default: "scheduled" 
    }
  },
  { timestamps: true }
);

export const Match = mongoose.model<IMatch>("Match", matchSchema);