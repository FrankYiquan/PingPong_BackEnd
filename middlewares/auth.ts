import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export const requireAuth: RequestHandler = (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      res.status(401).json({ error: "Not authorized" });
      return; 
    }

    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    req.user = { id: payload.id };

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
