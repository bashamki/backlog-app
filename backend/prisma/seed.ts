import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

const WS = "00000000-0000-0000-0000-000000000001";

async function main() {
  await prisma.workspace.upsert({
    where: { id: WS }, update: {}, create: { id: WS, name: "Demo Team" },
  });

  const hash = bcrypt.hashSync("password", 10);
  await prisma.appUser.upsert({
    where: { workspaceId_email: { workspaceId: WS, email: "pm@demo.local" } },
    update: {}, create: { workspaceId: WS, email: "pm@demo.local", passwordHash: hash, role: "pm_editor" },
  });
  await prisma.appUser.upsert({
    where: { workspaceId_email: { workspaceId: WS, email: "viewer@demo.local" } },
    update: {}, create: { workspaceId: WS, email: "viewer@demo.local", passwordHash: hash, role: "viewer" },
  });

  const existing = await prisma.epic.count({ where: { workspaceId: WS } });
  if (existing === 0) {
    const e1 = await prisma.epic.create({ data: { workspaceId: WS, title: "Онбординг пользователей", color: "#f0b429", position: 1 } });
    const e2 = await prisma.epic.create({ data: { workspaceId: WS, title: "Биллинг и подписки", color: "#3b9c8f", position: 2 } });

    await prisma.task.create({ data: { workspaceId: WS, epicId: e1.id, title: "Экран приветствия с чек-листом", priorityLabel: "hot", status: "in_progress", hoursPlan: 16, hoursFact: 6, position: 1, weeekUrl: "https://app.weeek.net/ws/0/task/1001" } });
    await prisma.task.create({ data: { workspaceId: WS, epicId: e1.id, title: "Импорт данных из старого аккаунта", priorityLabel: "high", status: "todo", hoursPlan: 24, position: 2 } });
    await prisma.task.create({ data: { workspaceId: WS, epicId: e1.id, title: "Подсказки в интерфейсе", priorityLabel: "low", status: "todo", hoursPlan: 8, position: 3 } });
    await prisma.task.create({ data: { workspaceId: WS, epicId: e2.id, title: "Подключение оплаты картой", priorityLabel: "hot", status: "todo", hoursPlan: 40, position: 1, weeekUrl: "https://app.weeek.net/ws/0/task/2001" } });
    await prisma.task.create({ data: { workspaceId: WS, epicId: e2.id, title: "Админка по заказчикам", priorityLabel: "medium", status: "todo", isConditional: true, conditionText: "Делать после ≥ 7–10 заказчиков", hoursPlan: 32, position: 2 } });

    const y = new Date().getFullYear();
    await prisma.sprint.create({ data: { workspaceId: WS, name: "Неделя 24", year: y, weekNo: 24, state: "active" } });
    await prisma.sprint.create({ data: { workspaceId: WS, name: "Неделя 25", year: y, weekNo: 25 } });
  }
  console.log("seed ok");
}
main().catch((e) => { console.error(e); process.exit(0); }).finally(() => prisma.$disconnect());
