import { Router } from "express";
import { prisma } from "../db";
import { authGuard, requireEditor } from "../auth";

export const epics = Router();

epics.get("/", authGuard, async (req, res) => {
  const wsId = (req as any).user.workspaceId;
  const list = await prisma.epic.findMany({
    where: { workspaceId: wsId, deletedAt: null },
    orderBy: { position: "asc" },
  });
  res.json(list);
});

epics.post("/", authGuard, requireEditor, async (req, res) => {
  const wsId = (req as any).user.workspaceId;
  const max = await prisma.epic.aggregate({ where: { workspaceId: wsId }, _max: { position: true } });
  const epic = await prisma.epic.create({
    data: {
      workspaceId: wsId,
      title: req.body.title || "Новый эпик",
      color: req.body.color || "#f0b429",
      position: (max._max.position || 0) + 1,
    },
  });
  res.json(epic);
});

epics.patch("/:id", authGuard, requireEditor, async (req, res) => {
  const { title, color } = req.body;
  const epic = await prisma.epic.update({ where: { id: req.params.id }, data: { title, color } });
  res.json(epic);
});

epics.delete("/:id", authGuard, requireEditor, async (req, res) => {
  await prisma.epic.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  res.json({ ok: true });
});
