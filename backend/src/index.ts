import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { signToken, authGuard } from "./auth";
import { epics } from "./routes/epics";
import { tasks } from "./routes/tasks";
import { sprints } from "./routes/sprints";

// serialize BigInt safely in JSON responses
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));

app.post("/api/v1/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = await prisma.appUser.findFirst({ where: { email } });
  if (!user || !bcrypt.compareSync(password || "", user.passwordHash)) {
    return res.status(401).json({ error: "invalid credentials" });
  }
  const token = signToken({ sub: user.id, role: user.role, workspaceId: user.workspaceId, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.get("/api/v1/me", authGuard, (req, res) => res.json((req as any).user));

app.use("/api/v1/epics", epics);
app.use("/api/v1/tasks", tasks);
app.use("/api/v1/sprints", sprints);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`API on :${PORT}`));
