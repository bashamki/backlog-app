# ORDO — приложение управления бэклогом

Самостоятельное веб-приложение: бэклог с иерархией Эпик → Задача → Подзадача, приоритизация
перетаскиванием + метки, часы план/факт, условный приоритет, сборка спринтов по неделям
(с поддержкой растягивания задачи на несколько спринтов), связь с Weeek по ссылке.

## Стек
- **Frontend:** React 18 + TypeScript + Vite, TanStack Query, dnd-kit (drag-and-drop). Nginx в проде.
- **Backend:** Node.js + Express + TypeScript, Prisma ORM, JWT-авторизация (роли pm_editor / viewer).
- **БД:** PostgreSQL 16.

## Запуск в Docker
```bash
docker compose up --build
```
- Frontend: http://localhost:8080
- API:      http://localhost:4000/api/v1/health

> При первой сборке нужен доступ в интернет: npm-зависимости и движки Prisma скачиваются во время `docker build`/первого старта (стандартное поведение).

Схема БД синхронизируется автоматически при старте бэкенда (`prisma db push`), затем заполняется демо-данными.

## Демо-доступы
| Логин | Роль | Пароль |
|---|---|---|
| pm@demo.local | Редактор (PM) | password |
| viewer@demo.local | Просмотр (команда) | password |

## Локальная разработка (без Docker)
```bash
# БД
docker run -d --name pg -e POSTGRES_USER=backlog -e POSTGRES_PASSWORD=backlog -e POSTGRES_DB=backlog -p 5432:5432 postgres:16-alpine
# backend
cd backend && npm install && cp .env.example .env   # DATABASE_URL=...localhost:5432...
npx prisma db push && npx tsc prisma/seed.ts --outDir dist ... && node dist/seed.js
npm run dev
# frontend (другой терминал)
cd frontend && npm install && npm run dev   # http://localhost:5173 (проксирует /api на :4000)
```

## Что реализовано (v1)
- Авторизация email+пароль, роли: PM редактирует, команда — только просмотр (UI read-only).
- Эпики и задачи (CRUD), drag-and-drop приоритет внутри эпика.
- Метки приоритета (Горячее/Высокий/Средний/Низкий), статусы, часы план/факт, описание, ссылка на Weeek.
- Условный приоритет + текст условия.
- Спринты по неделям; назначение задач; растягивание на несколько спринтов; суммы часов план/факт.
- Полная модель данных Prisma по спецификации (включая зеркало всех скалярных полей Weeek и дочерние таблицы коллекций).

## Не вошло в v1 (заделы в схеме есть)
- Подзадачи в UI (модель `parentId` готова), кастомные поля (модель `CustomFieldDef` + `task.ext`),
  фильтры/поиск в UI, история изменений (`TaskHistory`), реальная синхронизация с Weeek.

## Структура
```
backlog-app/
├─ docker-compose.yml
├─ backend/   Express + Prisma API
│  ├─ prisma/schema.prisma   # полная модель данных
│  └─ src/                   # auth, routes (epics/tasks/sprints)
└─ frontend/  React + Vite SPA
   └─ src/                   # pages (Login/Backlog/Sprints), components, api, auth
```
