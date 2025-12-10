import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Request, Response } from "express";
import { CreateUserBody, LoginUserBody } from "../types/routeTypes";
import { Match } from "../models/Match";

export const createUser = async (
    req: Request<{}, {}, CreateUserBody>,
    res: Response
) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email, password required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed,
      elo: 1000,
      creditScore: 100,
    });

    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      elo: user.elo,
      creditScore: user.creditScore,
      profileImage: user.profileImage,
    });

  } catch (err:  any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


export const loginUser = async (
    req: Request<{}, {}, LoginUserBody>, 
    res: Response
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch ALL matches involving user
    const allMatches = await Match.find({
      $or: [{ player1Id: userId }, { player2Id: userId }]
    })
    .sort({ scheduledStartTime: -1 })
    .populate("player1Id", "username profileImage")
    .populate("player2Id", "username profileImage");

    const pendingMatches: any[] = [];
    const history: any[] = [];
    let wins = 0;
    let completedCount = 0;

    allMatches.forEach((m: any) => {
      const isP1 = m.player1Id._id.toString() === userId;
      const opponent = isP1 ? m.player2Id : m.player1Id;

      // DATA OBJECT FOR FRONTEND
      const matchObj = {
        id: m._id,
        opponent: opponent.username,
        avatar: opponent.profileImage, // currently default image
        date: new Date(m.scheduledStartTime).toLocaleDateString(),
        time: new Date(m.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: m.location,
        result: "",
        score: ""
      };

      if (m.status === "completed") {
        // HISTORY
        completedCount++;
        const myScore = isP1 ? m.player1Score : m.player2Score;
        const oppScore = isP1 ? m.player2Score : m.player1Score;
        
        const isWin = m.winnerId && m.winnerId.toString() === userId;
        if (isWin) wins++;

        matchObj.result = isWin ? "W" : "L";
        matchObj.score = `${myScore}-${oppScore}`;
        history.push(matchObj);
      } else if (m.status !== "cancelled") {
        // PENDING (Status is 'scheduled' or 'matched')
        pendingMatches.push(matchObj);
      }
    });

    // Stats Logic
    const winRate = completedCount > 0 
      ? Math.round((wins / completedCount) * 100) + "%" 
      : "0%";

    res.json({
      id: user._id,
      name: user.username,
      email: user.email,
      avatar: user.profileImage,
      elo: user.elo,
      creditScore: user.creditScore,
      winRate,
      streak: 0, //TB deleted 
      matches: completedCount,
      history,
      pendingMatches 
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

