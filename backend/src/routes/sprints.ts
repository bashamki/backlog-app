import { Router } from "express";
import { prisma } from "../db";
import { authGuard, requireEditor } from "../auth";

export const sprints = Router();

sprints.get("/", authGuard, async (req, res) => {
  const wsId = (req as any).user.workspaceId;
  const list = await prisma.sprint.findMany({
    where: { workspaceId: wsId },
    orderBy: [{ year: "asc" }, { weekNo: "asc" }],
    include: { taskSprints: { include: { task: true } } },
  });
  res.json(list);
});

sprints.post("/", authGuard, requireEditor, async (req, res) => {
  const wsId = (req as any).user.workspaceId;
  const { name, year, weekNo } = req.body;
  const sprint = await prisma.sprint.create({
    data: { workspaceId: wsId, name: name || `Неделя ${weekNo}`, year, weekNo },
  });
  res.json(sprint);
});

// assign tasks to a sprint (also updates started/completed shortcuts)
sprints.post("/:id/tasks", authGuard, requireEditor, async (req, res) => {
  const sprintId = req.params.id;
  const taskIds: string[] = req.body.taskIds || [];
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  for (const taskId of taskIds) {
    await prisma.taskSprint.upsert({
      where: { taskId_sprintId: { taskId, sprintId } },
      update: {},
      create: { taskId, sprintId },
    });
    // recompute started/completed by week order
    const memberships = await prisma.taskSprint.findMany({
      where: { taskId }, include: { sprint: true },
    });
    const sorted = memberships.sort(
      (a, b) => a.sprint.year - b.sprint.year || a.sprint.weekNo - b.sprint.weekNo
    );
    await prisma.task.update({
      where: { id: taskId },
      data: {
        startedSprintId: sorted[0]?.sprintId ?? null,
        completedSprintId: sorted[sorted.length - 1]?.sprintId ?? null,
      },
    });
  }
  res.json({ ok: true });
});

sprints.delete("/:id/tasks/:taskId", authGuard, requireEditor, async (req, res) => {
  const { id: sprintId, taskId } = req.params;
  await prisma.taskSprint.delete({ where: { taskId_sprintId: { taskId, sprintId } } }).catch(() => {});
  res.json({ ok: true });
});

sprints.get("/:id/summary", authGuard, async (req, res) => {
  const sprintId = req.params.id;
  const members = await prisma.taskSprint.findMany({
    where: { sprintId }, include: { task: true },
  });
  const plan = members.reduce((a, m) => a + (m.task.hoursPlan || 0), 0);
  const fact = members.reduce((a, m) => a + (m.task.hoursFact || 0), 0);
  res.json({ count: members.length, hoursPlan: plan, hoursFact: fact });
});
