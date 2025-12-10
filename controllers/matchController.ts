import { MatchRequest } from "../models/MatchRequest";
import { User } from "../models/User";
import { enqueueMatchRequest } from "../matchmaking/enqueue";
import { acceptMatch, declineMatch } from "../matchmaking/acceptDecline";
import { Request, RequestHandler, Response } from "express";
import { startMatchBody, matchRequestBody, matchRequestParams } from "../types/routeTypes";
import { Notifier } from "../matchmaking/notifier";
import { Match } from "../models/Match";
import { calculateEloChange } from "../utils/eloUtils";


export const startMatchmaking: RequestHandler<{}, any, startMatchBody> = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;
    const { location, startTime, endTime, playerCount } = req.body;

    if (!location || !startTime || !endTime) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const matchReq = await MatchRequest.create({
      userId,
      location,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      playerCount: playerCount ?? 2,
      status: "searching",
    });

    await enqueueMatchRequest(matchReq, user);

    res.json({
      matchRequestId: matchReq._id,
      status: matchReq.status,
      searchExpiresInSeconds: 30,
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


export const cancelMatchmaking: RequestHandler<{}, any, matchRequestBody> = async (
    req, 
    res) => {
  try {
    const userId = req.user.id;
    const { matchRequestId } = req.body;

    const reqDoc = await MatchRequest.findById(matchRequestId);
    if (!reqDoc) {
      res.status(404).json({ error: "MatchRequest not found" });
      return;
    }

    if (reqDoc.userId.toString() !== userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    reqDoc.status = "cancelled";
    await reqDoc.save();

    res.json({ ok: true });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


export const acceptMatchRequest = async (
    req: Request<{}, any, matchRequestBody>, 
    res: Response, 
    notifier: Notifier) => {
  try {
    const userId = req.user.id;
    const { matchRequestId } = req.body;

    await acceptMatch(matchRequestId, userId, notifier);
    res.json({ ok: true });

  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};


export const declineMatchRequest = async (
    req: Request<{}, any, matchRequestBody>, 
    res: Response, 
    notifier: Notifier) => {
  try {
    const userId = req.user.id;
    const { matchRequestId } = req.body;

    await declineMatch(matchRequestId, userId, notifier);
    res.json({ ok: true });

  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};


export const getWaitlist: RequestHandler = async (_req, res) => {
  try {
    const waitlisted = await MatchRequest.find({ status: "waitlisted" })
      .populate("userId", "username elo creditScore profileImage")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(waitlisted);

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


export const markWaitlisted: RequestHandler<matchRequestParams> = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const matchReq = await MatchRequest.findById(id);
    if (!matchReq) {
      res.status(404).json({ error: "MatchRequest not found" });
      return;
    }

    if (matchReq.userId.toString() !== userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    matchReq.status = "waitlisted";
    await matchReq.save();

    res.json({ ok: true });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const submitMatchScore = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { matchId, myScore, opponentScore } = req.body;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ error: "Match not found" });

    // 1. Identify which player is submitting
    let isPlayer1 = false;
    if (match.player1Id.toString() === userId) isPlayer1 = true;
    else if (match.player2Id.toString() === userId) isPlayer1 = false;
    else return res.status(403).json({ error: "Not authorized for this match" });

    // 2. Update Scores
    match.player1Score = isPlayer1 ? myScore : opponentScore;
    match.player2Score = isPlayer1 ? opponentScore : myScore;

    // 3. Determine Winner
    if (match.player1Score > match.player2Score) {
      match.winnerId = match.player1Id;
    } else if (match.player2Score > match.player1Score) {
      match.winnerId = match.player2Id;
    } else {
      match.winnerId = undefined; // Draw
    }

    // 4. Mark Completed
    match.status = "completed";
    await match.save();

    // ---------------------------------------------------------
    // 5. CALCULATE AND UPDATE ELO
    // ---------------------------------------------------------
    
    // A. Fetch both users to get current Elo
    const player1 = await User.findById(match.player1Id);
    const player2 = await User.findById(match.player2Id);

    if (player1 && player2) {
      // B. Determine "Actual Score" (1 = Win, 0 = Loss, 0.5 = Draw)
      let p1Actual = 0.5; // Default to Draw
      if (match.winnerId) {
        if (match.winnerId.toString() === player1._id.toString()) {
          p1Actual = 1; // Player 1 Won
        } else {
          p1Actual = 0; // Player 1 Lost
        }
      }
      
      const p2Actual = 1 - p1Actual; // The inverse (if P1 is 1, P2 is 0)

      // C. Calculate New Ratings
      const newP1Elo = calculateEloChange(player1.elo, player2.elo, p1Actual);
      const newP2Elo = calculateEloChange(player2.elo, player1.elo, p2Actual);

      console.log(`Elo Update: P1 (${player1.elo} -> ${newP1Elo}), P2 (${player2.elo} -> ${newP2Elo})`);

      // D. Save to DB
      player1.elo = newP1Elo;
      player2.elo = newP2Elo;

      await Promise.all([player1.save(), player2.save()]);
    }

    res.json({ ok: true, match });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const cancelScheduledMatch = async (
  req: Request,
  res: Response,
  notifier: Notifier
) => {
  try {
    const userId = req.user.id;
    const { matchId } = req.body;

    const match = await Match.findById(matchId);

    // 1. Validation
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Ensure user is part of this match
    const p1 = match.player1Id.toString();
    const p2 = match.player2Id.toString();

    if (p1 !== userId && p2 !== userId) {
      return res.status(403).json({ error: "Not authorized to cancel this match" });
    }

    // Ensure match isn't already finished
    if (match.status === "completed" || match.status === "cancelled") {
      return res.status(400).json({ error: "Match is already inactive" });
    }

    // --- NEW: Fetch Canceller Name ---
    // We need to know the name of the person cancelling to tell the opponent
    const canceller = await User.findById(userId);
    const cancellerName = canceller?.username || "Opponent";

    // --- NEW: Format Date and Time ---
    const dateObj = new Date(match.scheduledStartTime);
    const dateStr = dateObj.toLocaleDateString(); // e.g. "12/9/2025"
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g. "9:22 PM"

    // 2. 48-Hour Credit Score Penalty Logic
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let penaltyApplied = false;

    if (diffHours < 48) {
      penaltyApplied = true;
      await User.findByIdAndUpdate(userId, { $inc: { creditScore: -10 } });
      console.log(`User ${userId} penalized for late cancellation.`);
    }

    // 3. Update Match Status
    match.status = "cancelled";
    await match.save();

    // 4. Notify the Opponent with RICH DATA
    const opponentId = p1 === userId ? p2 : p1;
    
    // Note: Use the event name your frontend listener expects (e.g., "MATCH_CANCELLED_BY_OPPONENT")
    await notifier.notifyUser(opponentId, "MATCH_CANCELLED", {
      matchId: match._id,
      msg: `Your match with ${cancellerName} at ${match.location} was cancelled.`,
      // --- Passing the specific fields requested ---
      opponentName: cancellerName,
      location: match.location,
      date: dateStr,
      time: timeStr
    });

    res.json({ 
      ok: true, 
      message: "Match cancelled successfully",
      penaltyApplied 
    });

  } catch (err: any) {
    console.error("Cancel Scheduled Match Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const createDirectMatch = async (req: Request, res: Response, notifier: Notifier) => {
  try {
    const userId = req.user.id;
    const { opponentId, location, startTime, endTime } = req.body;

    if (!opponentId || !location || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (userId === opponentId) {
      return res.status(400).json({ error: "Cannot play against yourself" });
    }

    // 1. Verify Opponent Exists
    const opponent = await User.findById(opponentId);
    if (!opponent) {
      return res.status(404).json({ error: "Opponent not found" });
    }

    // 2. Create the Match directly (Status: Scheduled)
    const match = await Match.create({
      player1Id: userId,
      player2Id: opponentId,
      location,
      scheduledStartTime: new Date(startTime),
      // Optional: Store endTime if your schema supports it, otherwise logic assumes duration
      status: "scheduled",
      player1Score: null,
      player2Score: null
    });

    // 3. Notify Opponent
    const me = await User.findById(userId);
    await notifier.notifyUser(opponentId, "MATCH_QR_CODE_CREATED", {
      matchId: match._id,
      opponentName: me?.username || "A player",
      location,
      date: new Date(startTime).toLocaleDateString(),
      time: new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      msg: `You have a new match scheduled against ${me?.username}!`
    });

    res.json({ ok: true, matchId: match._id });

  } catch (err: any) {
    console.error("Direct Match Error:", err);
    res.status(500).json({ error: err.message });
  }
};