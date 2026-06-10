import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Task } from "../types";

export default function TaskDrawer({ task, editable, onClose }: { task: Task; editable: boolean; onClose: () => void; }) {
  const qc = useQueryClient();
  const [f, setF] = useState<Task>(task);
  const set = (k: keyof Task, v: any) => setF((p) => ({ ...p, [k]: v }));
  const save = useMutation({
    mutationFn: () => api.updateTask(task.id, {
      title: f.title, description: f.description, weeekUrl: f.weeekUrl,
      priorityLabel: f.priorityLabel, status: f.status,
      hoursPlan: f.hoursPlan == null ? null : Number(f.hoursPlan),
      hoursFact: f.hoursFact == null ? null : Number(f.hoursFact),
      isConditional: f.isConditional, conditionText: f.conditionText,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); onClose(); },
  });
  const del = useMutation({
    mutationFn: () => api.delTask(task.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); onClose(); },
  });
  const ro = !editable;
  return (
    <div className="drawer-bg" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <input className="d-title" value={f.title} disabled={ro} onChange={(e) => set("title", e.target.value)} />
        <label>Описание / ссылка на ТЗ
          <textarea rows={4} value={f.description || ""} disabled={ro} onChange={(e) => set("description", e.target.value)} /></label>
        <label>Ссылка на задачу в Weeek
          <input value={f.weeekUrl || ""} disabled={ro} onChange={(e) => set("weeekUrl", e.target.value)} /></label>
        <div className="grid2">
          <label>Приоритет
            <select value={f.priorityLabel} disabled={ro} onChange={(e) => set("priorityLabel", e.target.value)}>
              <option value="hot">Горячее</option><option value="high">Высокий</option>
              <option value="medium">Средний</option><option value="low">Низкий</option><option value="none">—</option>
            </select></label>
          <label>Статус
            <select value={f.status} disabled={ro} onChange={(e) => set("status", e.target.value)}>
              <option value="todo">To do</option><option value="in_progress">В работе</option>
              <option value="done">Готово</option><option value="paused">Пауза</option>
            </select></label>
          <label>Часы план
            <input type="number" value={f.hoursPlan ?? ""} disabled={ro} onChange={(e) => set("hoursPlan", e.target.value)} /></label>
          <label>Часы факт
            <input type="number" value={f.hoursFact ?? ""} disabled={ro} onChange={(e) => set("hoursFact", e.target.value)} /></label>
        </div>
        <label className="check">
          <input type="checkbox" checked={f.isConditional} disabled={ro} onChange={(e) => set("isConditional", e.target.checked)} />
          Условный приоритет
        </label>
        {f.isConditional && (
          <label>Условие
            <input value={f.conditionText || ""} disabled={ro} onChange={(e) => set("conditionText", e.target.value)} placeholder="напр. после ≥ 7–10 заказчиков" /></label>
        )}
        {f.taskSprints && f.taskSprints.length > 0 && (
          <p className="muted small">Спринты: {f.taskSprints.map((s) => `н${s.sprint.weekNo}`).join(", ")}</p>
        )}
        {editable && (
          <div className="d-actions">
            <button className="danger" onClick={() => del.mutate()}>Удалить</button>
            <button className="primary" onClick={() => save.mutate()}>Сохранить</button>
          </div>
        )}
      </div>
    </div>
  );
}
