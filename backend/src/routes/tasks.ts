import { Router } from "express";
import { prisma } from "../db";
import { authGuard, requireEditor } from "../auth";

export const tasks = Router();

tasks.get("/", authGuard, async (req, res) => {
  const wsId = (req as any).user.workspaceId;
  const { epicId, status, label, conditional, q } = req.query as any;
  const where: any = { workspaceId: wsId, deletedAt: null };
  if (epicId) where.epicId = epicId;
  if (status) where.status = status;
  if (label) where.priorityLabel = label;
  if (conditional === "true") where.isConditional = true;
  if (q) where.title = { contains: q, mode: "insensitive" };
  const list = await prisma.task.findMany({
    where,
    orderBy: { position: "asc" },
    include: { taskSprints: { include: { sprint: true } } },
  });
  res.json(list);
});

tasks.post("/", authGuard, requireEditor, async (req, res) => {
  const wsId = (req as any).user.workspaceId;
  const b = req.body;
  const max = await prisma.task.aggregate({
    where: { workspaceId: wsId, epicId: b.epicId ?? null, parentId: b.parentId ?? null },
    _max: { position: true },
  });
  const task = await prisma.task.create({
    data: {
      workspaceId: wsId,
      epicId: b.epicId ?? null,
      parentId: b.parentId ?? null,
      title: b.title || "Новая задача",
      description: b.description ?? null,
      weeekUrl: b.weeekUrl ?? null,
      priorityLabel: b.priorityLabel ?? "none",
      status: b.status ?? "todo",
      hoursPlan: b.hoursPlan ?? null,
      hoursFact: b.hoursFact ?? null,
      isConditional: b.isConditional ?? false,
      conditionText: b.conditionText ?? null,
      position: (max._max.position || 0) + 1,
    },
  });
  res.json(task);
});

tasks.patch("/:id", authGuard, requireEditor, async (req, res) => {
  const allowed = [
    "title", "description", "weeekUrl", "priorityLabel", "status",
    "hoursPlan", "hoursFact", "isConditional", "conditionText", "conditionMet", "epicId", "parentId",
  ];
  const data: any = {};
  for (const k of allowed) if (k in req.body) data[k] = req.body[k];
  const task = await prisma.task.update({ where: { id: req.params.id }, data });
  res.json(task);
});

// drag-drop reorder: place between prevPos and nextPos (midpoint)
tasks.patch("/:id/reorder", authGuard, requireEditor, async (req, res) => {
  const { prevPos, nextPos } = req.body as { prevPos?: number; nextPos?: number };
  let position: number;
  if (prevPos == null && nextPos != null) position = nextPos - 1;
  else if (prevPos != null && nextPos == null) position = prevPos + 1;
  else if (prevPos != null && nextPos != null) position = (prevPos + nextPos) / 2;
  else position = 1;
  const task = await prisma.task.update({ where: { id: req.params.id }, data: { position } });
  res.json(task);
});

tasks.delete("/:id", authGuard, requireEditor, async (req, res) => {
  await prisma.task.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  res.json({ ok: true });
});
