// routes/userRouter.ts
import { Router } from "express";
import { createUser, getMe, loginUser } from "../controllers/userController";
import { requireAuth } from "../middlewares/auth";

export function createUserRouter() {
  const router = Router();

  router.post("/create", createUser);
  router.post("/login", loginUser);
  router.get("/profile", requireAuth, getMe);
  return router;
}
