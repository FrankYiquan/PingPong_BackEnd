import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { Notifier } from "../matchmaking/notifier";

import {
  startMatchmaking,
  cancelMatchmaking,
  acceptMatchRequest,
  declineMatchRequest,
  getWaitlist,
  markWaitlisted,
  submitMatchScore,
  cancelScheduledMatch,
  createDirectMatch,
} from "../controllers/matchController";

export function createMatchRouter(notifier: Notifier) {
  const router = Router();

  // Apply auth to everything
  router.use(requireAuth);

  // -------- Matchmaking Routes -------- //

  router.post("/start", startMatchmaking);

  router.post("/cancel", cancelMatchmaking);

  // accept / decline need notifier injected
  router.post("/accept", (req, res) =>
    acceptMatchRequest(req, res, notifier)
  );

  router.post("/decline", (req, res) =>
    declineMatchRequest(req, res, notifier)
  );

  // public list
  router.get("/waitlist", getWaitlist);

  // mark waitlisted: /waitlist/:id
  router.post("/waitlist/:id", markWaitlisted);

  // submit match score
  router.post("/score", submitMatchScore)

  router.post("/cancel-scheduled", (req, res) => 
    cancelScheduledMatch(req, res, notifier)
  );

  router.post("/challenge", (req, res) => 
    createDirectMatch(req, res, notifier)
  );


  return router;


}

