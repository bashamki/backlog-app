import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export interface AuthUser { sub: string; role: string; workspaceId: string; email: string; }

export function signToken(u: AuthUser) {
  return jwt.sign(u, SECRET, { expiresIn: "7d" });
}

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "no token" });
  try {
    (req as any).user = jwt.verify(token, SECRET) as AuthUser;
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

export function requireEditor(req: Request, res: Response, next: NextFunction) {
  const u = (req as any).user as AuthUser;
  if (!u || u.role !== "pm_editor") return res.status(403).json({ error: "read-only role" });
  next();
}
