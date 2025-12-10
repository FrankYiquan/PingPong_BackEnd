import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/modeTypes";
const pics = ["pic1", "pic2", "pic3", "pic4"] as const;

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },

  elo:      { type: Number, default: 0 },
  creditScore: { type: Number, default: 100 },

  // RANDOM default from pic1–pic4
  profileImage: { 
    type: String, 
    default: () => {
      return pics[Math.floor(Math.random() * pics.length)];
    }
  },

  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>("User", userSchema);
