const base = "/api/v1";
const tok = () => localStorage.getItem("token");

async function req(path: string, opts: any = {}) {
  const r = await fetch(base + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as any).error || r.statusText);
  return r.status === 204 ? null : r.json();
}

export const api = {
  login: (email: string, password: string) =>
    req("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  epics: () => req("/epics"),
  addEpic: (d: any) => req("/epics", { method: "POST", body: JSON.stringify(d) }),
  tasks: () => req("/tasks"),
  addTask: (d: any) => req("/tasks", { method: "POST", body: JSON.stringify(d) }),
  updateTask: (id: string, d: any) => req(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  reorder: (id: string, prevPos: number | null, nextPos: number | null) =>
    req(`/tasks/${id}/reorder`, { method: "PATCH", body: JSON.stringify({ prevPos, nextPos }) }),
  delTask: (id: string) => req(`/tasks/${id}`, { method: "DELETE" }),
  sprints: () => req("/sprints"),
  addSprint: (d: any) => req("/sprints", { method: "POST", body: JSON.stringify(d) }),
  assign: (sprintId: string, taskIds: string[]) =>
    req(`/sprints/${sprintId}/tasks`, { method: "POST", body: JSON.stringify({ taskIds }) }),
  unassign: (sprintId: string, taskId: string) =>
    req(`/sprints/${sprintId}/tasks/${taskId}`, { method: "DELETE" }),
};
