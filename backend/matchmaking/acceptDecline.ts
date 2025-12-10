import { redis } from "../redis/redisClient";
import { confirmKey, matchReqKey, avoidMatchKey } from "../redis/key"; // Import avoidMatchKey
import { MatchRequest } from "../models/MatchRequest";
import { Match } from "../models/Match";
import { Notifier } from "./notifier";
import { enqueueMatchRequest } from "./enqueue";
import { User } from "../models/User";

export async function acceptMatch(
  matchRequestId: string,
  userId: string,
  notifier: Notifier
) {
  const req = await MatchRequest.findById(matchRequestId).exec();
  
  if (!req || req.status !== "pending_confirmation") {
    throw new Error("No pending match to accept or match timed out");
  }

  if (req.userId.toString() !== userId) {
    throw new Error("Not authorized on this match request");
  }

  const confirmAKey = confirmKey(matchRequestId);
  await redis.set(confirmAKey, "accepted", "EX", 15);

  if (!req.opponentRequestId) return; 
  const oppId = req.opponentRequestId.toString();
  const confirmBKey = confirmKey(oppId);

  const oppStatus = await redis.get(confirmBKey);
  
  if (oppStatus === "accepted") {
    // The match engine deletes Redis data when moving to pending, 
    // rely on the Database now.
    // avoid the case where opponent request no longer exists
    const oppReq = await MatchRequest.findById(oppId).exec();
    
    if (!oppReq) {
      // Rare edge case: Opponent deleted request?
      throw new Error("Opponent request invalid");
    }

    const match = await Match.create({
      player1Id: req.userId,
      player2Id: oppReq.userId,
      location: req.location,
      scheduledStartTime: req.startTime, 
    });

    await MatchRequest.findByIdAndUpdate(matchRequestId, { status: "matched" });
    await MatchRequest.findByIdAndUpdate(oppId, { status: "matched" });

    // Clean keys
    await redis.del(confirmAKey, confirmBKey);

    // Notify both
    await notifier.notifyUser(req.userId.toString(), "MATCH_CONFIRMED", { matchId: match._id });
    await notifier.notifyUser(oppReq.userId.toString(), "MATCH_CONFIRMED", { matchId: match._id });
  }
}

export async function declineMatch(
  matchRequestId: string,
  userId: string,
  notifier: Notifier
) {
  const req = await MatchRequest.findById(matchRequestId);
  if (!req) throw new Error("MatchRequest not found");

  if (req.userId.toString() !== userId) {
    throw new Error("Not your match request");
  }

  const opponentId = req.opponentRequestId?.toString();

  // 1. Reset My Status
  req.status = "searching";
  req.opponentRequestId = null;
  await req.save();

  // Clean confirm key
  await redis.del(confirmKey(matchRequestId));

  if (opponentId) {
    await redis.del(confirmKey(opponentId));

    // --- FIX: PREVENT IMMEDIATE RE-MATCH ---
    // Set a key that expires in 60 seconds preventing these two IDs from matching
    const avoidKey = avoidMatchKey(matchRequestId, opponentId);
    await redis.set(avoidKey, "1", "EX", 5); 

    const oppReq = await MatchRequest.findById(opponentId);
    if (oppReq) {
      oppReq.status = "searching";
      oppReq.opponentRequestId = null;
      await oppReq.save();

      notifier.notifyUser(oppReq.userId.toString(), "MATCH_DECLINED", {
        msg: "Opponent declined, searching again.",
      });

      // Re-enqueue Opponent
      const oppUser = await User.findById(oppReq.userId);
      if (oppUser) await enqueueMatchRequest(oppReq, oppUser);
    }
  }

  // Re-enqueue Me
  const user = await User.findById(userId);
  if (user) await enqueueMatchRequest(req, user);

  return { ok: true };
}