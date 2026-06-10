import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "../api";
import { useAuth } from "../auth";
import type { Epic, Task } from "../types";
import TaskDrawer from "../components/TaskDrawer";

const LABELS: Record<string, { t: string; c: string }> = {
  hot: { t: "Горячее", c: "#e5484d" }, high: { t: "Высокий", c: "#e8943a" },
  medium: { t: "Средний", c: "#3b9c8f" }, low: { t: "Низкий", c: "#6f6a5c" }, none: { t: "—", c: "#444" },
};
const STATUS: Record<string, string> = { todo: "To do", in_progress: "В работе", done: "Готово", paused: "Пауза" };

function Row({ task, onEdit, editable }: { task: Task; onEdit: () => void; editable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id, disabled: !editable });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const lab = LABELS[task.priorityLabel];
  return (
    <div ref={setNodeRef} style={style} className="row">
      {editable && <span className="grip" {...attributes} {...listeners}>⋮⋮</span>}
      <span className="r-title" onClick={onEdit}>
        {task.title}
        {task.isConditional && <span className="cond" title={task.conditionText || ""}>условный</span>}
      </span>
      <span className="chip" style={{ background: lab.c }}>{lab.t}</span>
      <span className="status">{STATUS[task.status]}</span>
      <span className="hours">{task.hoursFact ?? 0}/{task.hoursPlan ?? 0}ч</span>
      {task.weeekUrl && <a className="weeek" href={task.weeekUrl} target="_blank">Weeek</a>}
    </div>
  );
}

function EpicBlock({ epic, tasks, editable, onEdit }: { epic: Epic; tasks: Task[]; editable: boolean; onEdit: (t: Task) => void; }) {
  const qc = useQueryClient();
  const [items, setItems] = useState(tasks);
  React.useEffect(() => setItems(tasks), [tasks]);
  const reorder = useMutation({
    mutationFn: (p: { id: string; prev: number | null; next: number | null }) => api.reorder(p.id, p.prev, p.next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const onDragEnd = (e: any) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldI = items.findIndex((t) => t.id === active.id);
    const newI = items.findIndex((t) => t.id === over.id);
    const moved = arrayMove(items, oldI, newI);
    setItems(moved);
    const prev = moved[newI - 1]?.position ?? null;
    const next = moved[newI + 1]?.position ?? null;
    reorder.mutate({ id: active.id, prev, next });
  };
  return (
    <section className="epic">
      <h3 style={{ borderColor: epic.color }}>{epic.title}<span className="cnt">{items.length}</span></h3>
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {items.map((t) => <Row key={t.id} task={t} editable={editable} onEdit={() => onEdit(t)} />)}
        </SortableContext>
      </DndContext>
    </section>
  );
}

export default function Backlog() {
  const { isEditor } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Task | null>(null);
  const epicsQ = useQuery<Epic[]>({ queryKey: ["epics"], queryFn: api.epics });
  const tasksQ = useQuery<Task[]>({ queryKey: ["tasks"], queryFn: api.tasks });
  const addTask = useMutation({
    mutationFn: (epicId: string) => api.addTask({ epicId, title: "Новая задача" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const addEpic = useMutation({
    mutationFn: () => api.addEpic({ title: "Новый эпик" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["epics"] }),
  });

  if (epicsQ.isLoading || tasksQ.isLoading) return <p className="muted pad">Загрузка…</p>;
  const epics = epicsQ.data || [];
  const tasks = tasksQ.data || [];
  const byEpic = (id: string) => tasks.filter((t) => t.epicId === id).sort((a, b) => a.position - b.position);

  return (
    <div className="page">
      <div className="page-head">
        <h2>Бэклог</h2>
        {isEditor && <button className="primary" onClick={() => addEpic.mutate()}>+ Эпик</button>}
      </div>
      {epics.map((e) => (
        <div key={e.id}>
          <EpicBlock epic={e} tasks={byEpic(e.id)} editable={isEditor} onEdit={setEditing} />
          {isEditor && <button className="add-task" onClick={() => addTask.mutate(e.id)}>+ задача</button>}
        </div>
      ))}
      {editing && <TaskDrawer task={editing} editable={isEditor} onClose={() => setEditing(null)} />}
    </div>
  );
}
