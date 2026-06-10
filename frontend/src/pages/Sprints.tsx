import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { useAuth } from "../auth";
import type { Sprint, Task } from "../types";

export default function Sprints() {
  const { isEditor } = useAuth();
  const qc = useQueryClient();
  const sprintsQ = useQuery<Sprint[]>({ queryKey: ["sprints"], queryFn: api.sprints });
  const tasksQ = useQuery<Task[]>({ queryKey: ["tasks"], queryFn: api.tasks });
  const [week, setWeek] = useState<number>(() => isoWeek(new Date()));

  const assign = useMutation({
    mutationFn: (p: { sprintId: string; taskId: string }) => api.assign(p.sprintId, [p.taskId]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sprints"] }); qc.invalidateQueries({ queryKey: ["tasks"] }); },
  });
  const unassign = useMutation({
    mutationFn: (p: { sprintId: string; taskId: string }) => api.unassign(p.sprintId, p.taskId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sprints"] }); qc.invalidateQueries({ queryKey: ["tasks"] }); },
  });
  const addSprint = useMutation({
    mutationFn: () => api.addSprint({ name: `Неделя ${week}`, year: new Date().getFullYear(), weekNo: week }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sprints"] }),
  });

  if (sprintsQ.isLoading || tasksQ.isLoading) return <p className="muted pad">Загрузка…</p>;
  const sprints = sprintsQ.data || [];
  const tasks = tasksQ.data || [];
  const inSprint = (t: Task, sid: string) => (t.taskSprints || []).some((s) => s.sprint.id === sid);
  const backlog = tasks.filter((t) => !(t.taskSprints && t.taskSprints.length));

  return (
    <div className="page">
      <div className="page-head">
        <h2>Спринты</h2>
        {isEditor && (
          <span className="add-sprint">
            неделя <input type="number" value={week} onChange={(e) => setWeek(Number(e.target.value))} />
            <button className="primary" onClick={() => addSprint.mutate()}>+ Спринт</button>
          </span>
        )}
      </div>
      <div className="board">
        <div className="col">
          <div className="col-h">Backlog <span className="cnt">{backlog.length}</span></div>
          {backlog.map((t) => (
            <div className="scard" key={t.id}>
              <div className="sc-title">{t.title}</div>
              <div className="sc-bot">
                <span className="hours">{t.hoursPlan ?? 0}ч</span>
                {isEditor && sprints.length > 0 && (
                  <select defaultValue="" onChange={(e) => e.target.value && assign.mutate({ sprintId: e.target.value, taskId: t.id })}>
                    <option value="">→ в спринт</option>
                    {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
        {sprints.map((s) => {
          const items = tasks.filter((t) => inSprint(t, s.id)).sort((a, b) => a.position - b.position);
          const plan = items.reduce((a, t) => a + (t.hoursPlan || 0), 0);
          const fact = items.reduce((a, t) => a + (t.hoursFact || 0), 0);
          return (
            <div className="col" key={s.id}>
              <div className="col-h">{s.name} <span className="cnt">{plan}/{fact}ч</span></div>
              {items.map((t) => (
                <div className="scard" key={t.id}>
                  <div className="sc-title">{t.title}</div>
                  <div className="sc-bot">
                    {t.taskSprints && t.taskSprints.length > 1 && (
                      <span className="span" title="растянута на несколько спринтов">
                        н{Math.min(...t.taskSprints.map((x) => x.sprint.weekNo))}→н{Math.max(...t.taskSprints.map((x) => x.sprint.weekNo))}
                      </span>
                    )}
                    {isEditor && <button className="x" onClick={() => unassign.mutate({ sprintId: s.id, taskId: t.id })}>×</button>}
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="muted small pad">пусто</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isoWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
